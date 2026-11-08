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

export interface Message {
  id: string;
  group_id: string;
  sender_name: string;
  sender_username?: string;
  sender_avatar: string;
  sender_bio?: string;
  content: string;
  msg_type: 'text' | 'sticker' | 'gif' | 'image' | 'audio' | 'music_bot';
  media_url?: string;
  reactions: Record<string, number>;
  created_at: string;
  burn_after_read?: boolean;
  burn_seconds?: number;
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
