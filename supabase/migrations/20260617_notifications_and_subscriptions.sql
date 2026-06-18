-- Create public.notifications table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  body text not null,
  metadata jsonb default '{}'::jsonb not null,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on notifications
alter table public.notifications enable row level security;

create policy "Users can view their own notifications." on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications." on public.notifications
  for update using (auth.uid() = user_id);

-- Create public.push_subscriptions table
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on push_subscriptions
alter table public.push_subscriptions enable row level security;

create policy "Users can perform all actions on their own push subscriptions." on public.push_subscriptions
  for all using (auth.uid() = user_id);

-- Create public.notification_preferences table
create table if not exists public.notification_preferences (
  user_id uuid references auth.users on delete cascade primary key,
  email_enabled boolean default true not null,
  push_enabled boolean default true not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on notification_preferences
alter table public.notification_preferences enable row level security;

create policy "Users can perform all actions on their own notification preferences." on public.notification_preferences
  for all using (auth.uid() = user_id);

-- Trigger to automatically create default notification preferences for new signups
create or replace function public.handle_new_user_notification_prefs()
returns trigger as $$
begin
  insert into public.notification_preferences (user_id, email_enabled, push_enabled)
  values (new.id, true, true)
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created_prefs
  after insert on auth.users
  for each row execute function public.handle_new_user_notification_prefs();

-- Trigger to invoke route-notifications Edge Function when a new notification is inserted
create or replace function public.handle_new_notification()
returns trigger as $$
declare
  project_url text;
  webhook_secret text;
begin
  -- Fetch project url and custom webhook secret if configured, fallback to project settings
  project_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    'https://cxqqgmkrvwrqkfipazfn.supabase.co'
  );
  
  -- Trigger asynchronous HTTP POST via pg_net extension
  perform net.http_post(
    url := project_url || '/functions/v1/route-notifications',
    headers := '{"Content-Type": "application/json", "x-webhook-secret": "goalhyke-notification-secret-2026"}'::jsonb,
    body := jsonb_build_object('notification_id', new.id)
  );
  
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_notification_created
  after insert on public.notifications
  for each row execute function public.handle_new_notification();
