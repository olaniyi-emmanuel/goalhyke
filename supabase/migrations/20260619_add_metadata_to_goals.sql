alter table public.goals add column if not exists metadata jsonb default '{}'::jsonb;
