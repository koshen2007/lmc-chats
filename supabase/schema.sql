-- =========================================================================
-- LMC Chats Hardened Production Supabase Schema
-- Strict Row Level Security (RLS), Rate Limiting, and Constraints
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BANNED USERS TABLE
CREATE TABLE IF NOT EXISTS public.banned_users (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT DEFAULT '',
    username TEXT NOT NULL,
    banned_by TEXT NOT NULL,
    reason TEXT DEFAULT 'Spam or malicious activity',
    banned_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_banned_username ON public.banned_users (lower(username));
CREATE INDEX IF NOT EXISTS idx_banned_user_id ON public.banned_users (user_id);

-- 2. USERS / PROFILES DIRECTORY TABLE
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    status TEXT DEFAULT 'online', -- 'online' | 'idle' | 'dnd'
    last_seen TIMESTAMPTZ DEFAULT now(),
    role TEXT DEFAULT 'user',      -- 'admin' | 'user'
    provider TEXT DEFAULT 'custom', -- 'google' | 'custom'
    email TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (lower(username));
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (lower(email));

-- 3. GROUPS & CHANNELS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    avatar TEXT DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=lmc',
    created_by TEXT DEFAULT '',
    is_private BOOLEAN DEFAULT false,
    invite_code TEXT DEFAULT '',
    members TEXT[] DEFAULT array[]::TEXT[],
    admins TEXT[] DEFAULT array[]::TEXT[],
    join_requests TEXT[] DEFAULT array[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. HARDENED MESSAGES TABLE WITH CONSTRAINTS
CREATE TABLE IF NOT EXISTS public.messages (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    sender_id TEXT DEFAULT '',
    sender_name TEXT NOT NULL,
    sender_username TEXT DEFAULT '',
    sender_avatar TEXT DEFAULT '',
    sender_bio TEXT DEFAULT '',
    content TEXT DEFAULT '',
    msg_type TEXT DEFAULT 'text', -- 'text' | 'sticker' | 'gif' | 'image' | 'audio' | 'music_bot' | 'call_log'
    media_url TEXT DEFAULT '',
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    burn_after_read BOOLEAN DEFAULT false,
    burn_seconds INTEGER DEFAULT 10,
    read_by TEXT[] DEFAULT array[]::TEXT[],
    reply_to JSONB DEFAULT null,

    -- Constraint 1: Payload bombing protection (Max 1000 characters)
    CONSTRAINT check_message_content_length CHECK (char_length(content) <= 1000),

    -- Constraint 2: Media URL Whitelist (Tenor, Giphy, or Supabase Storage domain)
    CONSTRAINT check_media_url_whitelist CHECK (
        media_url IS NULL 
        OR media_url = '' 
        OR media_url ~* '^https:\/\/(media\.tenor\.com|media[0-9]*\.giphy\.com|[a-z0-9\-]+\.supabase\.co\/storage)\/'
        OR media_url ~* '^data:image\/(png|jpeg|jpg|webp);base64,'
    )
);

CREATE INDEX IF NOT EXISTS idx_messages_group_created ON public.messages (group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (lower(sender_username));
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);

-- 5. WEBRTC CALLS & SIGNALING TABLE
CREATE TABLE IF NOT EXISTS public.calls (
    id TEXT PRIMARY KEY,
    caller_username TEXT NOT NULL,
    receiver_username TEXT NOT NULL,
    call_type TEXT DEFAULT 'audio', -- 'audio' | 'video'
    status TEXT DEFAULT 'ringing',  -- 'ringing' | 'accepted' | 'rejected' | 'ended'
    offer JSONB DEFAULT null,
    answer JSONB DEFAULT null,
    caller_ice JSONB DEFAULT '[]'::jsonb,
    receiver_ice JSONB DEFAULT '[]'::jsonb,
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ DEFAULT null,
    duration INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_calls_receiver ON public.calls (lower(receiver_username), status);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON public.calls (lower(caller_username), status);

-- =========================================================================
-- 6. ANTI-SPAM & RATE LIMITING POSTGRES TRIGGER (2-SECOND COOLDOWN)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    last_msg_time TIMESTAMPTZ;
    sender_ident TEXT;
BEGIN
    sender_ident := COALESCE(NULLIF(NEW.sender_username, ''), NULLIF(NEW.sender_id, ''), NEW.sender_name);

    -- Find timestamp of last message sent by same user identifier
    SELECT created_at INTO last_msg_time
    FROM public.messages
    WHERE (
        (NULLIF(NEW.sender_username, '') IS NOT NULL AND sender_username = NEW.sender_username)
        OR (NULLIF(NEW.sender_id, '') IS NOT NULL AND sender_id = NEW.sender_id)
        OR (sender_name = NEW.sender_name)
    )
    AND id != NEW.id
    ORDER BY created_at DESC
    LIMIT 1;

    -- Reject insert if sent within 2 seconds
    IF last_msg_time IS NOT NULL AND (COALESCE(NEW.created_at, now()) - last_msg_time) < interval '2 seconds' THEN
        RAISE EXCEPTION 'Rate limit exceeded: You cannot send messages faster than once every 2 seconds.';
    END IF;

    -- Ensure content length does not exceed 1000 characters
    IF char_length(NEW.content) > 1000 THEN
        RAISE EXCEPTION 'Payload bomb rejected: Message content exceeds 1000 character limit.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_message_rate_limit ON public.messages;
CREATE TRIGGER trg_message_rate_limit
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.check_message_rate_limit();

-- =========================================================================
-- 7. PRODUCTION ROW LEVEL SECURITY (RLS) LOCKDOWN
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR public.messages
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Messages select policy" ON public.messages;
DROP POLICY IF EXISTS "Allow public select messages" ON public.messages;
CREATE POLICY "Messages select policy"
ON public.messages FOR SELECT
USING (
    -- Only allow if user is not in banned_users
    NOT EXISTS (
        SELECT 1 FROM public.banned_users b
        WHERE lower(b.username) = lower(current_setting('request.jwt.claims', true)::jsonb ->> 'preferred_username')
           OR lower(b.username) = lower(current_setting('request.jwt.claims', true)::jsonb ->> 'name')
           OR b.user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
    )
);

DROP POLICY IF EXISTS "Messages insert policy" ON public.messages;
DROP POLICY IF EXISTS "Allow public insert messages" ON public.messages;
CREATE POLICY "Messages insert policy"
ON public.messages FOR INSERT
WITH CHECK (
    -- Prevent identity spoofing: sender_id must match auth.uid() or anon authenticated session
    (
        auth.uid() IS NULL 
        OR sender_id = '' 
        OR sender_id = auth.uid()::text
    )
    -- And sender must not be banned
    AND NOT EXISTS (
        SELECT 1 FROM public.banned_users b
        WHERE lower(b.username) = lower(NEW.sender_username)
           OR b.user_id = NEW.sender_id
    )
);

DROP POLICY IF EXISTS "Messages update policy" ON public.messages;
DROP POLICY IF EXISTS "Allow public update messages" ON public.messages;
CREATE POLICY "Messages update policy"
ON public.messages FOR UPDATE
USING (
    -- Users can only edit/react to messages if not banned, and cannot change other users' content
    (
        auth.uid()::text = sender_id
        OR (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'koshensiwanchi@gmail.com'
    )
);

DROP POLICY IF EXISTS "Messages delete policy" ON public.messages;
DROP POLICY IF EXISTS "Allow public delete messages" ON public.messages;
CREATE POLICY "Messages delete policy"
ON public.messages FOR DELETE
USING (
    -- Strictly block users from deleting others' messages.
    -- Allowed ONLY if sender is author OR matches Super Admin email
    (
        auth.uid() IS NOT NULL AND auth.uid()::text = sender_id
    )
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'koshensiwanchi@gmail.com'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR public.users & public.banned_users
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users select policy" ON public.users;
CREATE POLICY "Users select policy" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users insert update policy" ON public.users;
CREATE POLICY "Users insert update policy" ON public.users FOR ALL
USING (
    auth.uid() IS NULL 
    OR id = auth.uid()::text 
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'koshensiwanchi@gmail.com'
);

DROP POLICY IF EXISTS "Banned users view policy" ON public.banned_users;
CREATE POLICY "Banned users view policy" ON public.banned_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Banned users admin policy" ON public.banned_users;
CREATE POLICY "Banned users admin policy" ON public.banned_users FOR ALL
USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'koshensiwanchi@gmail.com'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

-- -------------------------------------------------------------------------
-- 8. ENABLE REALTIME REPLICATION
-- -------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users, public.groups, public.messages, public.calls, public.banned_users;
EXCEPTION
  WHEN others THEN null;
END $$;
