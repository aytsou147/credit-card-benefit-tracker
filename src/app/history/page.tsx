'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CardWithBenefits, BenefitWithUsage } from '@/lib/types';
import { HistoryTable } from '@/components/history-table';
import { LogUsageDialog } from '@/components/log-usage-dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { getAllPeriodsForYear, getUsageForPeriod } from '@/lib/periods';
import { toast } from 'sonner';

export default function HistoryPage() {
  const [cards, setCards] = useState<CardWithBenefits[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [editMode, setEditMode] = useState(false);
  const [logBenefit, setLogBenefit] = useState<BenefitWithUsage | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logPeriodStart, setLogPeriodStart] = useState<string | undefined>();
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
      toast.error('Failed to load data');
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

  function handleCellClick(benefit: BenefitWithUsage, periodStart: string) {
    setLogBenefit(benefit);
    setLogPeriodStart(periodStart);
    setLogOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();

  let grandTotalAvailable = 0;
  let grandTotalUsed = 0;
  for (const card of cards) {
    for (const benefit of card.benefits) {
      if (benefit.credit_type !== 'dollar') continue;
      const periods = getAllPeriodsForYear(benefit.period_type, year);
      for (const p of periods) {
        grandTotalAvailable += benefit.credit_amount;
        const now = new Date();
        const used = benefit.is_auto_used && p.start <= now
          ? benefit.credit_amount
          : getUsageForPeriod(benefit.usage_logs, p.start);
        grandTotalUsed += Math.min(used, benefit.credit_amount);
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Usage History</h1>
        <p className="text-sm text-muted-foreground">
          Cumulative benefit usage across all your cards
        </p>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setYear((y) => y - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold w-16 text-center">{year}</span>
          <Button
            variant="outline"
            size="icon"
            disabled={year >= currentYear}
            onClick={() => setYear((y) => y + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant={editMode ? 'secondary' : 'outline'}
            size="sm"
            className="ml-2 gap-1.5"
            onClick={() => setEditMode((v) => !v)}
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">{editMode ? 'Editing' : 'Edit'}</span>
          </Button>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">${grandTotalUsed.toFixed(0)}</div>
          <div className="text-sm text-muted-foreground">
            of ${grandTotalAvailable.toFixed(0)} used in {year}
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          No cards to show. Add a card from the dashboard.
        </div>
      ) : (
        <HistoryTable cards={cards} year={year} editMode={editMode} onCellClick={handleCellClick} />
      )}

      <LogUsageDialog
        benefit={logBenefit}
        open={logOpen}
        onOpenChange={setLogOpen}
        onSubmit={handleLogUsage}
        initialPeriodStart={logPeriodStart}
      />
    </div>
  );
}
