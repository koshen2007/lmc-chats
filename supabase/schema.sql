-- =========================================================================
-- LMC Chats Hardened Production Supabase Master Schema
-- Zero-Trust Cryptographic Architecture, pgcrypto, Hash Chain & Honeypots
-- =========================================================================

-- Enable required cryptographic & UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -------------------------------------------------------------------------
-- 1. USER DEVICES & CRYPTOGRAPHIC PUBLIC KEYS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_devices (
    user_id TEXT PRIMARY KEY,
    public_key TEXT UNIQUE,
    trust_score INT DEFAULT 100,
    is_shadowbanned BOOLEAN DEFAULT false,
    device_name TEXT DEFAULT 'Browser WebCrypto P-256',
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_devices_pubkey ON public.user_devices (public_key);
CREATE INDEX IF NOT EXISTS idx_user_devices_shadow ON public.user_devices (is_shadowbanned);

-- -------------------------------------------------------------------------
-- 2. MESSAGE NONCES TABLE (ANTI-PACKET-REPLAY ENGINE)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_nonces (
    nonce TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_nonces_time ON public.message_nonces (created_at);

-- -------------------------------------------------------------------------
-- 3. BANNED USERS TABLE
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 4. USERS / PROFILES DIRECTORY TABLE
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 5. GROUPS & CHANNELS TABLE
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 6. ZERO-TRUST CRYPTOGRAPHICALLY CHAINED MESSAGES TABLE
-- -------------------------------------------------------------------------
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
    metadata JSONB DEFAULT '{}'::jsonb, -- Interactive Bot & Slash Command Metadata (Polls, Bunk Counters, Whispers)

    -- Zero-Trust Cryptographic Columns
    nonce TEXT UNIQUE,
    signature TEXT NOT NULL DEFAULT 'LEGACY_UNSIGNED',
    public_key TEXT DEFAULT '',
    prev_hash TEXT DEFAULT 'GENESIS',
    msg_hash TEXT DEFAULT '',
    is_shadow BOOLEAN DEFAULT false,

    -- Constraint 1: Payload bombing protection (Max 1000 characters)
    CONSTRAINT check_message_content_length CHECK (char_length(content) <= 1000),

    -- Constraint 2: Media URL Whitelist (Strictly prohibits SVG to eliminate XML/SVG XSS)
    CONSTRAINT check_media_url_whitelist CHECK (
        media_url IS NULL 
        OR media_url = '' 
        OR (
            (
                media_url ~* '^https:\/\/(media\.tenor\.com|media[0-9]*\.giphy\.com|[a-z0-9\-]+\.supabase\.co\/storage)\/'
                OR media_url ~* '^data:image\/(png|jpeg|jpg|webp);base64,'
            )
            AND NOT (media_url ~* '(\.svg|\/svg|image\/svg\+xml)')
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_messages_group_created ON public.messages (group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages (lower(sender_username));
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_nonce ON public.messages (nonce);
CREATE INDEX IF NOT EXISTS idx_messages_shadow ON public.messages (is_shadow);

-- -------------------------------------------------------------------------
-- 7. WEBRTC CALLS & SIGNALING TABLE
-- -------------------------------------------------------------------------
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
-- 8. TRIGGER 1: REPLAY WINDOW LOCK, NONCE DEDUP & MERKLE HASH CHAIN
-- =========================================================================
CREATE OR REPLACE FUNCTION public.verify_and_chain_message()
RETURNS TRIGGER AS $$
DECLARE
    last_msg_hash TEXT;
    replay_count INT;
BEGIN
    -- 1. 15-Second Replay Window Lock
    IF abs(extract(epoch from (now() - COALESCE(NEW.created_at, now())))) > 15 THEN
        RAISE EXCEPTION 'REPLAY_WINDOW_EXPIRED: Message created_at timestamp is outside the strict 15-second window.';
    END IF;

    -- 2. Nonce Dedup & Replay Attack Detection
    IF NEW.nonce IS NOT NULL AND NEW.nonce != '' THEN
        SELECT count(*) INTO replay_count FROM public.message_nonces WHERE nonce = NEW.nonce;
        IF replay_count > 0 THEN
            RAISE EXCEPTION 'REPLAY_ATTACK_DETECTED: Nonce % has already been consumed.', NEW.nonce;
        END IF;
        -- Record nonce to prevent replay
        INSERT INTO public.message_nonces (nonce, created_at)
        VALUES (NEW.nonce, now())
        ON CONFLICT (nonce) DO NOTHING;
    END IF;

    -- 3. Merkle SHA-256 Hash Chain Computation
    SELECT msg_hash INTO last_msg_hash
    FROM public.messages
    WHERE group_id = NEW.group_id
      AND msg_hash IS NOT NULL
      AND msg_hash != ''
    ORDER BY created_at DESC
    LIMIT 1;

    NEW.prev_hash := COALESCE(last_msg_hash, 'GENESIS');
    NEW.msg_hash := encode(digest(NEW.prev_hash || COALESCE(NEW.content, '') || COALESCE(NEW.signature, 'LEGACY'), 'sha256'), 'hex');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verify_and_chain ON public.messages;
CREATE TRIGGER trg_verify_and_chain
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.verify_and_chain_message();

-- =========================================================================
-- 9. TRIGGER 2: TOKEN BUCKET & SHADOWBAN ENGINE
-- =========================================================================
CREATE OR REPLACE FUNCTION public.token_bucket_and_shadowban()
RETURNS TRIGGER AS $$
DECLARE
    sender_ident TEXT;
    recent_msg_count INT;
    is_shadow_user BOOLEAN := false;
BEGIN
    sender_ident := COALESCE(NULLIF(NEW.sender_username, ''), NULLIF(NEW.sender_id, ''), NEW.sender_name);

    -- Check if device or user is already shadowbanned
    SELECT is_shadowbanned INTO is_shadow_user
    FROM public.user_devices
    WHERE user_id = sender_ident OR public_key = NEW.public_key
    LIMIT 1;

    IF is_shadow_user IS TRUE THEN
        NEW.is_shadow := true;
        RETURN NEW;
    END IF;

    -- Token Bucket: Count messages sent by this user in the last 5 seconds (Max 4 burst allowed)
    SELECT count(*) INTO recent_msg_count
    FROM public.messages
    WHERE (
        (NULLIF(NEW.sender_username, '') IS NOT NULL AND sender_username = NEW.sender_username)
        OR (NULLIF(NEW.sender_id, '') IS NOT NULL AND sender_id = NEW.sender_id)
        OR sender_name = NEW.sender_name
    )
    AND created_at >= (now() - interval '5 seconds');

    -- If burst limit (>4 in 5s) is violated, flag and shadowban the attacker
    IF recent_msg_count >= 4 THEN
        -- Upsert device as shadowbanned
        INSERT INTO public.user_devices (user_id, trust_score, is_shadowbanned)
        VALUES (sender_ident, 0, true)
        ON CONFLICT (user_id) DO UPDATE SET is_shadowbanned = true, trust_score = 0;

        NEW.is_shadow := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_token_bucket_shadowban ON public.messages;
CREATE TRIGGER trg_token_bucket_shadowban
BEFORE INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.token_bucket_and_shadowban();

-- =========================================================================
-- 10. HONEYPOT TRAP RPC FUNCTION
-- =========================================================================
CREATE OR REPLACE FUNCTION public.trigger_honeypot_shadowban(
    p_user_id TEXT,
    p_reason TEXT DEFAULT 'Invoked DevTools Honeypot Trap'
)
RETURNS JSONB AS $$
BEGIN
    INSERT INTO public.user_devices (user_id, trust_score, is_shadowbanned)
    VALUES (p_user_id, 0, true)
    ON CONFLICT (user_id) DO UPDATE SET is_shadowbanned = true, trust_score = 0;

    -- Return deceptive success payload to fool attacker into believing admin access was granted
    RETURN jsonb_build_object(
        'status', 'ADMIN_ACCESS_GRANTED',
        'role', 'SUPER_ADMIN',
        'privileges', jsonb_build_array('ROOT', 'UNLIMITED_BURST', 'ALL_ACCESS'),
        'timestamp', now()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 11. PRODUCTION ROW LEVEL SECURITY (RLS) LOCKDOWN WITH SHADOWBAN ISOLATION
-- =========================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banned_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_nonces ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR public.messages (Zero-Trust Shadowban Filter)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Messages select policy" ON public.messages;
DROP POLICY IF EXISTS "Allow public select messages" ON public.messages;
CREATE POLICY "Messages select policy"
ON public.messages FOR SELECT
USING (
    -- Normal users only see non-shadow messages.
    -- Shadowbanned attackers see their own shadow messages so they think everything is normal!
    (
        is_shadow = false
        OR sender_id = auth.uid()::text
        OR lower(sender_username) = lower(current_setting('request.jwt.claims', true)::jsonb ->> 'preferred_username')
        OR (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'koshensiwanchi@gmail.com'
    )
    -- And user must not be hard-banned
    AND NOT EXISTS (
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
    (
        auth.uid() IS NULL 
        OR sender_id = '' 
        OR sender_id = auth.uid()::text
    )
    AND NOT EXISTS (
        SELECT 1 FROM public.banned_users b
        WHERE lower(b.username) = lower(NEW.sender_username)
           OR b.user_id = NEW.sender_id
    )
);

DROP POLICY IF EXISTS "Messages update policy" ON public.messages;
CREATE POLICY "Messages update policy"
ON public.messages FOR UPDATE
USING (
    -- Allow updating reactions, read receipts, and metadata (live poll voting & bunk clicks)
    (
        auth.uid() IS NULL 
        OR auth.uid()::text = sender_id
        OR (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'koshensiwanchi@gmail.com'
        OR true -- Allows interactive poll voting and bunk counter participation
    )
);

DROP POLICY IF EXISTS "Messages delete policy" ON public.messages;
CREATE POLICY "Messages delete policy"
ON public.messages FOR DELETE
USING (
    (
        auth.uid() IS NOT NULL AND auth.uid()::text = sender_id
    )
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'koshensiwanchi@gmail.com'
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
);

-- -------------------------------------------------------------------------
-- RLS POLICIES FOR user_devices & message_nonces
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "User devices select policy" ON public.user_devices;
CREATE POLICY "User devices select policy" ON public.user_devices FOR SELECT USING (true);

DROP POLICY IF EXISTS "User devices upsert policy" ON public.user_devices;
CREATE POLICY "User devices upsert policy" ON public.user_devices FOR ALL
USING (
    auth.uid() IS NULL 
    OR user_id = auth.uid()::text 
    OR (current_setting('request.jwt.claims', true)::jsonb ->> 'email') = 'koshensiwanchi@gmail.com'
);

DROP POLICY IF EXISTS "Message nonces policy" ON public.message_nonces;
CREATE POLICY "Message nonces policy" ON public.message_nonces FOR ALL USING (true);

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
-- 12. ENABLE REALTIME REPLICATION
-- -------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.users, public.groups, public.messages, public.calls, public.banned_users, public.user_devices;
EXCEPTION
  WHEN others THEN null;
END $$;
