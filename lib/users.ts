import { PRESET_AVATARS, renderAvatarSvgString, svgToDataUrl } from './avatarStudio';

export interface UserProfile {
  id: string; // unique ID e.g. "usr_koshen"
  username: string; // unique lowercase username e.g. "koshen"
  name: string; // Display Name e.g. "Koshen Siwanchi" (can be shared)
  avatar: string; // Avatar Data URL or URL
  bio?: string;
  status?: 'online' | 'idle' | 'dnd';
  created_at?: string;
}

// Global registered users directory (starts empty; only real users who register will appear)
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

