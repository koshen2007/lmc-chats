import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  created_by?: string;
  created_at: string;
  unreadCount?: number;
  is_private?: boolean;
  members?: string[];
  admins?: string[];
  join_requests?: string[];
  is_read_only?: boolean;
  slow_mode?: boolean;
}

export interface MessageReplyContext {
  id: string;
  sender_name: string;
  sender_username?: string;
  content: string;
  msg_type?:
    | 'text'
    | 'sticker'
    | 'gif'
    | 'image'
    | 'audio'
    | 'music_bot'
    | 'poll'
    | 'bunk_meter'
    | 'confession'
    | 'whisper'
    | 'roast'
    | 'decision';
  media_url?: string;
}

export interface Message {
  id: string;
  group_id: string;
  sender_name: string;
  sender_username?: string;
  sender_avatar: string;
  sender_bio?: string;
  user_id?: string;
  sender_id?: string;
  content: string;
  msg_type:
    | 'text'
    | 'sticker'
    | 'gif'
    | 'image'
    | 'audio'
    | 'music_bot'
    | 'poll'
    | 'bunk_meter'
    | 'confession'
    | 'whisper'
    | 'roast'
    | 'decision';
  media_url?: string;
  reactions: Record<string, number>;
  created_at: string;
  burn_after_read?: boolean;
  burn_seconds?: number;
  read_by?: string[];
  reply_to?: MessageReplyContext | null;
  // Interactive Bot & Slash Command Metadata
  metadata?: Record<string, any>;
  // Zero-Trust Cryptographic & Integrity Fields
  nonce?: string;
  signature?: string;
  public_key?: string;
  prev_hash?: string;
  msg_hash?: string;
  is_shadow?: boolean;
}

export interface UserDevice {
  user_id: string;
  public_key: string;
  trust_score: number;
  is_shadowbanned: boolean;
  created_at: string;
}

export interface MessageNonce {
  nonce: string;
  created_at: string;
}

export interface BannedUser {
  id: string;
  username: string;
  name?: string;
  banned_at: string;
  banned_by: string;
  reason?: string;
  channel_id?: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseUrl.startsWith('http')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

/**
 * Server-side Supabase Client for API routes
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';

  if (!url || !key || url.includes('your-project-id') || !url.startsWith('http')) {
    return null;
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

/**
 * Sign In with Google OAuth via Supabase
 */
export async function signInWithGoogle() {
  if (isSupabaseConfigured && supabase) {
    return await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    });
  }
  return null;
}

/**
 * Sign out user
 */
export async function signOutUser() {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
}
