-- FIX: Allow the Backend to read/write notifications without RLS blocking it
-- (Since the backend might be using the Anon Key instead of Service Role)

-- 1. Disable RLS temporarily (easiest fix for demo)
alter table public.notifications disable row level security;

-- OR 2. Specific permissive policies (if you want to keep RLS on)
-- Drop existing potential restrictive policies
drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Enable insert for authenticated users" on public.notifications;

-- Allow ANYONE (including the backend server) to read/write
create policy "Allow Public Access"
on public.notifications
for all
using ( true )
with check ( true );

-- Enable RLS again (with the new permissive policy)
alter table public.notifications enable row level security;
