-- Enable pg_cron and pg_net extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule Weekly Report to run every Monday at 8:00 AM UTC
select cron.schedule(
  'send-weekly-report',
  '0 8 * * 1', -- 8:00 AM every Monday (1 = Monday)
  $$
  select net.http_post(
    url := coalesce(
      current_setting('app.settings.supabase_url', true),
      'https://cxqqgmkrvwrqkfipazfn.supabase.co'
    ) || '/functions/v1/generate-report',
    headers := '{"Content-Type": "application/json", "x-webhook-secret": "goalhyke-report-secret-2026"}'::jsonb,
    body := '{"schedule": "weekly"}'::jsonb
  );
  $$
);

-- Schedule Monthly Report to run on the 1st of every month at 8:00 AM UTC
select cron.schedule(
  'send-monthly-report',
  '0 8 1 * *', -- 8:00 AM on the 1st of every month
  $$
  select net.http_post(
    url := coalesce(
      current_setting('app.settings.supabase_url', true),
      'https://cxqqgmkrvwrqkfipazfn.supabase.co'
    ) || '/functions/v1/generate-report',
    headers := '{"Content-Type": "application/json", "x-webhook-secret": "goalhyke-report-secret-2026"}'::jsonb,
    body := '{"schedule": "monthly"}'::jsonb
  );
  $$
);
