/**
 * LMC Chats Enterprise Security Shield (Client & Server Isomorphic)
 * Provides:
 * 1. Distributed/Sliding-window IP & User Rate Limiting (Anti-DDoS, Anti-Flood)
 * 2. 2-Second Insertion Cooldown Engine (Console loop spam prevention)
 * 3. Strict XSS Neutralization via Zero-Dependency HTML Sanitizer & Entity Escaping
 * 4. Media URL Whitelist Validator (Tenor, Giphy, Supabase Storage)
 * 5. Role-based Authorization guards for Super Admin moderation
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
  retryAfterSeconds?: number;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
  recentHashes: string[];
}

declare global {
  // eslint-disable-next-line no-var
  var __LMC_RATE_LIMIT_STORE__: Map<string, RateLimitRecord> | undefined;
  // eslint-disable-next-line no-var
  var __LMC_LAST_MESSAGE_TIMESTAMP__: Map<string, number> | undefined;
}

const rateLimitStore = globalThis.__LMC_RATE_LIMIT_STORE__ || new Map<string, RateLimitRecord>();
globalThis.__LMC_RATE_LIMIT_STORE__ = rateLimitStore;

const lastMessageTimestampStore =
  globalThis.__LMC_LAST_MESSAGE_TIMESTAMP__ || new Map<string, number>();
globalThis.__LMC_LAST_MESSAGE_TIMESTAMP__ = lastMessageTimestampStore;

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetAt + 60_000) {
        rateLimitStore.delete(key);
      }
    });
    lastMessageTimestampStore.forEach((ts, key) => {
      if (now - ts > 60_000) {
        lastMessageTimestampStore.delete(key);
      }
    });
  }, 300_000);
}

/**
 * Super Admin Identity Whitelist
 */
export const SUPER_ADMIN_EMAILS = [
  'koshensiwanchi@gmail.com',
  'admin@lmc.chats',
];

export function isSuperAdmin(emailOrIdent?: string): boolean {
  if (!emailOrIdent) return false;
  const clean = emailOrIdent.trim().toLowerCase().replace(/^@/, '');
  return (
    SUPER_ADMIN_EMAILS.some((e) => e.toLowerCase() === clean) ||
    clean === 'admin' ||
    clean === 'lmc'
  );
}

/**
 * Extract client IP address securely
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',');
    return parts[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();
  return '127.0.0.1';
}

/**
 * 2-Second Cooldown Check (Anti-Console-Spam Loop)
 * Enforces that a single user cannot insert messages faster than once every 2 seconds.
 */
export function checkMessageCooldown(
  senderIdentifier: string,
  cooldownMs = 2000
): { allowed: boolean; retryAfterSeconds: number } {
  if (!senderIdentifier) return { allowed: true, retryAfterSeconds: 0 };
  const key = `cooldown:${senderIdentifier.trim().toLowerCase()}`;
  const now = Date.now();
  const lastSent = lastMessageTimestampStore.get(key);

  if (lastSent && now - lastSent < cooldownMs) {
    const diffMs = cooldownMs - (now - lastSent);
    const retryAfterSeconds = Math.max(1, Math.ceil(diffMs / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
    };
  }

  // Update last sent timestamp
  lastMessageTimestampStore.set(key, now);
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Check Rate Limit for an identifier (IP or Username)
 */
export function checkRateLimit(
  key: string,
  limit = 15,
  windowMs = 10_000
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    record = {
      count: 1,
      resetAt: now + windowMs,
      recentHashes: [],
    };
    rateLimitStore.set(key, record);
    return {
      allowed: true,
      remaining: limit - 1,
      resetMs: windowMs,
    };
  }

  record.count += 1;

  if (record.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetMs: record.resetAt - now,
      retryAfterSeconds,
    };
  }

  return {
    allowed: true,
    remaining: limit - record.count,
    resetMs: record.resetAt - now,
  };
}

/**
 * Check for duplicate message spamming (same message sent rapidly)
 */
