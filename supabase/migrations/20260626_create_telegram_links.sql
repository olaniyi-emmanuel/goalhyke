-- Create user_telegram_links table
create table public.user_telegram_links (
  user_id uuid references auth.users on delete cascade primary key,
  telegram_chat_id text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_telegram_links enable row level security;

-- Policies
create policy "Users can view their own Telegram link"
  on public.user_telegram_links for select
  using (auth.uid() = user_id);

create policy "Users can delete their own Telegram link"
  on public.user_telegram_links for delete
  using (auth.uid() = user_id);
