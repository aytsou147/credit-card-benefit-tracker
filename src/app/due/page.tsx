'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CardWithBenefits, BenefitWithUsage } from '@/lib/types';
import { DueBenefitRow } from '@/components/due-benefit-row';
import { LogUsageDialog } from '@/components/log-usage-dialog';
import { getCurrentPeriod, getUsageForPeriod, daysUntilPeriodEnd } from '@/lib/periods';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { toast } from 'sonner';

type ViewPeriod = 'month' | 'quarter' | 'half' | 'year';

const VIEW_PERIOD_LABELS: Record<ViewPeriod, string> = {
  month: 'This Month',
  quarter: 'This Quarter',
  half: 'This Half',
  year: 'This Year',
};

interface DueBenefit {
  benefit: BenefitWithUsage;
  cardName: string;
  cardColor: string;
  isFullyUsed: boolean;
  daysLeft: number;
}

function getWindowEnd(viewPeriod: ViewPeriod): Date {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  switch (viewPeriod) {
    case 'month':
      return new Date(year, month + 1, 0);
    case 'quarter': {
      const qEnd = Math.floor(month / 3) * 3 + 3;
      return new Date(year, qEnd, 0);
    }
    case 'half': {
      const hEnd = month < 6 ? 6 : 12;
      return new Date(year, hEnd, 0);
    }
    case 'year':
      return new Date(year, 11, 31);
  }
}

function periodEndsWithinWindow(periodEnd: Date, viewPeriod: ViewPeriod): boolean {
  return periodEnd <= getWindowEnd(viewPeriod);
}

export default function DuePage() {
  const [cards, setCards] = useState<CardWithBenefits[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('month');
  const [logBenefit, setLogBenefit] = useState<BenefitWithUsage | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [showLocked, setShowLocked] = useState(false);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchCards = useCallback(async () => {
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,
        benefits (
          *,
          usage_logs (*)
        )
      `)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load cards');
      console.error(error);
    } else {
      setCards(data as CardWithBenefits[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  async function handleLogUsage(benefitId: string, amount: number, periodStart: string, notes: string) {
    const { error } = await supabase.from('usage_logs').insert({
      benefit_id: benefitId,
      amount_used: amount,
      period_start: periodStart,
      notes: notes || null,
    });
    if (error) {
      toast.error('Failed to log usage');
    } else {
      toast.success('Usage logged');
      fetchCards();
    }
  }

  async function handleToggleLocked(benefitId: string, value: boolean) {
    const { error } = await supabase
      .from('benefits')
      .update({ is_locked: value })
      .eq('id', benefitId);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(value ? 'Benefit locked' : 'Benefit unlocked');
      fetchCards();
    }
  }

  const inWindow: DueBenefit[] = cards.flatMap((card) =>
    card.benefits
      .filter((b) => {
        if (b.is_dismissed || b.period_type === 'one_time') return false;
        const period = getCurrentPeriod(b.period_type, b.cycle_start_date);
        return periodEndsWithinWindow(period.end, viewPeriod);
      })
      .map((b) => {
        const period = getCurrentPeriod(b.period_type, b.cycle_start_date);
        const used = b.is_auto_used
          ? b.credit_amount
          : getUsageForPeriod(b.usage_logs, period.start);
        const isDollar = b.credit_type === 'dollar';
        const isFullyUsed = isDollar ? used >= b.credit_amount : used > 0;
        return {
          benefit: b,
          cardName: card.name,
          cardColor: card.color,
          isFullyUsed,
          daysLeft: daysUntilPeriodEnd(b.period_type, b.cycle_start_date),
        };
      })
  );

  const byUrgency = (a: DueBenefit, b: DueBenefit) => {
    if (a.isFullyUsed !== b.isFullyUsed) return a.isFullyUsed ? 1 : -1;
    return a.daysLeft - b.daysLeft;
  };

  const dueBenefits = inWindow.filter((d) => !d.benefit.is_locked).sort(byUrgency);
  const lockedBenefits = inWindow.filter((d) => d.benefit.is_locked).sort(byUrgency);

  const totalDue = dueBenefits.length;
  const totalUsed = dueBenefits.filter((d) => d.isFullyUsed).length;
  const now = new Date();
  const windowEnd = getWindowEnd(viewPeriod);
  const daysLeftInWindow = Math.max(0, Math.ceil((windowEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const periodLabel = VIEW_PERIOD_LABELS[viewPeriod].toLowerCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Due {VIEW_PERIOD_LABELS[viewPeriod]}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalUsed} of {totalDue} benefit{totalDue !== 1 ? 's' : ''} used · {daysLeftInWindow} day{daysLeftInWindow !== 1 ? 's' : ''} left
          </p>
        </div>
        <Select value={viewPeriod} onValueChange={(v) => v && setViewPeriod(v as ViewPeriod)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(VIEW_PERIOD_LABELS) as [ViewPeriod, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {totalDue === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-lg font-semibold">Nothing due {periodLabel}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lockedBenefits.length > 0
              ? 'Every benefit ending this period is locked until its condition is met.'
              : `No benefit periods end ${periodLabel}, or you haven't added any cards yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {dueBenefits.map((item) => (
            <DueBenefitRow
              key={item.benefit.id}
              benefit={item.benefit}
              cardName={item.cardName}
              cardColor={item.cardColor}
              onLogUsage={(b) => {
                setLogBenefit(b);
                setLogOpen(true);
              }}
              onToggleLocked={handleToggleLocked}
            />
          ))}
        </div>
      )}

      {lockedBenefits.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowLocked((v) => !v)}
          >
            {showLocked ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Lock className="h-4 w-4" />
            {lockedBenefits.length} locked benefit{lockedBenefits.length !== 1 ? 's' : ''}
          </button>
          {showLocked && (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-muted-foreground">
                These require a condition first (e.g. a spend threshold). Unlock one when you
                qualify and it moves into the list above.
              </p>
              {lockedBenefits.map((item) => (
                <DueBenefitRow
                  key={item.benefit.id}
                  benefit={item.benefit}
                  cardName={item.cardName}
                  cardColor={item.cardColor}
                  onLogUsage={(b) => {
                    setLogBenefit(b);
                    setLogOpen(true);
                  }}
                  onToggleLocked={handleToggleLocked}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <LogUsageDialog
        benefit={logBenefit}
        open={logOpen}
        onOpenChange={setLogOpen}
        onSubmit={handleLogUsage}
      />
    </div>
  );
}
