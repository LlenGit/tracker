-- ─── Profiles table ───────────────────────────────────────────────────────────
-- Linked 1:1 to auth.users. Created automatically on signup via trigger.

create table if not exists profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text not null,
  full_name   text,
  status      text not null default 'pending'
                check (status in ('pending', 'approved', 'rejected')),
  role        text not null default 'user',
  created_at  timestamptz default now()
);

alter table profiles enable row level security;

-- Users can read their own profile (to check approval status)
create policy "users read own profile"
  on profiles for select
  using (auth.uid() = id);

-- Master admin can read ALL profiles
create policy "master reads all profiles"
  on profiles for select
  using (auth.email() = 'thoudamdexter@gmail.com');

-- Master admin can update any profile (approve / reject)
create policy "master updates profiles"
  on profiles for update
  using (auth.email() = 'thoudamdexter@gmail.com');

-- ─── Auto-create profile on signup ────────────────────────────────────────────
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, full_name, status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'pending'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Auto-approve the master user ─────────────────────────────────────────────
-- Run this AFTER the master user signs up for the first time:
-- UPDATE profiles SET status = 'approved', role = 'admin'
-- WHERE email = 'thoudamdexter@gmail.com';
