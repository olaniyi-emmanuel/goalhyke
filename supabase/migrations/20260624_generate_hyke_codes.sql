-- Migration: Generate and Persist Hyke Codes (Invite Codes) for All Users
-- Created: 2026-06-24

-- 1. Ensure the invite_code column exists on public.profiles
alter table public.profiles add column if not exists invite_code text;

-- 2. Backfill existing profiles that do not have an invite code
do $$
declare
  r record;
  new_code text;
  code_exists boolean;
begin
  for r in select id from public.profiles where invite_code is null loop
    loop
      -- Generate random 6-character hex invite code
      new_code := 'HYKE-' || upper(substring(md5(random()::text) from 1 for 6));
      
      -- Check for collision in the profiles table
      select exists(select 1 from public.profiles where invite_code = new_code) into code_exists;
      
      -- Exit loop if unique code is generated
      exit when not code_exists;
    end loop;
    
    -- Update the profile
    update public.profiles set invite_code = new_code where id = r.id;
  end loop;
end $$;

-- 3. Set NOT NULL and UNIQUE constraints on invite_code column
alter table public.profiles alter column invite_code set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'profiles_invite_code_key'
  ) then
    alter table public.profiles add constraint profiles_invite_code_key unique (invite_code);
  end if;
end $$;

-- 4. Set the default generation value for any direct inserts
alter table public.profiles alter column invite_code set default ('HYKE-' || upper(substring(md5(random()::text) from 1 for 6)));

-- 5. Update public.handle_new_user() trigger function to explicitly guarantee a unique invite code
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_username text;
  new_invite_code text;
  code_exists boolean;
begin
  -- Generate unique default username using email prefix and a random hex suffix if not provided
  default_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1) || '_' || substring(md5(random()::text) from 1 for 4)
  );

  -- Generate unique invite code (hyke code)
  loop
    new_invite_code := 'HYKE-' || upper(substring(md5(random()::text) from 1 for 6));
    select exists(select 1 from public.profiles where invite_code = new_invite_code) into code_exists;
    exit when not code_exists;
  end loop;

  insert into public.profiles (id, username, full_name, avatar_url, invite_code)
  values (
    new.id,
    default_username,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    new_invite_code
  )
  on conflict (id) do update set
    username = coalesce(profiles.username, excluded.username),
    full_name = coalesce(profiles.full_name, excluded.full_name),
    avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url),
    invite_code = coalesce(profiles.invite_code, excluded.invite_code);

  return new;
end;
$$ language plpgsql security definer;
