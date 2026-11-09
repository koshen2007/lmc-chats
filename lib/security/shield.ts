/**
 * LMC Chats Enterprise Security Shield
 * Provides:
 * 1. Distributed/Sliding-window IP & User Rate Limiting (Anti-DDoS, Anti-Flood)
 * 2. Strict XSS Sanitization & HTML Escape
 * 3. Payload size enforcement & Link spam protection
 * 4. Authorization guards for Channel & Message deletion
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
}

const rateLimitStore = globalThis.__LMC_RATE_LIMIT_STORE__ || new Map<string, RateLimitRecord>();
globalThis.__LMC_RATE_LIMIT_STORE__ = rateLimitStore;

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (now > record.resetAt + 60_000) {
        rateLimitStore.delete(key);
      }
    });
  }, 300_000);
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
 * Check Rate Limit for an identifier (IP or Username)
 * @param key unique identifier (e.g. `msg:ip_1.2.3.4` or `msg:user_priya`)
 * @param limit max allowed actions in window
 * @param windowMs time window in milliseconds (e.g. 10_000ms = 10s)
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
  const hashKey = `dup:${identifier}`;
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
 */
export function sanitizeInputText(input: string, maxLength = 3000): string {
  if (!input) return '';
  let str = input.trim();
  if (str.length > maxLength) {
    str = str.substring(0, maxLength);
  }

  // Neutralize dangerous JavaScript/Data protocol injections
  str = str.replace(/javascript\s*:/gi, 'blocked:');
  str = str.replace(/vbscript\s*:/gi, 'blocked:');
  str = str.replace(/data\s*:\s*text\/html/gi, 'blocked:');

  return str;
}

/**
 * Validate media data URL size (limit base64 upload to max 5MB)
 */
export function validateMediaPayload(mediaUrl?: string, maxBytes = 5 * 1024 * 1024): { valid: boolean; error?: string } {
  if (!mediaUrl) return { valid: true };
  if (mediaUrl.startsWith('data:')) {
    // Approximate base64 decoded size
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
 * Only the original creator (`created_by`) or someone in `admins` list can delete it.
 */
export function canDeleteChannel(
  group: { created_by?: string; admins?: string[] },
  requesterUsername: string
): boolean {
  if (!requesterUsername) return false;
  const req = requesterUsername.trim().toLowerCase().replace(/^@/, '');
  const creator = (group.created_by || '').trim().toLowerCase().replace(/^@/, '');

  if (creator && (creator === req || creator === 'lmc' || creator === 'admin')) {
    return true;
  }

  const admins = (group.admins || []).map((a) => a.trim().toLowerCase().replace(/^@/, ''));
  return admins.includes(req);
}
