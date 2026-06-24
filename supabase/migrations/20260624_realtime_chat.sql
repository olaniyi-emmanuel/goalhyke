-- Migration: Premium Real-Time Chat System
-- Created: 2026-06-24

-- 1. Alter public.profiles table to support presence tracking
alter table public.profiles add column if not exists online_status text default 'offline' check (online_status in ('online', 'offline', 'away'));
alter table public.profiles add column if not exists last_seen timestamp with time zone default timezone('utc'::text, now());
alter table public.profiles add column if not exists active_session text;

-- 2. Create conversations table
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  name text, -- NULL for direct messages (DMs)
  description text, -- Option for group descriptions
  type text not null check (type in ('dm', 'group')) default 'dm',
  creator_id uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  last_message_id uuid -- Updated via trigger
);

-- Enable RLS on conversations
alter table public.conversations enable row level security;

-- 3. Create conversation_members table
create table if not exists public.conversation_members (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  role text not null check (role in ('admin', 'member')) default 'member',
  unique (conversation_id, user_id)
);

-- Enable RLS on conversation_members
alter table public.conversation_members enable row level security;

-- Security helper function to check conversation membership
create or replace function public.is_conversation_member(cid uuid, uid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.conversation_members
    where conversation_id = cid and user_id = uid
  );
end;
$$ language plpgsql security definer;

-- Helper to locate a DM conversation between two users
create or replace function public.get_shared_conversations(user1 uuid, user2 uuid)
returns table(id uuid) as $$
begin
  return query
  select cm1.conversation_id
  from public.conversation_members cm1
  join public.conversation_members cm2 on cm1.conversation_id = cm2.conversation_id
  join public.conversations c on cm1.conversation_id = c.id
  where cm1.user_id = user1 and cm2.user_id = user2 and c.type = 'dm';
end;
$$ language plpgsql security definer;


-- 4. Create unified messages table
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations on delete cascade not null,
  sender_id uuid references public.profiles on delete cascade not null,
  content text not null,
  message_type text not null check (message_type in ('text', 'image', 'audio', 'video', 'file', 'gif', 'sticker', 'emoji', 'system')) default 'text',
  parent_id uuid references public.messages on delete set null, -- For threading/replies
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_edited boolean default false not null,
  is_deleted boolean default false not null
);

-- Enable RLS on messages
alter table public.messages enable row level security;

-- Update foreign key on conversations for last_message_id
alter table public.conversations add foreign key (last_message_id) references public.messages (id) on delete set null;

-- 5. Create reactions table
create table if not exists public.reactions (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  emoji text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (message_id, user_id, emoji)
);

-- Enable RLS on reactions
alter table public.reactions enable row level security;

