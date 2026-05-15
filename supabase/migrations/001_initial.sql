-- Cards table
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  issuer text not null default '',
  annual_fee numeric not null default 0,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

create policy "Users can view own cards"
  on public.cards for select using (auth.uid() = user_id);
create policy "Users can insert own cards"
  on public.cards for insert with check (auth.uid() = user_id);
create policy "Users can update own cards"
  on public.cards for update using (auth.uid() = user_id);
create policy "Users can delete own cards"
  on public.cards for delete using (auth.uid() = user_id);

create index cards_user_id_idx on public.cards(user_id);

-- Benefits table
create table public.benefits (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  name text not null,
  description text,
  credit_type text not null default 'dollar' check (credit_type in ('dollar', 'perk')),
  credit_amount numeric not null default 0,
  period_type text not null default 'monthly' check (period_type in ('monthly', 'quarterly', 'semi_annual', 'annual', 'one_time')),
  is_auto_used boolean not null default false,
  reminder_enabled boolean not null default false,
  reminder_days_before integer not null default 7,
  created_at timestamptz not null default now()
);

alter table public.benefits enable row level security;

create policy "Users can view own benefits"
  on public.benefits for select
  using (exists (select 1 from public.cards where cards.id = benefits.card_id and cards.user_id = auth.uid()));
create policy "Users can insert own benefits"
  on public.benefits for insert
  with check (exists (select 1 from public.cards where cards.id = benefits.card_id and cards.user_id = auth.uid()));
create policy "Users can update own benefits"
  on public.benefits for update
  using (exists (select 1 from public.cards where cards.id = benefits.card_id and cards.user_id = auth.uid()));
create policy "Users can delete own benefits"
  on public.benefits for delete
  using (exists (select 1 from public.cards where cards.id = benefits.card_id and cards.user_id = auth.uid()));

create index benefits_card_id_idx on public.benefits(card_id);

-- Usage logs table
create table public.usage_logs (
  id uuid primary key default gen_random_uuid(),
  benefit_id uuid not null references public.benefits(id) on delete cascade,
  amount_used numeric not null default 0,
  period_start date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.usage_logs enable row level security;

create policy "Users can view own usage logs"
  on public.usage_logs for select
  using (exists (
    select 1 from public.benefits b
    join public.cards c on c.id = b.card_id
    where b.id = usage_logs.benefit_id and c.user_id = auth.uid()
  ));
create policy "Users can insert own usage logs"
  on public.usage_logs for insert
  with check (exists (
    select 1 from public.benefits b
    join public.cards c on c.id = b.card_id
    where b.id = usage_logs.benefit_id and c.user_id = auth.uid()
  ));
create policy "Users can update own usage logs"
  on public.usage_logs for update
  using (exists (
    select 1 from public.benefits b
    join public.cards c on c.id = b.card_id
    where b.id = usage_logs.benefit_id and c.user_id = auth.uid()
  ));
create policy "Users can delete own usage logs"
  on public.usage_logs for delete
  using (exists (
    select 1 from public.benefits b
    join public.cards c on c.id = b.card_id
    where b.id = usage_logs.benefit_id and c.user_id = auth.uid()
  ));

create index usage_logs_benefit_id_idx on public.usage_logs(benefit_id);
create index usage_logs_period_start_idx on public.usage_logs(period_start);
