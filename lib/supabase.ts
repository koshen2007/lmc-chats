import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  created_by?: string;
  created_at: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  group_id: string;
  sender_name: string;
  sender_avatar: string;
  content: string;
  msg_type: 'text' | 'sticker' | 'gif' | 'image';
  media_url?: string;
  reactions: Record<string, number>;
  created_at: string;
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

