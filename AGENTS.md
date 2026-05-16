<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Credit Card Benefit Tracker — Agent Guide

## Running the app

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # ESLint
```

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Tech stack

- **Next.js 16** (App Router, `src/app/`) + React 19 + TypeScript
- **Tailwind CSS 4** + shadcn/ui (Base UI primitives under `src/components/ui/`)
- **Supabase** — Auth, Postgres, Row-Level Security. Browser client for all data reads/writes; server client only for auth callback and middleware session refresh.
- **sonner** for toasts, **lucide-react** for icons

## File structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx            # Root layout (fonts, Nav, Toaster)
│   ├── page.tsx              # Dashboard — card grid, add/delete cards
│   ├── due/page.tsx          # Due page — cross-card benefit deadlines with period filter
│   ├── card/[id]/page.tsx    # Card detail — benefit list, log usage, add/delete benefits
│   ├── history/page.tsx      # Year-over-year usage history
│   ├── login/page.tsx        # Email/password auth
│   └── auth/callback/route.ts
├── components/
│   ├── ui/                   # shadcn primitives (Button, Badge, Dialog, Select, etc.)
│   ├── nav.tsx               # Top nav bar with route links
│   ├── card-tile.tsx          # Dashboard card summary tile
│   ├── benefit-row.tsx        # Full benefit row (card detail page)
│   ├── due-benefit-row.tsx    # Compact benefit row with card context (due page)
│   ├── log-usage-dialog.tsx   # Reusable dialog for logging benefit usage
│   ├── add-card-dialog.tsx    # Add card from template or custom
│   ├── add-benefit-dialog.tsx # Add benefit to a card
│   ├── history-table.tsx      # Expandable year history grid
│   └── reminder-badge.tsx     # Expiration reminders + browser notifications
├── lib/
│   ├── types.ts              # Core types: Card, Benefit, UsageLog, CardWithBenefits
│   ├── periods.ts            # Period math: boundaries, labels, usage lookups
│   ├── card-templates.ts     # Pre-built card templates (Amex, Chase, etc.)
│   ├── utils.ts              # cn() utility
│   └── supabase/
│       ├── client.ts         # Browser Supabase client
│       ├── server.ts         # Server Supabase client (cookies)
│       └── middleware.ts     # Session refresh + auth redirect
└── middleware.ts             # Entry point for Supabase middleware
supabase/
└── migrations/001_initial.sql  # Schema: cards, benefits, usage_logs + RLS policies
```

## Data model

- **cards** — `id`, `user_id`, `name`, `issuer`, `annual_fee`, `color`
- **benefits** — `id`, `card_id`, `name`, `description`, `credit_type` (`dollar`|`perk`), `credit_amount`, `period_type` (`monthly`|`quarterly`|`semi_annual`|`annual`|`one_time`), `is_auto_used`, `reminder_enabled`, `reminder_days_before`
- **usage_logs** — `id`, `benefit_id`, `amount_used`, `period_start` (date, e.g. `2026-05-01`), `notes`

Standard nested query pattern used across all pages:

```ts
supabase.from('cards').select('*, benefits (*, usage_logs (*))')
```

## Key conventions

### Code style
- Keep code concise. Avoid verbose comments that restate what the code does.
- Extract reusable logic into `src/lib/` (types, period math, templates).
- Extract reusable UI into `src/components/`. Prefer composing existing components over duplicating code.
- All pages are `'use client'` components that fetch data via the browser Supabase client.
- Use `useRef(createClient())` for a stable Supabase reference; `useCallback` for fetch functions.
- Use `toast` from sonner for success/error feedback.

### UI / UX
- Design for clarity and ease of use. Prefer clean layouts, clear labels, and minimal clicks.
- Use shadcn/ui primitives from `src/components/ui/` for all UI elements.
- Use `lucide-react` icons. Keep icon usage consistent with existing pages.
- Follow the existing responsive patterns: `max-w-5xl` for grids, `max-w-3xl` for detail/list views.
- Loading states use `animate-pulse` placeholder text. Empty states use `border-dashed` containers with an icon, heading, and description.

### Adding new pages
1. Create `src/app/<route>/page.tsx` as a `'use client'` component.
2. Add a nav link in `src/components/nav.tsx` (icon from lucide-react).
3. Update the README features list if the page adds user-facing functionality.

### Documentation
- Update `README.md` when adding features, changing setup steps, or modifying the tech stack.
- Keep this AGENTS.md file current when adding new pages, components, or changing conventions.
