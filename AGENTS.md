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

Requires `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
`NEXT_PUBLIC_SITE_URL` (see `.env.example`).

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
│   ├── login/page.tsx        # Google OAuth + email/password auth
│   └── auth/
│       ├── callback/route.ts # PKCE `?code=` exchange (Google OAuth returns here)
│       └── confirm/route.ts  # `?token_hash=` verifyOtp (email confirmation links)
├── components/
│   ├── ui/                   # shadcn primitives (Button, Badge, Dialog, Select, etc.)
│   ├── nav.tsx               # Top nav bar with route links
│   ├── card-tile.tsx          # Dashboard card summary tile (credits bar + earning categories)
│   ├── benefit-row.tsx        # Full benefit row + usage-entry list (card detail page)
│   ├── due-benefit-row.tsx    # Compact benefit row with card context (due page)
│   ├── log-usage-dialog.tsx   # Reusable dialog for logging/editing benefit usage
│   ├── add-card-dialog.tsx    # Add card from template or custom
│   ├── add-benefit-dialog.tsx # Add/edit a benefit (edit mode for custom benefits)
│   ├── history-table.tsx      # Expandable year history grid
│   └── reminder-badge.tsx     # Expiration reminders + browser notifications
├── lib/
│   ├── types.ts              # Core types: Card, Benefit, UsageLog, CardWithBenefits
│   ├── periods.ts            # Period math: boundaries, labels, usage lookups (anchor-aware)
│   ├── card-templates.ts     # Pre-built card templates (keys, reward categories, helpers)
│   ├── template-sync.ts      # Reconcile template-bound benefit rows with template code
│   ├── site-url.ts           # Public origin + redirect helpers for auth
│   ├── utils.ts              # cn() utility
│   └── supabase/
│       ├── client.ts         # Browser Supabase client
│       ├── server.ts         # Server Supabase client (cookies)
│       └── proxy.ts          # Session refresh + auth redirect
└── proxy.ts                  # Proxy entry point (Next 16 name for middleware)
supabase/
└── migrations/
    ├── 001_initial.sql          # Schema: cards, benefits, usage_logs + RLS policies
    ├── 002_template_binding.sql # template_key, benefit_key, source, cycle_start_date + backfill
    └── 003_benefit_lock.sql     # is_locked flag for condition-gated benefits
```

## Data model

- **cards** — `id`, `user_id`, `name`, `issuer`, `annual_fee`, `color`, `template_key` (null = custom card)
- **benefits** — `id`, `card_id`, `name`, `description`, `credit_type` (`dollar`|`perk`), `credit_amount`, `period_type` (`monthly`|`quarterly`|`semi_annual`|`annual`|`one_time`), `is_auto_used`, `is_locked` (gated behind an unmet condition — hidden from the Due page, card totals, and reminders), `reminder_enabled`, `reminder_days_before`, `benefit_key` (stable key tying a template benefit to its definition), `source` (`template`|`custom`), `cycle_start_date` (per-user anniversary anchor for annual benefits; null = calendar year)
- **usage_logs** — `id`, `benefit_id`, `amount_used`, `period_start` (date; first of the period, or the anniversary day for anchored annual cycles), `notes`

Standard nested query pattern used across all pages:

```ts
supabase.from('cards').select('*, benefits (*, usage_logs (*))')
```

### Template binding & sync

Benefits on template cards are **bound to the template definitions in code** (`src/lib/card-templates.ts`).
Definition fields (name, description, credit_type, credit_amount, period_type) belong to the template;
user-owned fields (`is_auto_used`, `is_locked`, `reminder_*`, `cycle_start_date`) live on the per-user benefit row and
are never overwritten. `syncCardsWithTemplates()` (`src/lib/template-sync.ts`) runs on dashboard load: it
inserts template benefits added in code and updates drifted definition fields, matched by `benefit_key`.
`usage_logs` are keyed by `benefit_id` and never touched, so history survives definition changes. Template
benefits are **read-only in the UI** (no edit/delete); only `source='custom'` benefits are user-editable. Each
`CardTemplate` also has `key` and `reward_categories` (shown on the dashboard tile via
`rewardCategoriesForCard`). The SQL slug in `002_template_binding.sql` mirrors `slug()` in code.

**Keys are identity; names are display.** Every `BenefitTemplate` and `CardTemplate` declares a required `key`
that must never change once shipped — use `slug(name)` when adding one. `name` is display-only, so renaming a
benefit in code renames the existing row in place and keeps its usage history.

If a rename ships *without* keeping the key (or a key is otherwise changed), sync sees an unknown key and
inserts a second row, splitting the benefit in two. Repair it by restoring the original `key` and listing the
accidentally created one in `previousKeys`: sync then re-points the duplicate's `usage_logs` onto the canonical
row and deletes it, or re-keys the row in place on cards that only ever had the new key. `CardTemplate.previousKeys`
does the same for a renamed card key, rewriting `cards.template_key`. Keep `previousKeys` entries indefinitely —
any database may still hold the old key.

Template rows whose key matches no template benefit (current or historical) are **retired**: sync deletes them
if they have no usage, and `retiredBenefitIds()` flags the rest so the card page shows a "Retired" badge and a
delete button.

### Period math

`src/lib/periods.ts` functions take an optional `anchor` (a benefit's `cycle_start_date`). For annual
benefits with an anchor, the period is a rolling 12-month window starting on the anchor's month/day instead
of Jan 1–Dec 31. Always pass `benefit.cycle_start_date` when computing a benefit's period.

## Auth

Two callback routes, split by flow:

- **`/auth/callback`** — PKCE `?code=` exchange (`exchangeCodeForSession`). Used by Google OAuth. Requires
  the code-verifier cookie from the browser that started the flow, which is fine for OAuth (same browser).
- **`/auth/confirm`** — `?token_hash=&type=` (`verifyOtp`). Used by email links. Carries no verifier, so
  confirming from a different device works. The Supabase **Confirm signup** email template must point here.

Never build an auth redirect from `window.location.origin` or `new URL(request.url).origin` — the first
breaks on preview deploys, the second yields Vercel's internal origin. Use `getSiteURL()` (client) or
`getRequestOrigin(request.headers)` (route handlers) from `src/lib/site-url.ts`, and pass any `next`
destination through `safeNext()` to block open redirects.

Supabase silently ignores a `redirect_to` that isn't on the project's **Redirect URLs** allow-list and
falls back to the **Site URL**, so dashboard config is part of any auth change (see README setup).

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