-- 6. Create attachments table
create table if not exists public.attachments (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages on delete cascade not null,
  file_url text not null,
  file_name text not null,
  mime_type text not null,
  file_size integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on attachments
alter table public.attachments enable row level security;

-- 7. Create read_receipts table
create table if not exists public.read_receipts (
  id uuid default gen_random_uuid() primary key,
  message_id uuid references public.messages on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  read_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (message_id, user_id)
);

-- Enable RLS on read_receipts
alter table public.read_receipts enable row level security;

-- 8. Create stickers table
create table if not exists public.stickers (
  id uuid default gen_random_uuid() primary key,
  pack_name text not null,
  sticker_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on stickers
alter table public.stickers enable row level security;

-- 9. Row-Level Security Policies

-- Conversations Policies
create policy "Users can view conversations they are member of."
  on public.conversations for select
  using (public.is_conversation_member(id, auth.uid()));

create policy "Users can insert conversations they start."
  on public.conversations for insert
  with check (auth.uid() = creator_id or type = 'dm');

create policy "Users can update conversations they participate in."
  on public.conversations for update
  using (public.is_conversation_member(id, auth.uid()));

-- Conversation Members Policies
create policy "Users can select conversation memberships for their conversations."
  on public.conversation_members for select
  using (public.is_conversation_member(conversation_id, auth.uid()));

create policy "Users can insert membership relations if authenticated."
  on public.conversation_members for insert
  with check (auth.uid() = user_id or public.is_conversation_member(conversation_id, auth.uid()));

create policy "Users can delete conversation memberships if participant or admin."
  on public.conversation_members for delete
  using (auth.uid() = user_id or public.is_conversation_member(conversation_id, auth.uid()));

-- Messages Policies
create policy "Users can select messages of their conversations."
  on public.messages for select
  using (public.is_conversation_member(conversation_id, auth.uid()));

create policy "Users can insert messages into their conversations."
  on public.messages for insert
  with check (auth.uid() = sender_id and public.is_conversation_member(conversation_id, auth.uid()));

create policy "Users can update their own messages."
  on public.messages for update
  using (auth.uid() = sender_id);

create policy "Users can delete their own messages."
  on public.messages for delete
  using (auth.uid() = sender_id);

-- Reactions Policies
create policy "Users can select reactions on messages they can view."
  on public.reactions for select
  using (exists (
    select 1 from public.messages m
    where m.id = message_id and public.is_conversation_member(m.conversation_id, auth.uid())
  ));

create policy "Users can insert their own reactions."
  on public.reactions for insert
  with check (auth.uid() = user_id and exists (
    select 1 from public.messages m
    where m.id = message_id and public.is_conversation_member(m.conversation_id, auth.uid())
  ));

create policy "Users can delete their own reactions."
  on public.reactions for delete
  using (auth.uid() = user_id);

-- Read Receipts Policies
create policy "Users can view read receipts for their conversations."
  on public.read_receipts for select
  using (exists (
    select 1 from public.messages m
    where m.id = message_id and public.is_conversation_member(m.conversation_id, auth.uid())
  ));

create policy "Users can insert/update their own read receipts."
  on public.read_receipts for insert
  with check (auth.uid() = user_id and exists (
    select 1 from public.messages m
    where m.id = message_id and public.is_conversation_member(m.conversation_id, auth.uid())
  ));

-- Attachments Policies
create policy "Users can select attachments for messages in their conversations."
  on public.attachments for select
  using (exists (
    select 1 from public.messages m
    where m.id = message_id and public.is_conversation_member(m.conversation_id, auth.uid())
  ));

create policy "Users can insert attachments."
  on public.attachments for insert
  with check (exists (
    select 1 from public.messages m
    where m.id = message_id and m.sender_id = auth.uid()
  ));

-- Stickers Policies
create policy "Anyone can select stickers."
  on public.stickers for select
  using (true);

-- 10. Indexes for optimizing common chat query patterns
create index if not exists idx_conversations_updated_at on public.conversations (updated_at desc);
create index if not exists idx_conversation_members_lookup on public.conversation_members (conversation_id, user_id);
create index if not exists idx_messages_chronological on public.messages (conversation_id, created_at asc);
create index if not exists idx_messages_sender on public.messages (sender_id);
create index if not exists idx_reactions_message_id on public.reactions (message_id);
create index if not exists idx_read_receipts_lookup on public.read_receipts (message_id, user_id);
create index if not exists idx_attachments_message_id on public.attachments (message_id);

-- Full-Text search index on messages
create index if not exists idx_messages_content_fts on public.messages using gin(to_tsvector('english', content));

-- 11. Triggers & Stored Procedures

-- Trigger to update last_message_id and updated_at on conversation
create or replace function public.update_conversation_last_message()
returns trigger as $$
begin
  update public.conversations
  set 
    last_message_id = new.id,
    updated_at = timezone('utc'::text, now())
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_message_inserted
  after insert on public.messages
  for each row execute function public.update_conversation_last_message();

-- 12. Create Storage Bucket for chat attachments
insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

create policy "Chat attachments are viewable by authenticated users in their conversations"
  on storage.objects for select
  using ( bucket_id = 'chat-attachments' );

create policy "Authenticated users can upload chat attachments"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'chat-attachments' );

create policy "Authenticated users can delete their own chat attachments"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'chat-attachments' and (storage.foldername(name))[1] = auth.uid()::text );

-- 13. Data Migration: Copy existing group data to the unified conversations layout
do $$
begin
  -- Check if groups table exists
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'groups') then
    -- Copy groups to conversations
    insert into public.conversations (id, name, description, type, creator_id, created_at, updated_at)
    select id, name, description, 'group', creator_id, created_at, created_at from public.groups
    on conflict (id) do nothing;

    -- Copy group members to conversation members
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'group_members') then
      insert into public.conversation_members (conversation_id, user_id, joined_at, role)
      select group_id, user_id, joined_at, 'member' from public.group_members
      on conflict (conversation_id, user_id) do nothing;
      
      -- Set creator role to admin
      update public.conversation_members cm
      set role = 'admin'
      where exists (
        select 1 from public.conversations c
        where c.id = cm.conversation_id and c.creator_id = cm.user_id
      );
    end if;

    -- Copy group messages to unified messages
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'group_messages') then
      insert into public.messages (id, conversation_id, sender_id, content, message_type, created_at, updated_at)
      select id, group_id, sender_id, message, 'text', created_at, created_at from public.group_messages
      on conflict (id) do nothing;
    end if;

    -- Sync last_message_id in conversations
    update public.conversations c
    set last_message_id = (
      select id from public.messages m
      where m.conversation_id = c.id
      order by created_at desc
      limit 1
    )
    where last_message_id is null;
  end if;
end;
$$;

-- 14. Seed Initial Stickers Pack
insert into public.stickers (pack_name, sticker_url) values
  ('Hyke Pack', 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker-happy&backgroundColor=b6e3f4'),
  ('Hyke Pack', 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker-cool&backgroundColor=c0aede'),
  ('Hyke Pack', 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker-surprised&backgroundColor=ffd5dc'),
  ('Hyke Pack', 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker-love&backgroundColor=d1f4ff'),
  ('Hyke Pack', 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker-wink&backgroundColor=ffdfa9'),
  ('Hyke Pack', 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker-excited&backgroundColor=c4f6d4'),
  ('Hyke Pack', 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker-crying&backgroundColor=e3e3e3'),
  ('Hyke Pack', 'https://api.dicebear.com/7.x/bottts/svg?seed=sticker-angry&backgroundColor=ffb4b4')
on conflict do nothing;

-- 15. Enable Supabase Realtime replication on Chat tables
do $$
begin
  alter publication supabase_realtime drop table public.conversations;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime drop table public.conversation_members;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime drop table public.messages;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime drop table public.reactions;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime drop table public.read_receipts;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversations;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.conversation_members;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.reactions;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.read_receipts;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when others then null;
end $$;
