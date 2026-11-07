-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create groups table with public/private support
create table if not exists public.groups (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text default '',
    avatar text default 'https://api.dicebear.com/7.x/bottts/svg?seed=lmc',
    created_by text default 'Kai Renner',
    is_private boolean default false,
    members text[] default array['Kai Renner'],
    join_requests text[] default array[]::text[],
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

-- 3. Public Read/Write Policies
alter table public.groups enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Allow public read access on groups" on public.groups;
create policy "Allow public read access on groups" on public.groups for select using (true);

drop policy if exists "Allow public insert on groups" on public.groups;
create policy "Allow public insert on groups" on public.groups for insert with check (true);

drop policy if exists "Allow public update on groups" on public.groups;
create policy "Allow public update on groups" on public.groups for update using (true);

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

-- 5. Seed default groups (Public and Private examples)
insert into public.groups (id, name, description, avatar, created_by, is_private, members, join_requests)
values 
  ('11111111-1111-1111-1111-111111111111', 'LMC Main Lounge', 'Public squad hangout for general discussions, memes, music and announcements.', 'https://api.dicebear.com/7.x/bottts/svg?seed=LMC', 'Kai Renner', false, array['Kai Renner', 'Ana Vidal', 'Marcus Webb'], array[]::text[]),
  ('22222222-2222-2222-2222-222222222222', 'LMC Core Devs 🔒', 'Confidential project planning, architecture reviews and private secrets.', 'https://api.dicebear.com/7.x/bottts/svg?seed=Devs', 'Kai Renner', true, array['Kai Renner', 'Ana Vidal'], array[]::text[])
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  is_private = excluded.is_private,
  members = excluded.members;
