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

// Pre-seeded community members for instant discovery & adding
export const SEED_USERS: UserProfile[] = [
  {
    id: 'usr_kai',
    username: 'kai',
    name: 'Kai Renner',
    avatar: svgToDataUrl(renderAvatarSvgString(PRESET_AVATARS[0].config)),
    bio: 'Streetwear & Valorant enthusiast • Late-night gamer 🎮',
    status: 'online',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'usr_aria',
    username: 'aria',
    name: 'Aria Chen',
    avatar: svgToDataUrl(renderAvatarSvgString(PRESET_AVATARS[1].config)),
    bio: 'UI designer & Lofi music creator 🎧☕',
    status: 'online',
    created_at: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'usr_zayn',
    username: 'zayn',
    name: 'Zayn Malik',
    avatar: svgToDataUrl(renderAvatarSvgString(PRESET_AVATARS[2].config)),
    bio: 'Beats producer & Cyber night rider 🏎️⚡',
    status: 'idle',
    created_at: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'usr_rin',
    username: 'rin',
    name: 'Rin Takahashi',
    avatar: svgToDataUrl(renderAvatarSvgString(PRESET_AVATARS[3].config)),
    bio: 'Cyberpunk anime coder • Tokyo vibes 🌸',
    status: 'online',
    created_at: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 'usr_marcus',
    username: 'marcus',
    name: 'Marcus Vance',
    avatar: svgToDataUrl(renderAvatarSvgString(PRESET_AVATARS[4].config)),
    bio: 'Senior engineer & squad community admin 🛡️',
    status: 'dnd',
    created_at: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'usr_elena',
    username: 'elena',
    name: 'Elena Rostova',
    avatar: svgToDataUrl(renderAvatarSvgString(PRESET_AVATARS[5].config)),
    bio: 'Digital artist & coffee addict ☕✨',
    status: 'online',
    created_at: '2026-01-06T00:00:00.000Z',
  },
];

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
