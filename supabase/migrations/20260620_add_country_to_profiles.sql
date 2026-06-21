-- Add country column to public.profiles table
alter table public.profiles 
add column if not exists country text;

-- Update handle_new_user trigger function to support saving user's country selection from auth metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_username text;
begin
  -- Generate unique default username using email prefix and a random hex suffix if not provided
  default_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1) || '_' || substring(md5(random()::text) from 1 for 4)
  );

  insert into public.profiles (id, username, full_name, avatar_url, country)
  values (
    new.id,
    default_username,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'country'
  )
  on conflict (id) do update set
    username = coalesce(profiles.username, excluded.username),
    full_name = coalesce(profiles.full_name, excluded.full_name),
    avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url),
    country = coalesce(profiles.country, excluded.country);

  return new;
end;
$$ language plpgsql security definer;
