import { CreditType, PeriodType } from './types';

export interface BenefitTemplate {
  // Permanent identity of this benefit, stored on benefits.benefit_key. Never
  // change it once shipped — `name` is display-only and may be renamed freely.
  // Use slug(name) when adding a new benefit.
  key: string;
  // Keys this same benefit was previously stored under. Sync merges any row
  // still carrying one of these onto the canonical key. Add an entry only to
  // repair a rename that already shipped and split a row in two.
  previousKeys?: string[];
  name: string;
  description: string | null;
  credit_type: CreditType;
  credit_amount: number;
  period_type: PeriodType;
  is_auto_used: boolean;
}

export interface CardTemplate {
  // Stable identifier stored on cards.template_key. Never change it.
  key: string;
  // Keys this card template was previously stored under; sync rewrites matching
  // cards.template_key to the current key.
  previousKeys?: string[];
  name: string;
  issuer: string;
  annual_fee: number;
  color: string;
  // Point-earning categories shown on the dashboard tile, one per line,
  // e.g. ['5X on Airlines', '3X on Restaurants and Travel', '1X on everything else'].
  reward_categories: string[];
  benefits: BenefitTemplate[];
}

/** Slug used to derive a benefit's stable key from its name. Mirrors the SQL
 *  backfill in migration 002 (lower-case, non-alphanumeric runs -> '_', trimmed). */
export function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function benefitKey(b: BenefitTemplate): string {
  return b.key;
}

/** All keys a benefit row may legitimately carry: its current key plus any historical ones. */
export function benefitKeyAliases(b: BenefitTemplate): string[] {
  return [b.key, ...(b.previousKeys ?? [])];
}

export function getTemplate(templateKey: string | null | undefined): CardTemplate | undefined {
  if (!templateKey) return undefined;
  return (
    CARD_TEMPLATES.find((t) => t.key === templateKey) ??
    CARD_TEMPLATES.find((t) => t.previousKeys?.includes(templateKey))
  );
}

