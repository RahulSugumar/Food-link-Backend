-- Create Notifications Table
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  message text not null,
  type text default 'general'::text,
  related_id uuid, -- Optional, links to donation ID
  is_read boolean default false
);

-- Enable RLS (Optional but recommended)
alter table public.notifications enable row level security;

-- Policy: Users can view their own notifications
create policy "Users can view their own notifications"
on public.notifications for select
using ( auth.uid() = user_id );

-- Policy: Server (service role) can insert notifications
-- Note: If using service role key in backend, this is bypassed. 
-- If using anon key + RLS, you need an insert policy.
-- Assuming backend uses service role or we allow public insert for demo (less secure)
create policy "Enable insert for authenticated users"
on public.notifications for insert
with check ( true ); 
