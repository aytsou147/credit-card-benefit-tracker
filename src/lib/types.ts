export type PeriodType = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'one_time';
export type CreditType = 'dollar' | 'perk';
export type BenefitSource = 'template' | 'custom';

export interface Card {
  id: string;
  user_id: string;
  name: string;
  issuer: string;
  annual_fee: number;
  color: string;
  template_key: string | null;
  created_at: string;
}

export interface Benefit {
  id: string;
  card_id: string;
  name: string;
  description: string | null;
  credit_type: CreditType;
  credit_amount: number;
  period_type: PeriodType;
  is_auto_used: boolean;
  // Gated behind an unmet condition (spend threshold, enrollment). Locked benefits
  // are hidden from the Due page, card totals, and reminders until unlocked.
  is_locked: boolean;
  // Removed by the user from a template card. The row is kept so template sync doesn't
  // re-add the benefit; hidden everywhere until restored.
  is_dismissed: boolean;
  reminder_enabled: boolean;
  reminder_days_before: number;
  // Stable key tying this row to its template benefit (null for custom benefits).
  benefit_key: string | null;
  source: BenefitSource;
  // Per-user anniversary anchor for annual benefits that reset on a card date
  // rather than the calendar year. Null = calendar year.
  cycle_start_date: string | null;
  created_at: string;
}

export interface UsageLog {
  id: string;
  benefit_id: string;
  amount_used: number;
  period_start: string;
  notes: string | null;
  created_at: string;
}

export interface BenefitWithUsage extends Benefit {
  usage_logs: UsageLog[];
}

export interface CardWithBenefits extends Card {
  benefits: BenefitWithUsage[];
}
