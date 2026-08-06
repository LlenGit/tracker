# FieldTracker

A full-stack activity and site visit tracker for field engineers. Tracks calls, messages/emails, site visits with gatepass details, and activities — with a searchable web interface deployable to Vercel.

---

## Folder Structure

```
tracker/
├── README.md                   ← This file
├── data/                       ← CSV exports & templates
│   ├── calls_template.csv
│   ├── messages_template.csv
│   ├── site_visits_template.csv
│   └── activities_template.csv
├── supabase/
│   └── schema.sql              ← Run this once in Supabase to set up tables
└── tracker-app/                ← Next.js web application (deploy to Vercel)
    ├── .env.example            ← Copy to .env.local and fill in Supabase keys
    ├── package.json
    ├── app/
    │   ├── page.tsx            ← Dashboard + global search
    │   ├── calls/              ← Call logs
    │   ├── messages/           ← Messages & emails
    │   ├── site-visits/        ← Site visits & gatepass details
    │   └── activities/         ← Tasks & activities
    └── ...
```

---

## Setup Guide

### Step 1 — Set up Supabase (free database)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Open **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**
3. Go to **Project Settings → API** → copy:
   - `Project URL`
   - `anon public` key

### Step 2 — Configure the app locally

```bash
cd tracker-app
cp .env.example .env.local
# Edit .env.local and paste your Supabase URL and anon key

npm install
npm run dev
# Open http://localhost:3000
```

### Step 3 — Deploy to Vercel

1. Push the `tracker-app/` folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **New Project** → import the repo
3. In Vercel project settings → **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Deploy — your tracker is live!

---

## Features

| Feature | Description |
|---|---|
| **Global Search** | Search any word (e.g. "Hindalco") across all 4 categories |
| **Calls** | Log client calls with duration, recording links, engineer |
| **Messages & Emails** | Track inbound/outbound emails, WhatsApp, SMS |
| **Site Visits** | Company, plant/site, engineer, gatepass docs, PPE, escort info |
| **Activities** | Tasks with priority, status (open → in progress → done), due dates |
| **CSV Export** | Download any category as a `.csv` file from the UI |
| **Filter by Company** | Site Visits page shows a company filter chip bar |

---

## CSV Export

Each page has an **Export CSV** button that downloads all records for that category.

You can also trigger exports directly:
- `GET /api/export?table=calls`
- `GET /api/export?table=messages`
- `GET /api/export?table=site_visits`
- `GET /api/export?table=activities`

---

## Gatepass Reference (Site Visits)

The **Gatepass Documents** field stores a comma-separated list of required documents per company/plant, e.g.:

```
Aadhar Card, Company ID Card, Medical Fitness Certificate, Safety Induction Certificate
```

To look up what's needed for a specific company or plant, use the **Search** on the dashboard or filter by company on the Site Visits page.

---

## OneDrive Sync

1. Save this entire `tracker/` folder to your OneDrive
2. Use **Export CSV** in the app to download the latest data into `tracker/data/`
3. Your exports will sync automatically via OneDrive
