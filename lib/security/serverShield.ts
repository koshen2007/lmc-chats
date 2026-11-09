import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// In-memory Nonce Cache for zero-allocation replay lookup (retained for 60 seconds)
interface NonceRecord {
  timestamp: number;
}
const memoryNonceCache = new Map<string, NonceRecord>();

// Clean up stale nonces every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryNonceCache.forEach((rec, nonce) => {
      if (now - rec.timestamp > 60_000) {
        memoryNonceCache.delete(nonce);
      }
    });
  }, 60_000);
}

// Token Bucket Tracking for Burst & Shadowban Engine
interface TokenBucketRecord {
  tokens: number;
  lastRefill: number;
  violations: number;
}
const tokenBucketStore = new Map<string, TokenBucketRecord>();

function getBannedStoragePath(): string {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (isVercel) {
      return path.join('/tmp', 'lmc_banned_users.json');
    }
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'banned_users.json');
  } catch {
    return path.join(process.cwd(), 'banned_users.json');
  }
}

function getShadowStoragePath(): string {
  try {
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (isVercel) {
      return path.join('/tmp', 'lmc_shadow_users.json');
    }
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'shadow_users.json');
  } catch {
    return path.join(process.cwd(), 'shadow_users.json');
  }
}

/**
 * ---------------------------------------------------------------------------
 * BANNED USERS REPOSITORY (HARD BAN)
 * ---------------------------------------------------------------------------
 */