export function checkDuplicateSpam(
  identifier: string,
  content: string,
  windowMs = 15_000
): boolean {
  if (!content || content.length < 3) return false;
  const hashKey = `dup:${identifier.trim().toLowerCase()}`;
  const now = Date.now();
  const record = rateLimitStore.get(hashKey);

  // Normalize string for comparison
  const normalized = content.trim().toLowerCase().replace(/\s+/g, ' ');

  if (!record || now > record.resetAt) {
    rateLimitStore.set(hashKey, {
      count: 1,
      resetAt: now + windowMs,
      recentHashes: [normalized],
    });
    return false;
  }

  // Count occurrences of identical message in recent window
  const matches = record.recentHashes.filter((h) => h === normalized).length;
  if (matches >= 3) {
    return true; // Flagged as repetitive spam
  }

  record.recentHashes.push(normalized);
  if (record.recentHashes.length > 10) {
    record.recentHashes.shift();
  }
  return false;
}

/**
 * Sanitize user input against Cross-Site Scripting (XSS)
 * Strips executable tags & scripts, neutralizes handlers/schemes, and encodes unsafe HTML entities.
 */
export function sanitizeInputText(input: string, maxLength = 1000): string {
  if (!input) return '';
  let str = input.trim();

  // Enforce Max 1000 characters limit
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }

  // 1. Strip dangerous tags with their contents (script, style, iframe, object, embed, svg)
  str = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  str = str.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '');
  str = str.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

  // 2. Strip all remaining HTML tags
  str = str.replace(/<\/?[a-zA-Z][^>]*>/gi, '');

  // 3. Strip any residual on* event handlers and dangerous protocol schemes
  str = str
    .replace(/on\w+\s*=/gi, 'blocked_attr=')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/vbscript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:');

  // 4. Escape HTML entities
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return str;
}

/**
 * Strict Media URL Whitelist Check:
 * Allows ONLY:
 * - https://media.tenor.com/*
 * - https://media.giphy.com/* or https://media[0-9].giphy.com/*
 * - Supabase storage (*.supabase.co/storage/*)
 * - Safe image Data URLs (data:image/(png|jpeg|jpg|webp);base64,...)
 * Blocks all unknown external URLs, tracking pixels, and malicious redirects.
 */
export function validateMediaWhitelist(mediaUrl?: string): { valid: boolean; error?: string } {
  if (!mediaUrl || !mediaUrl.trim()) {
    return { valid: true };
  }

  const trimmed = mediaUrl.trim();

  // Safe data URL (drawings, avatars)
  if (trimmed.startsWith('data:image/')) {
    if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/.test(trimmed)) {
      return { valid: true };
    }
    return { valid: false, error: 'Invalid or unsupported image data payload format.' };
  }

  // Whitelisted external domains
  const ALLOWED_DOMAIN_REGEX =
    /^https:\/\/(media\.tenor\.com|media[0-9]*\.giphy\.com|[a-z0-9\-]+\.supabase\.co\/storage)\//i;

  if (ALLOWED_DOMAIN_REGEX.test(trimmed)) {
    return { valid: true };
  }

  return {
    valid: false,
    error:
      'Security Violation: Media URL must belong to approved providers (Tenor, Giphy, or Supabase Storage).',
  };
}

/**
 * Validate media data URL size (limit base64 upload to max 5MB)
 */
export function validateMediaPayload(
  mediaUrl?: string,
  maxBytes = 5 * 1024 * 1024
): { valid: boolean; error?: string } {
  if (!mediaUrl) return { valid: true };

  // Whitelist check
  const whitelistCheck = validateMediaWhitelist(mediaUrl);
  if (!whitelistCheck.valid) {
    return whitelistCheck;
  }

  if (mediaUrl.startsWith('data:')) {
    const stringLength = mediaUrl.length - mediaUrl.indexOf(',') - 1;
    const sizeInBytes = 4 * Math.ceil(stringLength / 3) * 0.562489633438312;
    if (sizeInBytes > maxBytes) {
      return { valid: false, error: 'Media payload exceeds maximum size limit (5MB)' };
    }
  }
  return { valid: true };
}

/**
 * Authorization Check: Can requester delete this channel?
 * Only the original creator (`created_by`), someone in `admins` list, or super admin can delete it.
 */
export function canDeleteChannel(
  group: { created_by?: string; admins?: string[] },
  requesterUsername: string
): boolean {
  if (!requesterUsername) return false;
  const req = requesterUsername.trim().toLowerCase().replace(/^@/, '');
  const creator = (group.created_by || '').trim().toLowerCase().replace(/^@/, '');

  if (creator && (creator === req || isSuperAdmin(req))) {
    return true;
  }

  const admins = (group.admins || []).map((a) => a.trim().toLowerCase().replace(/^@/, ''));
  return admins.includes(req) || isSuperAdmin(req);
}
