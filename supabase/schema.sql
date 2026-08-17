-- ============================================================
-- TRACKER APP — Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables
-- ============================================================

-- Enable full-text search extension
create extension if not exists pg_trgm;

-- ─────────────────────────────────────────
-- 1. CALLS
-- ─────────────────────────────────────────
create table if not exists calls (
  id              uuid primary key default gen_random_uuid(),
  client_name     text not null,
  company         text,
  phone           text,
  date            date not null,
  time            text,
  duration_min    integer,
  engineer_name   text,
  notes           text,
  recording_url   text,
  tags            text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- 2. MESSAGES & EMAILS
-- ─────────────────────────────────────────
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  type            text not null check (type in ('email', 'message', 'whatsapp', 'sms', 'other')),
  direction       text not null check (direction in ('inbound', 'outbound')),
  sender          text,
  recipient       text,
  company         text,
  subject         text,
  body_summary    text,
  date            date not null,
  engineer_name   text,
  tags            text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- 3. SITE VISITS & GATEPASSES
-- ─────────────────────────────────────────
create table if not exists site_visits (
  id                   uuid primary key default gen_random_uuid(),
  company              text not null,
  plant_site           text not null,
  location             text,
  visit_date           date not null,
  engineer_name        text not null,
  purpose              text,
  gatepass_docs        text,   -- comma-separated list of required documents
  gatepass_validity    text,
  escort_required      boolean default false,
  ppe_required         text,   -- comma-separated PPE items
  notes                text,
  tags                 text,
  created_at           timestamptz default now()
);

-- ─────────────────────────────────────────
-- 4. ACTIVITIES / TASKS
-- ─────────────────────────────────────────
create table if not exists activities (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  category        text,        -- e.g. "Meeting", "Site Work", "Admin", "Follow-up"
  status          text not null default 'open' check (status in ('open', 'in_progress', 'completed', 'cancelled')),
  priority        text default 'medium' check (priority in ('low', 'medium', 'high')),
  assigned_to     text,
  company         text,
  due_date        date,
  completed_date  date,
  notes           text,
  tags            text,
  created_at      timestamptz default now()
);

-- ─────────────────────────────────────────
-- Full-text search indexes (GIN trigram)
-- ─────────────────────────────────────────
create index if not exists idx_calls_search
  on calls using gin ((
    coalesce(client_name,'') || ' ' ||
    coalesce(company,'') || ' ' ||
    coalesce(engineer_name,'') || ' ' ||
    coalesce(notes,'') || ' ' ||
    coalesce(tags,'')
  ) gin_trgm_ops);

create index if not exists idx_messages_search
  on messages using gin ((
    coalesce(type,'') || ' ' ||
    coalesce(sender,'') || ' ' ||
    coalesce(recipient,'') || ' ' ||
    coalesce(company,'') || ' ' ||
    coalesce(subject,'') || ' ' ||
    coalesce(body_summary,'') || ' ' ||
    coalesce(engineer_name,'') || ' ' ||
    coalesce(tags,'')
  ) gin_trgm_ops);

create index if not exists idx_site_visits_search
  on site_visits using gin ((
    coalesce(company,'') || ' ' ||
    coalesce(plant_site,'') || ' ' ||
    coalesce(location,'') || ' ' ||
    coalesce(engineer_name,'') || ' ' ||
    coalesce(purpose,'') || ' ' ||
    coalesce(gatepass_docs,'') || ' ' ||
    coalesce(ppe_required,'') || ' ' ||
    coalesce(notes,'') || ' ' ||
    coalesce(tags,'')
  ) gin_trgm_ops);

create index if not exists idx_activities_search
  on activities using gin ((
    coalesce(title,'') || ' ' ||
    coalesce(description,'') || ' ' ||
    coalesce(category,'') || ' ' ||
    coalesce(assigned_to,'') || ' ' ||
    coalesce(company,'') || ' ' ||
    coalesce(notes,'') || ' ' ||
    coalesce(tags,'')
  ) gin_trgm_ops);

-- ─────────────────────────────────────────
-- Row Level Security (optional but recommended)
-- ─────────────────────────────────────────
alter table calls enable row level security;
alter table messages enable row level security;
alter table site_visits enable row level security;
alter table activities enable row level security;

-- Allow all operations for authenticated users (adjust as needed)
create policy "Allow all for authenticated" on calls for all using (true) with check (true);
create policy "Allow all for authenticated" on messages for all using (true) with check (true);
create policy "Allow all for authenticated" on site_visits for all using (true) with check (true);
create policy "Allow all for authenticated" on activities for all using (true) with check (true);
