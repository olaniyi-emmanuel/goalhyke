-- Add first_name and last_name columns to public.profiles
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name text;

-- Update existing profiles using split_part on full_name
update public.profiles 
set 
  first_name = split_part(full_name, ' ', 1),
  last_name = nullif(trim(substring(full_name from position(' ' in full_name) + 1)), '')
where (first_name is null or first_name = '') and full_name is not null and full_name <> '';

-- Update the handle_new_user trigger function to populate first_name and last_name from metadata
create or replace function public.handle_new_user()
returns trigger as $$
declare
  meta_full_name text;
  meta_first_name text;
  meta_last_name text;
begin
  meta_first_name := new.raw_user_meta_data->>'first_name';
  meta_last_name := new.raw_user_meta_data->>'last_name';
  meta_full_name := new.raw_user_meta_data->>'full_name';

  -- Fallbacks
  if meta_first_name is null and meta_full_name is not null then
    meta_first_name := split_part(meta_full_name, ' ', 1);
  end if;
  
  if meta_last_name is null and meta_full_name is not null then
    meta_last_name := nullif(trim(substring(meta_full_name from position(' ' in meta_full_name) + 1)), '');
  end if;

  if meta_full_name is null then
    meta_full_name := trim(concat(coalesce(meta_first_name, ''), ' ', coalesce(meta_last_name, '')));
  end if;

  insert into public.profiles (id, username, full_name, first_name, last_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    meta_full_name,
    meta_first_name,
    meta_last_name,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;
