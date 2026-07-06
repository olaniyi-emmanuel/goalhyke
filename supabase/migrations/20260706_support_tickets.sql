-- Create support_tickets table
create table if not exists public.support_tickets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  customer_name text not null,
  customer_email text not null,
  category text not null check (category in ('Billing', 'Technical Bug', 'Feature Request', 'General Inquiry')),
  subject text not null,
  description text not null,
  steps_to_reproduce text,
  attachment_url text,
  status text not null check (status in ('open', 'in_progress', 'resolved')) default 'open',
  priority text not null check (priority in ('low', 'normal', 'high', 'premium_buyer')) default 'normal',
  is_escalated boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on support_tickets
alter table public.support_tickets enable row level security;

-- Policies for support_tickets
create policy "Anyone can submit support tickets"
  on public.support_tickets for insert
  with check (true);

create policy "Users can view their own tickets"
  on public.support_tickets for select
  using (auth.uid() = user_id);

-- Create ticket_attachments storage bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('ticket_attachments', 'ticket_attachments', true)
on conflict (id) do nothing;

-- Policies for ticket_attachments storage bucket
create policy "Ticket attachments are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'ticket_attachments' );

create policy "Anyone can upload ticket attachments"
  on storage.objects for insert
  with check ( bucket_id = 'ticket_attachments' );

-- Trigger to invoke triage-tickets Edge Function when a new support ticket is inserted
create or replace function public.handle_new_support_ticket()
returns trigger as $$
declare
  project_url text;
begin
  project_url := coalesce(
    current_setting('app.settings.supabase_url', true),
    'https://cxqqgmkrvwrqkfipazfn.supabase.co'
  );
  
  -- Trigger asynchronous HTTP POST via pg_net extension to local /functions/v1/triage-tickets
  perform net.http_post(
    url := project_url || '/functions/v1/triage-tickets',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'support_tickets',
      'schema', 'public',
      'record', row_to_json(new)
    )
  );
  
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_support_ticket_created
  after insert on public.support_tickets
  for each row execute function public.handle_new_support_ticket();
