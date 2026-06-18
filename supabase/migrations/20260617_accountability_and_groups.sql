-- Add invite_code to public.profiles
alter table public.profiles add column if not exists invite_code text unique default ('HYKE-' || upper(substring(md5(random()::text) from 1 for 6)));

-- Populate existing profiles with an invite code if null
update public.profiles set invite_code = 'HYKE-' || upper(substring(md5(random()::text) from 1 for 6)) where invite_code is null;

-- Create accountability_connections table
create table if not exists public.accountability_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  buddy_id uuid references auth.users on delete cascade not null,
  status text not null check (status in ('pending', 'active')) default 'pending',
  role text not null check (role in ('Referee', 'Accountability Buddy')) default 'Accountability Buddy',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, buddy_id)
);

-- Enable RLS on accountability_connections
alter table public.accountability_connections enable row level security;

-- Create policies for accountability_connections
create policy "Users can view their own connections." on public.accountability_connections
  for select using (auth.uid() = user_id or auth.uid() = buddy_id);

create policy "Users can insert connection requests." on public.accountability_connections
  for insert with check (auth.uid() = user_id);

create policy "Users can update connection status." on public.accountability_connections
  for update using (auth.uid() = user_id or auth.uid() = buddy_id);

create policy "Users can disconnect or reject connections." on public.accountability_connections
  for delete using (auth.uid() = user_id or auth.uid() = buddy_id);

-- Create groups table
create table if not exists public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  creator_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on groups
alter table public.groups enable row level security;

-- Create group_members table
create table if not exists public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (group_id, user_id)
);

-- Enable RLS on group_members
alter table public.group_members enable row level security;

-- Create security helper function to check group membership (Security Definer to prevent policy recursion)
create or replace function public.is_group_member(gid uuid, uid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.group_members
    where group_id = gid and user_id = uid
  ) or exists (
    select 1 from public.groups
    where id = gid and creator_id = uid
  );
end;
$$ language plpgsql security definer;

-- Create policies for groups
create policy "Anyone authenticated can create a group." on public.groups
  for insert with check (auth.uid() = creator_id);

create policy "Group creators can perform all actions on groups." on public.groups
  for all using (auth.uid() = creator_id);

create policy "Members can view their groups." on public.groups
  for select using (auth.uid() = creator_id or public.is_group_member(id, auth.uid()));

-- Create policies for group_members
create policy "Creators can add members or members can join." on public.group_members
  for insert with check (
    auth.uid() = user_id or 
    exists (select 1 from public.groups where id = group_id and creator_id = auth.uid())
  );

create policy "Creators can remove members or members can leave." on public.group_members
  for delete using (
    auth.uid() = user_id or 
    exists (select 1 from public.groups where id = group_id and creator_id = auth.uid())
  );

create policy "Members can view membership details." on public.group_members
  for select using (
    user_id = auth.uid() or 
    public.is_group_member(group_id, auth.uid())
  );

-- Create group_messages table
create table if not exists public.group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups on delete cascade not null,
  sender_id uuid references auth.users on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on group_messages
alter table public.group_messages enable row level security;

-- Create policies for group_messages
create policy "Members can view group messages." on public.group_messages
  for select using (public.is_group_member(group_id, auth.uid()));

create policy "Members can insert group messages." on public.group_messages
  for insert with check (auth.uid() = sender_id and public.is_group_member(group_id, auth.uid()));
