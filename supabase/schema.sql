-- =========================================================================
-- LMC Chats Production Supabase Schema
-- Supports: Groups, Messages, Users, Presence, and WebRTC Calling Signaling
-- =========================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- 1. USERS DIRECTORY TABLE
create table if not exists public.users (
    id text primary key,
    username text not null unique,
    name text not null,
    avatar text default '',
    bio text default '',
    status text default 'online', -- 'online' | 'idle' | 'dnd'
    last_seen timestamptz default now(),
    role text default 'user',      -- 'admin' | 'user'
    provider text default 'custom', -- 'google' | 'custom'
    email text default '',
    created_at timestamptz default now()
);

-- Index for fast lookup by username
create index if not exists idx_users_username on public.users (lower(username));

-- 2. GROUPS & CHANNELS TABLE
create table if not exists public.groups (
    id text primary key,
    name text not null,
    description text default '',
    avatar text default 'https://api.dicebear.com/7.x/bottts/svg?seed=lmc',
    created_by text default '',
    is_private boolean default false,
    invite_code text default '',
    members text[] default array[]::text[],
    admins text[] default array[]::text[],
    join_requests text[] default array[]::text[],
    created_at timestamptz default now()
);

-- 3. MESSAGES TABLE
create table if not exists public.messages (
    id text primary key,
    group_id text not null,
    sender_name text not null,
    sender_username text default '',
    sender_avatar text default '',
    sender_bio text default '',
    content text default '',
    msg_type text default 'text', -- 'text' | 'sticker' | 'gif' | 'image' | 'audio' | 'music_bot' | 'call_log'
    media_url text default '',
    reactions jsonb default '{}'::jsonb,
    created_at timestamptz default now(),
    burn_after_read boolean default false,
    burn_seconds integer default 10,
    read_by text[] default array[]::text[],
    reply_to jsonb default null
);

-- Fast indexes for message retrieval by room and timestamp
create index if not exists idx_messages_group_created on public.messages (group_id, created_at asc);
create index if not exists idx_messages_sender on public.messages (lower(sender_username));

-- 4. WEBRTC CALLING & SIGNALING TABLE
create table if not exists public.calls (
    id text primary key,
    caller_username text not null,
    receiver_username text not null,
    call_type text default 'audio', -- 'audio' | 'video'
    status text default 'ringing',  -- 'ringing' | 'accepted' | 'rejected' | 'ended'
    offer jsonb default null,
    answer jsonb default null,
    caller_ice jsonb default '[]'::jsonb,
    receiver_ice jsonb default '[]'::jsonb,
    started_at timestamptz default now(),
    ended_at timestamptz default null,
    duration integer default 0
);

create index if not exists idx_calls_receiver on public.calls (lower(receiver_username), status);
create index if not exists idx_calls_caller on public.calls (lower(caller_username), status);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.messages enable row level security;
alter table public.calls enable row level security;

-- Public Read/Write Policies for seamless real-time chat operations
drop policy if exists "Allow public select users" on public.users;
create policy "Allow public select users" on public.users for select using (true);
drop policy if exists "Allow public insert users" on public.users;
create policy "Allow public insert users" on public.users for insert with check (true);
drop policy if exists "Allow public update users" on public.users;
create policy "Allow public update users" on public.users for update using (true);

drop policy if exists "Allow public select groups" on public.groups;
create policy "Allow public select groups" on public.groups for select using (true);
drop policy if exists "Allow public insert groups" on public.groups;
create policy "Allow public insert groups" on public.groups for insert with check (true);
drop policy if exists "Allow public update groups" on public.groups;
create policy "Allow public update groups" on public.groups for update using (true);
drop policy if exists "Allow public delete groups" on public.groups;
create policy "Allow public delete groups" on public.groups for delete using (true);

drop policy if exists "Allow public select messages" on public.messages;
create policy "Allow public select messages" on public.messages for select using (true);
drop policy if exists "Allow public insert messages" on public.messages;
create policy "Allow public insert messages" on public.messages for insert with check (true);
drop policy if exists "Allow public update messages" on public.messages;
create policy "Allow public update messages" on public.messages for update using (true);
drop policy if exists "Allow public delete messages" on public.messages;
create policy "Allow public delete messages" on public.messages for delete using (true);

drop policy if exists "Allow public select calls" on public.calls;
create policy "Allow public select calls" on public.calls for select using (true);
drop policy if exists "Allow public insert calls" on public.calls;
create policy "Allow public insert calls" on public.calls for insert with check (true);
drop policy if exists "Allow public update calls" on public.calls;
create policy "Allow public update calls" on public.calls for update using (true);
drop policy if exists "Allow public delete calls" on public.calls;
create policy "Allow public delete calls" on public.calls for delete using (true);

-- 6. ENABLE SUPABASE REALTIME REPLICATION
do $$
begin
  alter publication supabase_realtime add table public.users, public.groups, public.messages, public.calls;
exception
  when others then null;
end $$;
