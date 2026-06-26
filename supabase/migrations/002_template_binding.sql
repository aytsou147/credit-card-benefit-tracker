-- Template binding: tie per-user benefit rows to their card template so that
-- template-code edits (new benefits, changed amounts) can be synced to existing
-- users without breaking usage history. usage_logs is intentionally left unchanged
-- (still keyed by benefit_id), so all logged usage is preserved.

-- 1. Cards reference their template (null = custom card)
alter table public.cards add column if not exists template_key text;

-- 2. Benefits carry a stable key + provenance + per-user anniversary anchor
alter table public.benefits add column if not exists benefit_key text;
alter table public.benefits add column if not exists source text not null default 'custom'
  check (source in ('template', 'custom'));
alter table public.benefits add column if not exists cycle_start_date date;

create index if not exists benefits_card_key_idx on public.benefits(card_id, benefit_key);

-- 3. Backfill cards.template_key by matching the current card name
update public.cards set template_key = case name
  when 'Amex Platinum'            then 'amex_platinum'
  when 'Amex Gold'                then 'amex_gold'
  when 'Amex Hilton Aspire'       then 'amex_hilton_aspire'
  when 'World of Hyatt'           then 'world_of_hyatt'
  when 'Atmos Rewards Summit'     then 'atmos_rewards_summit'
  when 'Chase Sapphire Preferred' then 'chase_sapphire_preferred'
  when 'Chase Sapphire Reserve'   then 'chase_sapphire_reserve'
  else template_key
end
where template_key is null;

-- 4. Backfill benefit_key + source for benefits that match a known template
--    benefit. benefit_key is the slug of the name: lower-cased, non-alphanumeric
--    runs collapsed to '_', leading/trailing '_' trimmed (mirrors the TS slug()).
with allow(template_key, benefit_key) as (
  values
    ('amex_platinum', 'fine_hotels_resorts'),
    ('amex_platinum', 'resy_restaurants'),
    ('amex_platinum', 'lululemon'),
    ('amex_platinum', 'oura_ring'),
    ('amex_platinum', 'digital_credit'),
    ('amex_platinum', 'uberone_subscription'),
    ('amex_platinum', 'uber_ubereats'),
    ('amex_platinum', 'flight_incidentals'),
    ('amex_platinum', 'clear'),
    ('amex_platinum', 'saks_5th_avenue'),
    ('amex_platinum', 'global_entry'),
    ('amex_platinum', 'walmart_membership'),
    ('amex_platinum', 'equinox'),
    ('amex_gold', 'uber_and_ubereats'),
    ('amex_gold', 'dunkin_credit'),
    ('amex_gold', 'resy_credit'),
    ('amex_gold', 'dining_credit'),
    ('amex_gold', 'hotel_credit'),
    ('amex_hilton_aspire', 'flight_credit'),
    ('amex_hilton_aspire', 'free_night'),
    ('amex_hilton_aspire', 'resort_credit'),
    ('world_of_hyatt', 'free_night'),
    ('world_of_hyatt', 'additional_free_night'),
    ('atmos_rewards_summit', 'global_companion_award_25k'),
    ('atmos_rewards_summit', 'global_companion_award_100k'),
    ('chase_sapphire_preferred', 'hotel_credit'),
    ('chase_sapphire_preferred', 'doordash'),
    ('chase_sapphire_preferred', 'global_entry_tsa_precheck_nexus'),
    ('chase_sapphire_reserve', 'the_edit'),
    ('chase_sapphire_reserve', 'chase_travel_partner_hotel'),
    ('chase_sapphire_reserve', 'travel'),
    ('chase_sapphire_reserve', 'dining'),
    ('chase_sapphire_reserve', 'stubhub_viagogo'),
    ('chase_sapphire_reserve', 'doordash'),
    ('chase_sapphire_reserve', 'apple_tv_music'),
    ('chase_sapphire_reserve', 'global_entry_tsa_precheck_nexus'),
    ('chase_sapphire_reserve', 'peloton'),
    ('chase_sapphire_reserve', 'lyft')
)
update public.benefits b
set
  benefit_key = trim(both '_' from regexp_replace(lower(b.name), '[^a-z0-9]+', '_', 'g')),
  source = 'template'
from public.cards c
join allow a on a.template_key = c.template_key
where b.card_id = c.id
  and a.benefit_key = trim(both '_' from regexp_replace(lower(b.name), '[^a-z0-9]+', '_', 'g'));
