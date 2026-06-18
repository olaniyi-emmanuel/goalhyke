-- Create transactions table to log user token purchases
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount_tokens integer not null,
  price_paid numeric(10, 2) not null,
  currency text not null,
  reference text unique not null,
  status text not null check (status in ('pending', 'success', 'failed')) default 'success',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on transactions
alter table public.transactions enable row level security;

-- Create policies for transactions
create policy "Users can view their own transactions." on public.transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own transactions." on public.transactions
  for insert with check (auth.uid() = user_id);
