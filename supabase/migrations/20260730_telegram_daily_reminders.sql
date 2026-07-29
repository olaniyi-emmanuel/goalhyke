-- Migration: Telegram Daily Reminders & Multi-Tier Schedule
-- Adds telegram_chat_id, reminders_enabled, and last_thank_you_date to profiles

-- 1. Add columns to profiles table if they don't exist
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS telegram_chat_id text,
  ADD COLUMN IF NOT EXISTS reminders_enabled boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS last_thank_you_date date;

-- 2. Create sync trigger to automatically sync user_telegram_links with profiles table
CREATE OR REPLACE FUNCTION public.sync_telegram_chat_id()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE public.profiles
    SET telegram_chat_id = NEW.telegram_chat_id
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles
    SET telegram_chat_id = NULL
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_sync_telegram_chat_id ON public.user_telegram_links;

CREATE TRIGGER trigger_sync_telegram_chat_id
  AFTER INSERT OR UPDATE OR DELETE ON public.user_telegram_links
  FOR EACH ROW EXECUTE FUNCTION public.sync_telegram_chat_id();

-- Sync existing user_telegram_links to profiles table
UPDATE public.profiles p
SET telegram_chat_id = l.telegram_chat_id
FROM public.user_telegram_links l
WHERE p.id = l.user_id AND p.telegram_chat_id IS NULL;

-- 3. Enable required extensions for automated scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 4. Unschedule previous cron jobs if exist
SELECT cron.unschedule('telegram-morning-8am') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'telegram-morning-8am');
SELECT cron.unschedule('telegram-evening-6pm') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'telegram-evening-6pm');
SELECT cron.unschedule('telegram-hourly-nudges') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'telegram-hourly-nudges');
SELECT cron.unschedule('daily-reminders') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-reminders');

-- Schedule 1: Morning 8:00 AM Call-to-Action
SELECT cron.schedule(
  'telegram-morning-8am',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := CONCAT((SELECT value FROM options WHERE name = 'supabase_url'), '/functions/v1/send-daily-reminders'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', CONCAT('Bearer ', (SELECT value FROM options WHERE name = 'service_role_key'))
    ),
    body := jsonb_build_object('schedule_type', 'morning_8am')
  );
  $$
);

-- Schedule 2: Evening 6:00 PM Status Check (Thank You if submitted, reminder if not)
SELECT cron.schedule(
  'telegram-evening-6pm',
  '0 18 * * *',
  $$
  SELECT net.http_post(
    url := CONCAT((SELECT value FROM options WHERE name = 'supabase_url'), '/functions/v1/send-daily-reminders'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', CONCAT('Bearer ', (SELECT value FROM options WHERE name = 'service_role_key'))
    ),
    body := jsonb_build_object('schedule_type', 'evening_6pm')
  );
  $$
);

-- Schedule 3: Hourly Nudges from 7:00 PM to 11:00 PM (Runs at 19:00, 20:00, 21:00, 22:00, 23:00)
SELECT cron.schedule(
  'telegram-hourly-nudges',
  '0 19-23 * * *',
  $$
  SELECT net.http_post(
    url := CONCAT((SELECT value FROM options WHERE name = 'supabase_url'), '/functions/v1/send-daily-reminders'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', CONCAT('Bearer ', (SELECT value FROM options WHERE name = 'service_role_key'))
    ),
    body := jsonb_build_object('schedule_type', 'hourly_nudge')
  );
  $$
);
