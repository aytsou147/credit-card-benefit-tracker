import { CreditType, PeriodType } from './types';

export interface BenefitTemplate {
  name: string;
  description: string | null;
  credit_type: CreditType;
  credit_amount: number;
  period_type: PeriodType;
  is_auto_used: boolean;
}

export interface CardTemplate {
  name: string;
  issuer: string;
  annual_fee: number;
  color: string;
  benefits: BenefitTemplate[];
}

export const CARD_TEMPLATES: CardTemplate[] = [
  {
    name: 'Amex Platinum',
    issuer: 'American Express',
    annual_fee: 895,
    color: '#8B8B8B',
    benefits: [
      { name: 'Fine Hotels & Resorts', description: '$300 per half year', credit_type: 'dollar', credit_amount: 300, period_type: 'semi_annual', is_auto_used: false },
      { name: 'Resy Restaurants', description: '$100 per quarter', credit_type: 'dollar', credit_amount: 100, period_type: 'quarterly', is_auto_used: false },
      { name: 'Lululemon', description: '$75 per quarter', credit_type: 'dollar', credit_amount: 75, period_type: 'quarterly', is_auto_used: false },
      { name: 'Oura Ring', description: 'Hardware only', credit_type: 'dollar', credit_amount: 200, period_type: 'annual', is_auto_used: false },
      { name: 'Digital Credit', description: '$25/month', credit_type: 'dollar', credit_amount: 25, period_type: 'monthly', is_auto_used: true },
      { name: 'UberOne Subscription', description: '$9.99/month, automatic', credit_type: 'dollar', credit_amount: 9.99, period_type: 'monthly', is_auto_used: true },
      { name: 'Uber & UberEats', description: '$15/month + extra $20 in December', credit_type: 'dollar', credit_amount: 15, period_type: 'monthly', is_auto_used: false },
      { name: 'Flight Incidentals', description: '$200/year', credit_type: 'dollar', credit_amount: 200, period_type: 'annual', is_auto_used: false },
      { name: 'CLEAR', description: 'Automatic enrollment', credit_type: 'dollar', credit_amount: 189, period_type: 'annual', is_auto_used: true },
      { name: 'Saks 5th Avenue', description: '$50 per half year', credit_type: 'dollar', credit_amount: 50, period_type: 'semi_annual', is_auto_used: false },
      { name: 'Global Entry', description: 'Resets every 4 years, not annually', credit_type: 'dollar', credit_amount: 120, period_type: 'annual', is_auto_used: false },
      { name: 'Walmart+ Membership', description: '$14/month, automatic', credit_type: 'dollar', credit_amount: 14, period_type: 'monthly', is_auto_used: true },
      { name: 'Equinox', description: '$300/year gym credit', credit_type: 'dollar', credit_amount: 300, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    name: 'Amex Gold',
    issuer: 'American Express',
    annual_fee: 325,
    color: '#D4AF37',
    benefits: [
      { name: 'Uber and UberEats', description: '$10/month', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { name: 'Dunkin Credit', description: '$7/month', credit_type: 'dollar', credit_amount: 7, period_type: 'monthly', is_auto_used: false },
      { name: 'Resy Credit', description: '$50 per half year', credit_type: 'dollar', credit_amount: 50, period_type: 'semi_annual', is_auto_used: false },
      { name: 'Dining Credit', description: 'GrubHub, Five Guys, etc. $10/month', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { name: 'Hotel Credit', description: '$100/year', credit_type: 'dollar', credit_amount: 100, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    name: 'Amex Hilton Aspire',
    issuer: 'American Express',
    annual_fee: 550,
    color: '#003B5C',
    benefits: [
      { name: 'Flight Credit', description: '$50 per quarter', credit_type: 'dollar', credit_amount: 50, period_type: 'quarterly', is_auto_used: false },
      { name: 'Free Night', description: 'One free night per year', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
      { name: 'Resort Credit', description: '$200 per half year', credit_type: 'dollar', credit_amount: 200, period_type: 'semi_annual', is_auto_used: false },
    ],
  },
  {
    name: 'Chase Hyatt',
    issuer: 'Chase',
    annual_fee: 95,
    color: '#1A1F71',
    benefits: [
      { name: 'Free Night (Category 4)', description: 'One free night per year', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
      { name: 'Additional Free Night (Category 4)', description: 'Requires $15K spend', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    name: 'Atmos Summit',
    issuer: 'Atmos Financial',
    annual_fee: 395,
    color: '#2E7D32',
    benefits: [
      { name: 'Companion Award (25K miles)', description: '~$300 value', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
      { name: 'Global Companion Award (100K miles)', description: 'Requires $60K spend', credit_type: 'perk', credit_amount: 0, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    annual_fee: 95,
    color: '#0D47A1',
    benefits: [
      { name: 'Hotel Credit', description: '$50/year', credit_type: 'dollar', credit_amount: 50, period_type: 'annual', is_auto_used: false },
    ],
  },
  {
    name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    annual_fee: 550,
    color: '#1A237E',
    benefits: [
      { name: 'The Edit', description: 'Starting 2026, can use anytime with min 2-night stay via Chase Travel', credit_type: 'dollar', credit_amount: 250, period_type: 'semi_annual', is_auto_used: false },
      { name: 'Travel', description: '$300 annually', credit_type: 'dollar', credit_amount: 300, period_type: 'annual', is_auto_used: false },
      { name: 'Dining', description: '$150 per half year', credit_type: 'dollar', credit_amount: 150, period_type: 'semi_annual', is_auto_used: false },
      { name: 'StubHub & Viagogo', description: '$150 per half year', credit_type: 'dollar', credit_amount: 150, period_type: 'semi_annual', is_auto_used: false },
      { name: 'DoorDash', description: '2x$10 non-restaurant promos + 1x$5 restaurant promo per month', credit_type: 'dollar', credit_amount: 25, period_type: 'monthly', is_auto_used: false },
      { name: 'Apple', description: 'One-time activation required', credit_type: 'dollar', credit_amount: 288, period_type: 'one_time', is_auto_used: false },
      { name: 'Global Entry / TSA PreCheck / Nexus', description: 'Resets every 4 years', credit_type: 'dollar', credit_amount: 120, period_type: 'annual', is_auto_used: false },
      { name: 'Peloton', description: '$10/month membership credit', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
      { name: 'Lyft', description: '$10/month in-app credit', credit_type: 'dollar', credit_amount: 10, period_type: 'monthly', is_auto_used: false },
    ],
  },
];
