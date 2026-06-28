-- Migration: Advanced Persistent AI Chatbot System (CrushIT AI)
-- Created: 2026-06-27

-- Drop old tables if they exist
drop table if exists public.ai_chat_messages cascade;
drop table if exists public.ai_chat_tasks cascade;
drop table if exists public.ai_chat_preferences cascade;
drop table if exists public.ai_chat_sessions cascade;

-- 1. Create ai_chat_sessions table
create table public.ai_chat_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  summary text,
  is_pinned boolean default false not null,
  is_bookmarked boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on sessions
alter table public.ai_chat_sessions enable row level security;

-- Policies for ai_chat_sessions
create policy "Users can view their own AI chat sessions"
  on public.ai_chat_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI chat sessions"
  on public.ai_chat_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI chat sessions"
  on public.ai_chat_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own AI chat sessions"
  on public.ai_chat_sessions for delete
  using (auth.uid() = user_id);


-- 2. Create ai_chat_messages table with support for voice, file uploads, bookmarks and reactions
create table public.ai_chat_messages (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.ai_chat_sessions on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  sender text not null check (sender in ('user', 'assistant')),
  content text not null,
  message_type text not null check (message_type in ('text', 'voice', 'file', 'image', 'sticker')) default 'text',
  attachment_url text,
  attachment_name text,
  reactions jsonb default '{}'::jsonb not null, -- Stores structure like: { "👍": ["user_id_1"] }
  is_bookmarked boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on messages
alter table public.ai_chat_messages enable row level security;

-- Policies for ai_chat_messages
create policy "Users can view messages from their own sessions"
  on public.ai_chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert messages into their own sessions"
  on public.ai_chat_messages for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own messages (e.g. reactions, bookmarks)"
  on public.ai_chat_messages for update
  using (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on public.ai_chat_messages for delete
  using (auth.uid() = user_id);


-- 3. Create ai_chat_tasks table for direct accountability subtasks
create table public.ai_chat_tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  goal_id uuid references public.goals on delete cascade,
  title text not null,
  is_completed boolean default false not null,
  due_at timestamp with time zone,
  priority text not null check (priority in ('low', 'medium', 'high')) default 'medium',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on tasks
alter table public.ai_chat_tasks enable row level security;

-- Policies for ai_chat_tasks
create policy "Users can view their own AI tasks"
  on public.ai_chat_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own AI tasks"
  on public.ai_chat_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own AI tasks"
  on public.ai_chat_tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own AI tasks"
  on public.ai_chat_tasks for delete
  using (auth.uid() = user_id);


-- 4. Create ai_chat_preferences table for user profile tailoring and personalization
create table public.ai_chat_preferences (
  user_id uuid references auth.users on delete cascade primary key,
  motivation_style text not null check (motivation_style in ('assertive', 'supportive', 'analytical', 'friendly')) default 'supportive',
  preferred_hours text, -- e.g., "morning", "evening", "afternoon"
  learning_interests text[],
  recurring_struggles text[],
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on preferences
alter table public.ai_chat_preferences enable row level security;

-- Policies for ai_chat_preferences
create policy "Users can view their own preferences"
  on public.ai_chat_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.ai_chat_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.ai_chat_preferences for update
  using (auth.uid() = user_id);


-- Create performance indexes for speedy retrieval
create index if not exists idx_ai_chat_sessions_user_id on public.ai_chat_sessions(user_id);
create index if not exists idx_ai_chat_messages_session_id on public.ai_chat_messages(session_id);
create index if not exists idx_ai_chat_tasks_user_id on public.ai_chat_tasks(user_id);
create index if not exists idx_ai_chat_tasks_goal_id on public.ai_chat_tasks(goal_id);
