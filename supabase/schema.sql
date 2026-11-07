-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create groups table
create table if not exists public.groups (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text default '',
    avatar text default 'https://api.dicebear.com/7.x/bottts/svg?seed=crew',
    created_by text default 'system',
    created_at timestamptz default now()
);

-- 2. Create messages table
create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.groups(id) on delete cascade,
    sender_name text not null,
    sender_avatar text default 'https://api.dicebear.com/7.x/avataaars/svg?seed=kai',
    content text default '',
    msg_type text default 'text', -- 'text' | 'sticker' | 'gif' | 'image'
    media_url text default '',
    reactions jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

-- 3. Public Read/Write Policies (No Auth Barrier for frictionless friend chat)
alter table public.groups enable row level security;
alter table public.messages enable row level security;

-- Groups Policies
drop policy if exists "Allow public read access on groups" on public.groups;
create policy "Allow public read access on groups" on public.groups for select using (true);

drop policy if exists "Allow public insert on groups" on public.groups;
create policy "Allow public insert on groups" on public.groups for insert with check (true);

drop policy if exists "Allow public update on groups" on public.groups;
create policy "Allow public update on groups" on public.groups for update using (true);

-- Messages Policies
drop policy if exists "Allow public read access on messages" on public.messages;
create policy "Allow public read access on messages" on public.messages for select using (true);

drop policy if exists "Allow public insert on messages" on public.messages;
create policy "Allow public insert on messages" on public.messages for insert with check (true);

drop policy if exists "Allow public update on messages" on public.messages;
create policy "Allow public update on messages" on public.messages for update using (true);

drop policy if exists "Allow public delete on messages" on public.messages;
create policy "Allow public delete on messages" on public.messages for delete using (true);

-- 4. Enable Realtime Replication
do $$
begin
  alter publication supabase_realtime add table public.groups, public.messages;
exception
  when others then null;
end $$;

-- 5. Seed default groups
insert into public.groups (id, name, description, avatar, created_by)
values 
  ('11111111-1111-1111-1111-111111111111', 'Main Lounge', 'Chill general chat, memes, links & midnight music.', 'https://api.dicebear.com/7.x/bottts/svg?seed=Lounge', 'system'),
  ('22222222-2222-2222-2222-222222222222', 'Squad HQ', 'Night owls, product builds, deployments & shipping at 2 AM.', 'https://api.dicebear.com/7.x/bottts/svg?seed=Squad', 'system')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  avatar = excluded.avatar;

-- 6. Seed welcoming initial messages
insert into public.messages (group_id, sender_name, sender_avatar, content, msg_type, reactions)
values
  ('11111111-1111-1111-1111-111111111111', 'Ana Vidal', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana', 'Welcome to the Squad Chat! Realtime messaging, stickers, GIFs, and reactions are live 🚀', 'text', '{"🔥": 4, "💯": 3}'::jsonb),
  ('11111111-1111-1111-1111-111111111111', 'Marcus Webb', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus', 'The UI is slick on both iPhone, Android, and Desktop panels!', 'text', '{"❤️": 2, "🎉": 5}'::jsonb),
  ('22222222-2222-2222-2222-222222222222', 'Juno Park', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juno', 'Squad HQ is online. Ready to ship the build tonight!', 'text', '{"🚀": 6}'::jsonb)
on conflict do nothing;

