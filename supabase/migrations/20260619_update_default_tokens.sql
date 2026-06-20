-- Alter default value of tokens column in profiles to 200
alter table public.profiles alter column tokens set default 200;

-- Give existing profiles a minimum of 200 tokens for testing
update public.profiles set tokens = greatest(tokens, 200);
