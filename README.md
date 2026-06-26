# Credit Card Benefit Tracker

Track your credit card benefits and credits usage over time. Never let a credit expire unused again.

## URL

https://credit-card-benefit-tracker-seven.vercel.app

## Features

- Add credit cards from pre-built templates (Amex Platinum, Gold, Hilton Aspire, Chase Sapphire Reserve/Preferred, Chase Hyatt, Atmos Summit) or create custom cards
- **Template-bound benefits** — template cards' benefits stay tied to the template definitions in code. Adding a benefit or changing a credit amount in a template automatically syncs to every card already using it on next load, without disturbing your logged usage
- Track dollar credits and perks (free nights, companion awards, etc.)
- Add your own custom benefits to any card, with full editing
- Log, edit, and delete individual usage entries for current or past periods (monthly, quarterly, semi-annual, annual, one-time). Usage is capped at the remaining credit for the period
- **Anniversary cycles** — mark an annual benefit to reset on a specific card anniversary date instead of the calendar year
- See point-earning categories per card on the dashboard
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
9
Go to [supabase.com](https://supabase.com) and create a free project.

### 2. Run the migrations

In the Supabase SQL Editor, run the migrations in `supabase/migrations/` in order: `001_initial.sql`, then `002_template_binding.sql`.

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
