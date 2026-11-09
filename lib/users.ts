import { PRESET_AVATARS, renderAvatarSvgString, svgToDataUrl } from './avatarStudio';

export interface UserProfile {
  id: string; // unique ID
  username: string; // unique lowercase username
  name: string; // Display Name (can be shared)
  avatar: string; // Avatar Data URL or URL
  bio?: string;
  status?: 'online' | 'idle' | 'dnd';
  role?: 'admin' | 'user';
  provider?: 'google' | 'custom';
  email?: string;
  created_at?: string;
}

// Global registered users directory (starts empty; only real registered users exist)
export const SEED_USERS: UserProfile[] = [];

/**
 * Validate username format:
 * - 3 to 20 chars
 * - lowercase letters, numbers, underscores only
 */
export function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: 'Username is required' };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  if (trimmed.length > 20) {
    return { valid: false, error: 'Username cannot exceed 20 characters' };
  }
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Only letters, numbers, and underscores allowed' };
  }
  return { valid: true };
}

/**
 * Check if a username is unique among existing users
 */
export function isUsernameAvailable(
  username: string,
  existingUsers: UserProfile[],
  currentUserId?: string
): boolean {
  const normalized = username.trim().toLowerCase();
  if (!normalized) return false;
  return !existingUsers.some(
    (u) => u.username.toLowerCase() === normalized && u.id !== currentUserId
  );
}

/**
 * Instagram-Style Ranked Search:
 * Prioritizes:
 * 1. Username starts with query (e.g. typing "h" -> @harshita)
 * 2. Display Name starts with query (e.g. typing "h" -> Harshita)
 * 3. User ID starts with query (e.g. usr_h...)
 * 4. Username or Name contains query
 */
export function searchUsersInstagramStyle(
  query: string,
  users: UserProfile[]
): UserProfile[] {
  const q = query.trim().toLowerCase().replace(/^@/, '');
  if (!q) return users;

  const exactUsernamePrefix: UserProfile[] = [];
  const namePrefix: UserProfile[] = [];
  const idPrefix: UserProfile[] = [];
  const otherMatches: UserProfile[] = [];

  const seenIds = new Set<string>();

  for (const u of users) {
    if (!u || seenIds.has(u.id)) continue;

    const uName = (u.username || '').toLowerCase();
    const dName = (u.name || '').toLowerCase();
    const uId = (u.id || '').toLowerCase();
    const uBio = (u.bio || '').toLowerCase();

    if (uName.startsWith(q)) {
      exactUsernamePrefix.push(u);
      seenIds.add(u.id);
    } else if (dName.startsWith(q) || dName.split(/\s+/).some((part) => part.startsWith(q))) {
      namePrefix.push(u);
      seenIds.add(u.id);
    } else if (uId.startsWith(q) || uId.startsWith(`usr_${q}`)) {
      idPrefixUsers: idPrefix.push(u);
      seenIds.add(u.id);
    } else if (uName.includes(q) || dName.includes(q) || uId.includes(q) || uBio.includes(q)) {
      otherMatches.push(u);
      seenIds.add(u.id);
    }
  }

  return [...exactUsernamePrefix, ...namePrefix, ...idPrefix, ...otherMatches];
}
