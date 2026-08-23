-- Per-benefit dismiss flag. Removing a template benefit sets this instead of deleting the
-- row: the row is retained so template sync still sees its benefit_key and never re-inserts
-- the benefit, and its usage history survives a later restore. Dismissed benefits are hidden
-- from the card's benefit list, the Due page, dashboard totals, history, and reminders.
-- User-owned: template sync must never overwrite it.

alter table public.benefits add column if not exists is_dismissed boolean not null default false;
