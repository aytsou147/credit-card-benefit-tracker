export type PeriodType = 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'one_time';
export type CreditType = 'dollar' | 'perk';

export interface Card {
  id: string;
  user_id: string;
  name: string;
  issuer: string;
  annual_fee: number;
  color: string;
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
  reminder_enabled: boolean;
  reminder_days_before: number;
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
