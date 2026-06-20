-- Create the submissions bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('submissions', 'submissions', true)
on conflict (id) do nothing;

-- Create policies for storage.objects for the submissions bucket

-- 1. Public Select access
create policy "Submissions are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'submissions' );

-- 2. Authenticated Insert access
create policy "Users can upload their own submissions"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Authenticated Update access
create policy "Users can update their own submissions"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Authenticated Delete access
create policy "Users can delete their own submissions"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'submissions' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
