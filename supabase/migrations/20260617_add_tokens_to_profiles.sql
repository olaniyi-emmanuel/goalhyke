-- Add tokens column to public.profiles table
alter table public.profiles 
add column if not exists tokens integer not null default 0;
