-- ============================================================
-- GLEN MODULE — Supabase Schema (append to schema.sql)
-- Run this in the Supabase SQL Editor after the base schema
-- ============================================================

-- ─────────────────────────────────────────
-- 1. GLEN PORTAL LOGINS
-- ─────────────────────────────────────────
create table if not exists glen_portals (
  id               uuid primary key default gen_random_uuid(),
  company          text not null,          -- e.g. Tata Steel, Hindalco
  plant_site       text,                   -- e.g. Meramandali, Khopoli
  system_name      text not null,          -- e.g. G-Lens, TATA BSL iLens, OSPCB RTDAS
  login_type       text,                   -- e.g. Admin, User, Operator
  url              text,
  username         text,
  password         text,                   -- stored as-is; encrypt at app level if needed
  access_scope     text,                   -- e.g. Full Admin, SN 1-10, All Plant
  remark           text,
  tags             text,
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- 2. GLEN SUPPORT TICKETS
-- ─────────────────────────────────────────
create table if not exists glen_tickets (
  id               uuid primary key default gen_random_uuid(),
  ticket_id        text,                   -- e.g. SL111538 (may be blank for manually logged)
  date_submitted   date not null,
  submitted_by     text,
  company          text,
  plant_site       text,
  category         text check (category in ('Hardware','Software','Network','Server Down','Email/Outlook','Other')),
  priority         text check (priority in ('Critical','High','Medium','Low')),
  status           text not null default 'Open' check (status in ('Open','In Progress','Resolved','Closed')),
  assigned_to      text,
  subject          text not null,
  description      text,                   -- location / equipment / stack reference
  issue_type       text,                   -- Data Not Upload, Device Offline, Value Mismatch, etc.
  resolution_days  integer,
  resolved_date    date,
  notes            text,
  tags             text,
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- 3. GLEN SITE / CAAQMS MONITORING STATIONS
-- ─────────────────────────────────────────
create table if not exists glen_sites (
  id               uuid primary key default gen_random_uuid(),
  company          text not null,
  plant_site       text not null,          -- e.g. Tata Steel Meramandali
  location_name    text not null,          -- e.g. CAAQMS_01, Stack_15_Coke_Oven
  station_type     text,                   -- Ambient, Stack, CEQMS, AEL
  data_logger_id   text,
  analyzer_type    text,
  parameter        text,                   -- PM10, PM2.5, NOx, SO2, CO, SPM, etc.
  signal_ip        text,
  make             text,
  model            text,
  serial_number    text,
  status           text default 'Active' check (status in ('Active','Offline','Under Maintenance','Decommissioned')),
  commissioned_date date,
  notes            text,
  tags             text,
  created_at       timestamptz default now()
);

-- ─────────────────────────────────────────
-- Full-text search indexes
-- ─────────────────────────────────────────
create index if not exists idx_glen_portals_search
  on glen_portals using gin ((
    coalesce(company,'') || ' ' ||
    coalesce(plant_site,'') || ' ' ||
    coalesce(system_name,'') || ' ' ||
    coalesce(login_type,'') || ' ' ||
    coalesce(username,'') || ' ' ||
    coalesce(access_scope,'') || ' ' ||
    coalesce(remark,'') || ' ' ||
    coalesce(tags,'')
  ) gin_trgm_ops);

create index if not exists idx_glen_tickets_search
  on glen_tickets using gin ((
    coalesce(ticket_id,'') || ' ' ||
    coalesce(submitted_by,'') || ' ' ||
    coalesce(company,'') || ' ' ||
    coalesce(plant_site,'') || ' ' ||
    coalesce(category,'') || ' ' ||
    coalesce(assigned_to,'') || ' ' ||
    coalesce(subject,'') || ' ' ||
    coalesce(description,'') || ' ' ||
    coalesce(issue_type,'') || ' ' ||
    coalesce(notes,'') || ' ' ||
    coalesce(tags,'')
  ) gin_trgm_ops);

create index if not exists idx_glen_sites_search
  on glen_sites using gin ((
    coalesce(company,'') || ' ' ||
    coalesce(plant_site,'') || ' ' ||
    coalesce(location_name,'') || ' ' ||
    coalesce(station_type,'') || ' ' ||
    coalesce(data_logger_id,'') || ' ' ||
    coalesce(parameter,'') || ' ' ||
    coalesce(make,'') || ' ' ||
    coalesce(model,'') || ' ' ||
    coalesce(tags,'')
  ) gin_trgm_ops);

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────
alter table glen_portals enable row level security;
alter table glen_tickets enable row level security;
alter table glen_sites enable row level security;

create policy "Allow all for authenticated" on glen_portals for all using (true) with check (true);
create policy "Allow all for authenticated" on glen_tickets for all using (true) with check (true);
create policy "Allow all for authenticated" on glen_sites for all using (true) with check (true);
