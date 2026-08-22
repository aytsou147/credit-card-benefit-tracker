-- Per-benefit lock flag for benefits gated behind a condition (spend threshold,
-- enrollment, membership). Locked benefits are hidden from the Due page, excluded
-- from dashboard credit totals, and skipped by reminders.
-- User-owned: template sync must never overwrite it.

alter table public.benefits add column if not exists is_locked boolean not null default false;
