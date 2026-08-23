# Credit Card Benefit Tracker

Track your credit card benefits and credits usage over time. Never let a credit expire unused again.

## URL

https://credit-card-benefit-tracker-seven.vercel.app

## Features

- Sign in with Google or email/password
- Add credit cards from pre-built templates (Amex Platinum, Gold, Hilton Aspire, Chase Sapphire Reserve/Preferred, Chase Hyatt, Atmos Summit) or create custom cards
- **Template-bound benefits** — template cards' benefits stay tied to the template definitions in code. Adding a benefit or changing a credit amount in a template automatically syncs to every card already using it on next load, without disturbing your logged usage
- Track dollar credits and perks (free nights, companion awards, etc.)
- Add your own custom benefits to any card, with full editing
- Log, edit, and delete individual usage entries for current or past periods (monthly, quarterly, semi-annual, annual, one-time). Usage is capped at the remaining credit for the period
- **Anniversary cycles** — mark an annual benefit to reset on a specific card anniversary date instead of the calendar year
- See point-earning categories per card on the dashboard
- **Due page** — see all benefits expiring soon across every card in one list, filterable by month, quarter, half, or year, with inline usage logging
- Mark recurring benefits as "auto-used" (e.g. subscriptions)
- **Lockable benefits** — mark a benefit that requires a condition first (e.g. "$200 credit after $10K spend") as locked. Locked benefits are hidden from the Due page behind a collapsible section, left out of the card's credit totals, and skipped by reminders until you unlock them
- **Delete cards and benefits** — remove a card you cancelled or added by mistake (from the dashboard tile or the card page), a benefit you'll never use, or a single usage entry. Every deletion asks for confirmation first. Deleting a card also removes its benefits and usage history
- **Restore removed benefits** — removing a benefit that came from a card template hides it everywhere but keeps its usage history, so it never reappears on template sync and can be restored from the "Removed" section on the card page
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

In the Supabase SQL Editor, run the migrations in `supabase/migrations/` in order: `001_initial.sql`, `002_template_binding.sql`, `003_benefit_lock.sql`, then `004_benefit_dismiss.sql`.

### 3. Configure environment

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from **Settings > API** in the Supabase dashboard.
- `NEXT_PUBLIC_SITE_URL` — the public origin of this deployment (`http://localhost:3000` locally, your deployed HTTPS URL in production). Every auth redirect is built from this, so a wrong value sends confirmation emails to the wrong host.

### 4. Configure auth URLs

In **Authentication > URL Configuration**:

- **Site URL** — your production URL (e.g. `https://your-app.vercel.app`). Supabase falls back to this whenever a requested redirect isn't allow-listed, so leaving it as `http://localhost:3000` breaks email links for real users.
- **Redirect URLs** — add `http://localhost:3000/**` and `https://your-app.vercel.app/**` (plus your Vercel preview pattern if you use previews).

In **Authentication > Email Templates > Confirm signup**, point the link at the token-hash route so confirmation works from any device:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```

### 5. Enable Google sign-in (optional)

1. In the [Google Cloud Console](https://console.cloud.google.com), configure the OAuth consent screen and create an **OAuth 2.0 Client ID** of type *Web application*.
2. Set the authorized JavaScript origin to `https://<project-ref>.supabase.co` and the authorized redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback`.
3. In Supabase, go to **Authentication > Providers > Google**, enable it, and paste the Client ID and Client Secret.

### 6. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy to Vercel:

1. Push this repo to GitHub
2. Import into Vercel
3. Add the `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SITE_URL` environment variables
4. Deploy
5. Make sure the deployed URL is set as the Supabase **Site URL** and appears in **Redirect URLs** (step 4 above)