export function getBannedUsersList(): { username: string; user_id?: string; reason?: string }[] {
  try {
    const filePath = getBannedStoragePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function isUserBanned(username?: string, userId?: string): boolean {
  if (!username && !userId) return false;
  const list = getBannedUsersList();
  const cleanUser = (username || '').trim().toLowerCase().replace(/^@/, '');
  const cleanId = (userId || '').trim().toLowerCase();

  return list.some((b) => {
    const bUser = (b.username || '').trim().toLowerCase().replace(/^@/, '');
    const bId = (b.user_id || '').trim().toLowerCase();
    return (cleanUser && bUser === cleanUser) || (cleanId && bId && bId === cleanId);
  });
}

export function addBannedUser(username: string, userId?: string, reason?: string): void {
  const list = getBannedUsersList();
  const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
  if (!list.some((b) => b.username.toLowerCase() === cleanUser)) {
    list.push({
      username: cleanUser,
      user_id: userId,
      reason: reason || 'Banned by admin',
    });
    try {
      const filePath = getBannedStoragePath();
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch {}
  }
}

/**
 * ---------------------------------------------------------------------------
 * SHADOWBANNED USERS REPOSITORY (SILENT DECEPTION)
 * ---------------------------------------------------------------------------
 */
export function getShadowbannedUsersList(): {
  username: string;
  user_id?: string;
  reason?: string;
  timestamp: string;
}[] {
  try {
    const filePath = getShadowStoragePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function isUserShadowbanned(username?: string, userId?: string): boolean {
  if (!username && !userId) return false;
  const list = getShadowbannedUsersList();
  const cleanUser = (username || '').trim().toLowerCase().replace(/^@/, '');
  const cleanId = (userId || '').trim().toLowerCase();

  return list.some((b) => {
    const bUser = (b.username || '').trim().toLowerCase().replace(/^@/, '');
    const bId = (b.user_id || '').trim().toLowerCase();
    return (cleanUser && bUser === cleanUser) || (cleanId && bId && bId === cleanId);
  });
}

export function shadowbanUser(username: string, userId?: string, reason?: string): void {
  const list = getShadowbannedUsersList();
  const cleanUser = (username || '').trim().toLowerCase().replace(/^@/, '');
  const cleanId = (userId || '').trim().toLowerCase();

  const exists = list.some(
    (b) =>
      (cleanUser && b.username.toLowerCase() === cleanUser) ||
      (cleanId && b.user_id?.toLowerCase() === cleanId)
  );

  if (!exists) {
    list.push({
      username: cleanUser,
      user_id: userId,
      reason: reason || 'Triggered honeypot or burst violation',
      timestamp: new Date().toISOString(),
    });
    try {
      const filePath = getShadowStoragePath();
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch {}
  }
}

/**
 * ---------------------------------------------------------------------------
 * NONCE REPLAY ENGINE (ANTI-REPLAY ATTACK)
 * ---------------------------------------------------------------------------
 */
export function verifyAndConsumeNonce(nonce?: string): { allowed: boolean; error?: string } {
  if (!nonce || !nonce.trim()) {
    // If no nonce provided, mark as unauthenticated/legacy
    return { allowed: true };
  }

  const cleanNonce = nonce.trim();
  const now = Date.now();

  if (memoryNonceCache.has(cleanNonce)) {
    return {
      allowed: false,
      error: `REPLAY_ATTACK_DETECTED: Nonce "${cleanNonce}" has already been consumed. Replay rejected.`,
    };
  }

  memoryNonceCache.set(cleanNonce, { timestamp: now });
  return { allowed: true };
}

/**
 * ---------------------------------------------------------------------------
 * 15-SECOND REPLAY WINDOW LOCK
 * ---------------------------------------------------------------------------
 */
export function validateReplayWindow(
  createdAtIso?: string,
  maxWindowSeconds = 15
): { valid: boolean; error?: string } {
  if (!createdAtIso) {
    return { valid: true };
  }

  const msgTime = new Date(createdAtIso).getTime();
  if (isNaN(msgTime)) {
    return { valid: false, error: 'Invalid timestamp format in created_at.' };
  }

  const now = Date.now();
  const diffSeconds = Math.abs(now - msgTime) / 1000;

  if (diffSeconds > maxWindowSeconds) {
    return {
      valid: false,
      error: `REPLAY_WINDOW_EXPIRED: Timestamp is ${Math.round(diffSeconds)}s old (Strict max window: ${maxWindowSeconds}s).`,
    };
  }

  return { valid: true };
}

/**
 * ---------------------------------------------------------------------------
 * TOKEN BUCKET BURST & SHADOWBAN ENGINE
 * Max burst: 4 messages per 5 seconds.
 * If burst violated 3 times -> automatically shadowban user.
 * ---------------------------------------------------------------------------
 */
export function evaluateTokenBucket(
  senderIdent: string,
  userId?: string
): { allowed: boolean; isShadow: boolean; violationCount: number } {
  if (!senderIdent) {
    return { allowed: true, isShadow: false, violationCount: 0 };
  }

  // If already shadowbanned, return immediately as shadow
  if (isUserShadowbanned(senderIdent, userId)) {
    return { allowed: true, isShadow: true, violationCount: 99 };
  }

  const key = senderIdent.trim().toLowerCase();
  const now = Date.now();
  const CAPACITY = 4; // Max burst of 4
  const REFILL_WINDOW_MS = 5000; // 5 seconds

  let record = tokenBucketStore.get(key);
  if (!record) {
    record = {
      tokens: CAPACITY - 1, // First message consumes 1 token
      lastRefill: now,
      violations: 0,
    };
    tokenBucketStore.set(key, record);
    return { allowed: true, isShadow: false, violationCount: 0 };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - record.lastRefill;
  if (elapsed >= REFILL_WINDOW_MS) {
    record.tokens = CAPACITY;
    record.lastRefill = now;
  }

  if (record.tokens > 0) {
    record.tokens -= 1;
    return { allowed: true, isShadow: false, violationCount: record.violations };
  }

  // Tokens exhausted: Burst limit violation!
  record.violations += 1;

  if (record.violations >= 3) {
    // 3rd violation: silently shadowban the attacker
    shadowbanUser(senderIdent, userId, 'Exceeded Token Bucket Burst Violations (3x)');
    return { allowed: true, isShadow: true, violationCount: record.violations };
  }

  // Reject with 429 for initial burst violations before shadowban kicks in
  return { allowed: false, isShadow: false, violationCount: record.violations };
}

/**
 * ---------------------------------------------------------------------------
 * MERKLE HASH CHAIN COMPUTATION (SHA-256)
 * ---------------------------------------------------------------------------
 */
export function computeMerkleHash(prevHash: string, content: string, signature = ''): string {
  const hash = crypto.createHash('sha256');
  hash.update(`${prevHash || 'GENESIS'}|${content}|${signature}`);
  return hash.digest('hex');
}