export function rewardCategoriesForCard(card: { template_key: string | null }): string[] {
  return getTemplate(card.template_key)?.reward_categories ?? [];
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    key: 'amex_platinum',
    name: 'Amex Platinum',
    issuer: 'American Express',
    annual_fee: 895,
    color: '#8B8B8B',
    reward_categories: [
      '5X on Amex Travel',
      '5X on Flights',
      '1X on everything else',
    ],
    benefits: [
      { key: 'fine_hotels_resorts', name: 'Fine Hotels & Resorts', description: '$300/half year', credit_type: 'dollar', credit_amount: 300, period_type: 'semi_annual', is_auto_used: false },
      { key: 'resy_restaurants', name: 'Resy Restaurants', description: '$100/quarter', credit_type: 'dollar', credit_amount: 100, period_type: 'quarterly', is_auto_used: false },
      { key: 'lululemon', name: 'Lululemon', description: '$75/quarter', credit_type: 'dollar', credit_amount: 75, period_type: 'quarterly', is_auto_used: false },
      { key: 'oura_ring', name: 'Oura Ring', description: '$200/year, hardware only', credit_type: 'dollar', credit_amount: 200, period_type: 'annual', is_auto_used: false },
      { key: 'digital_credit', name: 'Digital Credit', description: '$25/month', credit_type: 'dollar', credit_amount: 25, period_type: 'monthly', is_auto_used: true },
      { key: 'uberone_subscription', name: 'UberOne Subscription', description: '$9.99/month', credit_type: 'dollar', credit_amount: 9.99, period_type: 'monthly', is_auto_used: true },
      { key: 'uber_ubereats', name: 'Uber & UberEats', description: '$15/month + extra $20 in December', credit_type: 'dollar', credit_amount: 15, period_type: 'monthly', is_auto_used: false },
      { key: 'flight_incidentals', name: 'Flight Incidentals', description: '$200/year, single airline', credit_type: 'dollar', credit_amount: 200, period_type: 'annual', is_auto_used: false },
      { key: 'clear', name: 'CLEAR', description: '$189 per year', credit_type: 'dollar', credit_amount: 189, period_type: 'annual', is_auto_used: true },
      { key: 'saks_5th_avenue', name: 'Saks 5th Avenue', description: '$50 per half year', credit_type: 'dollar', credit_amount: 50, period_type: 'semi_annual', is_auto_used: false },
      { key: 'global_entry', previousKeys: ['global_entry_tsa_precheck'], name: 'Global Entry / TSA Precheck', description: 'Resets every 4 years, not annually', credit_type: 'dollar', credit_amount: 120, period_type: 'annual', is_auto_used: false },
      { key: 'walmart_membership', name: 'Walmart+ Membership', description: '$14 per month', credit_type: 'dollar', credit_amount: 14, period_type: 'monthly', is_auto_used: true },
      { key: 'equinox', name: 'Equinox', description: '$300/year gym credit', credit_type: 'dollar', credit_amount: 300, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'amex_gold',
    name: 'Amex Gold',
    issuer: 'American Express',
    annual_fee: 325,
    color: '#D4AF37',
    reward_categories: [
      '5X on Amex Travel',
      '4X on Dining',
      '4X on Groceries',
      '3X on Flights',
      '1X on everything else',
    ],
    benefits: [
      { key: 'uber_and_ubereats', name: 'Uber and UberEats', description: '$10/month', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { key: 'dunkin_credit', previousKeys: ['dunkin_donuts'], name: 'Dunkin Donuts', description: '$7/month', credit_type: 'dollar', credit_amount: 7, period_type: 'monthly', is_auto_used: false },
      { key: 'resy_credit', previousKeys: ['resy_restaurants'], name: 'Resy Restaurants', description: '$50/half year', credit_type: 'dollar', credit_amount: 50, period_type: 'semi_annual', is_auto_used: false },
      { key: 'dining_credit', name: 'Dining Credit', description: '$10/month for GrubHub, Five Guys, etc', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { key: 'hotel_credit', name: 'Hotel Credit', description: '$100/year', credit_type: 'dollar', credit_amount: 100, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'hilton_honors_aspire',
    previousKeys: ['amex_hilton_aspire'],
    name: 'Hilton Honors Aspire',
    issuer: 'American Express',
    annual_fee: 550,
    color: '#003B5C',
    reward_categories: [
      '14X on Hilton Hotels',
      '7X on Flights',
      '7X on Car Rentals',
      '7X on Dining',
      '3X on everything else',
    ],
    benefits: [
      { key: 'flight_credit', name: 'Flight Credit', description: '$50/quarter', credit_type: 'dollar', credit_amount: 50, period_type: 'quarterly', is_auto_used: false },
      { key: 'free_night', name: 'Free Night', description: 'One free night per year', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
      { key: 'resort_credit', name: 'Resort Credit', description: '$200/half year', credit_type: 'dollar', credit_amount: 200, period_type: 'semi_annual', is_auto_used: false },
    ],
  },
  {
    key: 'world_of_hyatt',
    name: 'World of Hyatt',
    issuer: 'Chase',
    annual_fee: 95,
    color: '#1A1F71',
    reward_categories: [
      '9X on Hyatt Stays',
      '4X on Hyatt Experiences',
      '2X on Dining',
      '2X on Airfare',
      '2X on Local Transit',
      '2X on Fitness Clubs',
      '1X on everything else',
    ],
    benefits: [
      { key: 'free_night', name: 'Free Night', description: 'One free Category 4 night per year', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
      { key: 'additional_free_night', name: 'Additional Free Night', description: 'Requires $15K spend, Category 4 or below', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'atmos_rewards_summit',
    name: 'Atmos Rewards Summit',
    issuer: 'Bank of America',
    annual_fee: 395,
    color: '#2E7D32',
    reward_categories: [
      '3X on Alaska / Hawaiian Airlines',
      '3X on Dining',
      '3X on Foreign Transactions',
      '1X on everything else',
      '1 status point per $2'
    ],
    benefits: [
      { key: 'global_companion_award_25k', name: 'Global Companion Award (25K)', description: 'Must be used for a second person on same flight', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
      { key: 'global_companion_award_100k', name: 'Global Companion Award (100K)', description: 'Requires $60K spend', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'atmos_rewards_ascent',
    name: 'Atmos Rewards Ascent',
    issuer: 'Bank of America',
    annual_fee: 395,
    color: '#6d6cb4',
    reward_categories: [
      '3X on Alaska / Hawaiian Airlines',
      '2X on Gas & EV Charging',
      '2X on Transit',
      '2X on Cable and Streaming',
      '1X on everything else',
      '1 status point per $3'
    ],
    benefits: [
      { key: 'companion_fare', name: 'Companion Fare', description: '$99 companion fare each account anniversary', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'chase_sapphire_preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annual_fee: 95,
    color: '#0D47A1',
    reward_categories: [
      '5X on Chase Travel',
      '3X on Dining',
      '3X on Gas & EV Charging',
      '3X on Vacation Homes',
      '3X on Online Groceries',
      '3X on Streaming',
      '2X on Travel',
      '1X on everything else',
    ],
    benefits: [
      { key: 'hotel_credit', name: 'Hotel Credit', description: '$100/year in Chase Travel', credit_type: 'dollar', credit_amount: 100, period_type: 'annual', is_auto_used: false },
      { key: 'doordash', name: 'DoorDash', description: '$10 x2 non-restaurant + $5 restaurant per month', credit_type: 'dollar', credit_amount: 25, period_type: 'monthly', is_auto_used: false },
      { key: 'global_entry_tsa_precheck_nexus', name: 'Global Entry / TSA PreCheck / Nexus', description: 'Resets every 4 years', credit_type: 'dollar', credit_amount: 120, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'chase_sapphire_reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annual_fee: 550,
    color: '#1A237E',
    reward_categories: [
      '8X on Chase Travel',
      '4X on Flights & Hotels',
      '3X on Dining',
      '5X on Lyft',
      '1X on everything else',
    ],
    benefits: [
      { key: 'the_edit', name: 'The Edit', description: '$500/year, 2 x $250 credits, min 2-night stay via Chase Travel', credit_type: 'dollar', credit_amount: 500, period_type: 'annual', is_auto_used: false },
      { key: 'chase_travel_partner_hotel', name: 'Chase Travel Partner Hotel', description: '$250/years, min 2-night stay via Chase Travel at IHG, Montages, Pendry, Omni, Virgin, Minor, and Pan Pacific', credit_type: 'dollar', credit_amount: 250, period_type: 'annual', is_auto_used: false },
      { key: 'travel', name: 'Travel', description: '$300/year', credit_type: 'dollar', credit_amount: 300, period_type: 'annual', is_auto_used: false },
      { key: 'dining', name: 'Dining', description: '$150/half year, OpenTable (only certain restaurants)', credit_type: 'dollar', credit_amount: 150, period_type: 'semi_annual', is_auto_used: false },
      { key: 'stubhub_viagogo', name: 'StubHub & Viagogo', description: '$150/half year', credit_type: 'dollar', credit_amount: 150, period_type: 'semi_annual', is_auto_used: false },
      { key: 'doordash', name: 'DoorDash', description: '$10 x2 non-restaurant + $5 restaurant per month', credit_type: 'dollar', credit_amount: 25, period_type: 'monthly', is_auto_used: false },
      { key: 'apple_tv_music', name: 'Apple TV & Music', description: '$12.99/month, until 6/22/2027', credit_type: 'dollar', credit_amount: 13, period_type: 'monthly', is_auto_used: false },
      { key: 'global_entry_tsa_precheck_nexus', name: 'Global Entry / TSA PreCheck / Nexus', description: 'Resets every 4 years', credit_type: 'dollar', credit_amount: 120, period_type: 'annual', is_auto_used: false },
      { key: 'peloton', name: 'Peloton', description: '$10/month membership credit', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { key: 'lyft', name: 'Lyft', description: '$10/month in-app credit', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
    ],
  },
  {
    key: 'capital_one_venture_x',
    name: 'Capital One Venture X',
    issuer: 'Capital One',
    annual_fee: 395,
    color: '#6398c7a8',
    reward_categories: [
      '10X on Hotels / Rental Cars via Capital One Travel',
      '5X on Flights via Capital One Travel',
      '2X on everything else',
    ],
    benefits: [
      { key: 'capital_one_travel_credit', name: 'Capital One Travel Credit', description: '$300/year, bookings via Capital One Travel', credit_type: 'dollar', credit_amount: 300, period_type: 'annual', is_auto_used: false },
      { key: 'global_entry_tsa_precheck', name: 'Global Entry / TSA Precheck', description: 'Resets every 4 years, not annually', credit_type: 'dollar', credit_amount: 120, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'delta_sky_miles_reserve',
    name: 'Delta SkyMiles Reserve',
    issuer: 'American Express',
    annual_fee: 650,
    color: '#7d20a1a8',
    reward_categories: [
      '3X on Delta',
      '1X on everything else',
      '$1 MQD per $10'
    ],
    benefits: [
      { key: 'companion_certificate', name: 'Companion Certificate', description: 'Companion on round-trip flight within U.S. and to Mexico, Caribbean, or Central America', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
      { key: 'resy_restaurants', name: 'Resy Restaurants', description: '$20/month on eligible Resy restaurants', credit_type: 'dollar', credit_amount: 20, period_type: 'monthly', is_auto_used: false },
      { key: 'delta_sky_club_access', name: 'Delta Sky Club Access', description: '15 visits each Medallion Year to the Delta Sky Club when flying Delta', credit_type: 'perk', credit_amount: 15, period_type: 'annual', is_auto_used: false },
      { key: 'rideshare', name: 'Rideshare', description: '$10/month on U.S. rideshare purchases', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { key: 'delta_stays', name: 'Delta Stays', description: '$200/year on prepaid hotel or vacation rental through Delta Stays', credit_type: 'dollar', credit_amount: 200, period_type: 'annual', is_auto_used: false },
      { key: 'global_entry_tsa_precheck', name: 'Global Entry / TSA Precheck', description: 'Resets every 4 years, not annually', credit_type: 'dollar', credit_amount: 120, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'delta_sky_miles_platinum',
    name: 'Delta SkyMiles Platinum',
    issuer: 'American Express',
    annual_fee: 350,
    color: '#7d20a1a8',
    reward_categories: [
      '2X on Delta',
      '3X on Hotels',
      '2X on Dining',
      '2X on Groceries',
      '1X on everything else',
      '$1 MQD per $20'
    ],
    benefits: [
      { key: 'companion_certificate', name: 'Companion Certificate', description: 'Companion on round-trip flight within U.S. and to Mexico, Caribbean, or Central America', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
      { key: 'resy_restaurants', name: 'Resy Restaurants', description: '$10/month on eligible Resy restaurants', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { key: 'rideshare', name: 'Rideshare', description: '$10/month on U.S. rideshare purchases', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { key: 'delta_stays', name: 'Delta Stays', description: '$150/year on prepaid hotel or vacation rental through Delta Stays', credit_type: 'dollar', credit_amount: 150, period_type: 'annual', is_auto_used: false },
      { key: 'global_entry_tsa_precheck', name: 'Global Entry / TSA Precheck', description: 'Resets every 4 years, not annually', credit_type: 'dollar', credit_amount: 120, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'delta_sky_miles_gold',
    name: 'Delta SkyMiles Gold',
    issuer: 'American Express',
    annual_fee: 150,
    color: '#e0be23a8',
    reward_categories: [
      '2X on Delta',
      '2X on Dining',
      '2X on Groceries',
      '1X on everything else',
    ],
    benefits: [
      { key: 'delta_flight_credit', name: 'Delta Flight Credit', description: '$200/year after spending $10K', credit_type: 'dollar', credit_amount: 200, period_type: 'annual', is_auto_used: false },
      { key: 'rideshare', name: 'Rideshare', description: '$10/month on U.S. rideshare purchases', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { key: 'delta_stays', name: 'Delta Stays', description: '$100/year on prepaid hotel or vacation rental through Delta Stays', credit_type: 'dollar', credit_amount: 100, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    key: 'bilt_palladium',
    name: 'Bilt Palladium',
    issuer: 'Mastercard',
    annual_fee: 495,
    color: '#eeede8a8',
    reward_categories: [
      '2X on Delta',
      '2X on Dining',
      '2X on Groceries',
      '1X on everything else',
    ],
    benefits: [
      { key: 'bilt_travel_portal_hotel_credit', name: 'Bilt Travel Portal Hotel Credit', description: '$200/half year', credit_type: 'dollar', credit_amount: 200, period_type: 'semi_annual', is_auto_used: false },
    ],
  }
];
