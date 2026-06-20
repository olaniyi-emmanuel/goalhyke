alter table public.progress_submissions add column if not exists metadata jsonb default '{}'::jsonb;
