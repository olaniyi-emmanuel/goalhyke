-- Create profiles table linked to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

-- Create goals table
create table public.goals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  category text not null,
  description text,
  start_date date not null,
  end_date date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'failed')),
  progress integer not null default 0 check (progress >= 0 and progress <= 100),
  streak integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on goals
alter table public.goals enable row level security;

create policy "Users can perform all actions on their own goals." on public.goals
  for all using (auth.uid() = user_id);

-- Create progress_submissions table
create table public.progress_submissions (
  id uuid default gen_random_uuid() primary key,
  goal_id uuid references public.goals on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  notes text,
  image_url text not null,
  verified text not null default 'pending' check (verified in ('pending', 'verified', 'failed')),
  verification_feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on progress_submissions
alter table public.progress_submissions enable row level security;

create policy "Users can perform all actions on their own progress submissions." on public.progress_submissions
  for all using (auth.uid() = user_id);

-- Create milestones table
create table public.milestones (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  achieved_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on milestones
alter table public.milestones enable row level security;

create policy "Users can view their own milestones." on public.milestones
  for select using (auth.uid() = user_id);

create policy "Users can insert their own milestones." on public.milestones
  for insert with check (auth.uid() = user_id);

-- Trigger to automatically create a profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
