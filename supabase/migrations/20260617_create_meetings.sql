-- Create public.meetings table
create table if not exists public.meetings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text,
  meeting_time text not null, -- e.g. "12:40"
  is_active boolean default true not null,
  is_completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on meetings
alter table public.meetings enable row level security;

-- Create policies for meetings
create policy "Users can view their own meetings and those of active buddies." on public.meetings
  for select using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.accountability_connections 
      where status = 'active' and (
        (user_id = meetings.user_id and buddy_id = auth.uid()) or 
        (buddy_id = meetings.user_id and user_id = auth.uid())
      )
    )
  );

create policy "Users can perform all write actions on their own meetings." on public.meetings
  for all using (auth.uid() = user_id);
