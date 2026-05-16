# Credit Card Benefit Tracker

Track your credit card benefits and credits usage over time. Never let a credit expire unused again.

## URL

https://credit-card-benefit-tracker-seven.vercel.app

## Features

- Add credit cards from pre-built templates (Amex Platinum, Gold, Hilton Aspire, Chase Sapphire Reserve/Preferred, Chase Hyatt, Atmos Summit) or create custom cards
- Track dollar credits and perks (free nights, companion awards, etc.)
- Log usage for current or past periods (monthly, quarterly, semi-annual, annual, one-time)
- **Due page** — see all benefits expiring soon across every card in one list, filterable by month, quarter, half, or year, with inline usage logging
- Mark recurring benefits as "auto-used" (e.g. subscriptions)
- Set reminders for credits expiring soon (visual + browser notifications)
- View cumulative year-over-year usage history
- Responsive design for desktop and mobile

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui
- **Supabase** (Auth + Postgres + Row-Level Security)

## Setup

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com) and create a free project.

### 2. Run the migration

In the Supabase SQL Editor, run the contents of `supabase/migrations/001_initial.sql`.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in your Supabase project URL and anon key from **Settings > API** in the Supabase dashboard.

### 4. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy to Vercel:

1. Push this repo to GitHub
2. Import into Vercel
3. Add the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables
4. Deploy
