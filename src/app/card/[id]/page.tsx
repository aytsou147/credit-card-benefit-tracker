'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CardWithBenefits, BenefitWithUsage, UsageLog } from '@/lib/types';
import { retiredBenefitIds } from '@/lib/template-sync';
import { BenefitRow } from '@/components/benefit-row';
import { LogUsageDialog } from '@/components/log-usage-dialog';
import { AddBenefitDialog, BenefitFields } from '@/components/add-benefit-dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function CardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const [card, setCard] = useState<CardWithBenefits | null>(null);
  const [loading, setLoading] = useState(true);
  const [logBenefit, setLogBenefit] = useState<BenefitWithUsage | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<UsageLog | null>(null);
  const [editBenefit, setEditBenefit] = useState<BenefitWithUsage | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const fetchCard = useCallback(async () => {
    const { data, error } = await supabase
      .from('cards')
      .select(`
        *,
        benefits (
          *,
          usage_logs (*)
        )
      `)
      .eq('id', cardId)
      .single();

    if (error) {
      toast.error('Card not found');
      router.push('/');
      return;
    }

    setCard(data as CardWithBenefits);
    setLoading(false);
  }, [supabase, cardId, router]);

  useEffect(() => {
    fetchCard();
  }, [fetchCard]);

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
      fetchCard();
    }
  }

  async function handleUpdateUsage(logId: string, amount: number, periodStart: string, notes: string) {
    const { error } = await supabase
      .from('usage_logs')
      .update({ amount_used: amount, period_start: periodStart, notes: notes || null })
      .eq('id', logId);
    if (error) {
      toast.error('Failed to update usage');
    } else {
      toast.success('Usage updated');
      fetchCard();
    }
  }

  async function handleDeleteUsage(logId: string) {
    const { error } = await supabase.from('usage_logs').delete().eq('id', logId);
    if (error) {
      toast.error('Failed to delete usage');
    } else {
      toast.success('Usage entry deleted');
      fetchCard();
    }
  }

  async function handleUpdateBenefit(benefitId: string, b: BenefitFields) {
    const { error } = await supabase
      .from('benefits')
      .update({
        name: b.name,
        description: b.description || null,
        credit_type: b.credit_type,
        credit_amount: b.credit_amount,
        period_type: b.period_type,
        is_auto_used: b.is_auto_used,
        is_locked: b.is_locked,
        cycle_start_date: b.cycle_start_date,
      })
      .eq('id', benefitId);
    if (error) {
      toast.error('Failed to update benefit');
    } else {
      toast.success('Benefit updated');
      fetchCard();
    }
  }

  async function handleSetCycleDate(benefitId: string, date: string | null) {
    const { error } = await supabase
      .from('benefits')
      .update({ cycle_start_date: date })
      .eq('id', benefitId);
    if (error) {
      toast.error('Failed to update anniversary date');
    } else {
      fetchCard();
    }
  }

  async function handleToggleAutoUsed(benefitId: string, value: boolean) {
    const { error } = await supabase
      .from('benefits')
      .update({ is_auto_used: value })
      .eq('id', benefitId);
    if (error) {
      toast.error('Failed to update');
    } else {
      fetchCard();
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
      fetchCard();
    }
  }

  async function handleToggleReminder(benefitId: string, enabled: boolean) {
    const { error } = await supabase
      .from('benefits')
      .update({ reminder_enabled: enabled })
      .eq('id', benefitId);
    if (error) {
      toast.error('Failed to update');
    } else {
      fetchCard();
    }
  }

  async function handleDeleteBenefit(benefitId: string) {
    const { error } = await supabase.from('benefits').delete().eq('id', benefitId);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Benefit deleted');
      fetchCard();
    }
  }

  async function handleAddBenefit(b: BenefitFields) {
    const { error } = await supabase.from('benefits').insert({
      card_id: cardId,
      name: b.name,
      description: b.description || null,
      credit_type: b.credit_type,
      credit_amount: b.credit_amount,
      period_type: b.period_type,
      is_auto_used: b.is_auto_used,
      is_locked: b.is_locked,
      cycle_start_date: b.cycle_start_date,
      source: 'custom',
    });
    if (error) {
      toast.error('Failed to add benefit');
    } else {
      toast.success(`Added ${b.name}`);
      fetchCard();
    }
  }

  if (loading || !card) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const retired = retiredBenefitIds(card);
  const dollarBenefits = card.benefits.filter((b) => b.credit_type === 'dollar');
  const totalAnnualValue = dollarBenefits.reduce((sum, b) => {
    switch (b.period_type) {
      case 'monthly': return sum + b.credit_amount * 12;
      case 'quarterly': return sum + b.credit_amount * 4;
      case 'semi_annual': return sum + b.credit_amount * 2;
      case 'annual': return sum + b.credit_amount;
      case 'one_time': return sum + b.credit_amount;
    }
  }, 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: card.color }}
          >
            <CreditCard className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{card.name}</h1>
            <p className="text-sm text-muted-foreground">
              {card.issuer}
              {card.annual_fee > 0 && ` · $${card.annual_fee}/yr annual fee`}
              {' · '}
              ~${totalAnnualValue.toFixed(0)}/yr in benefits
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          Benefits ({card.benefits.length})
        </h2>
        <AddBenefitDialog onAdd={handleAddBenefit} />
      </div>

      {card.benefits.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No benefits yet. Add one to start tracking.
        </div>
      ) : (
        <div className="space-y-3">
          {card.benefits.map((benefit) => (
            <BenefitRow
              key={benefit.id}
              benefit={benefit}
              isRetired={retired.has(benefit.id)}
              onLogUsage={(b) => {
                setLogBenefit(b);
                setEditingLog(null);
                setLogOpen(true);
              }}
              onToggleAutoUsed={handleToggleAutoUsed}
              onToggleLocked={handleToggleLocked}
              onToggleReminder={handleToggleReminder}
              onDelete={handleDeleteBenefit}
              onEdit={(b) => {
                setEditBenefit(b);
                setEditOpen(true);
              }}
              onSetCycleDate={handleSetCycleDate}
              onEditUsage={(b, log) => {
                setLogBenefit(b);
                setEditingLog(log);
                setLogOpen(true);
              }}
              onDeleteUsage={handleDeleteUsage}
            />
          ))}
        </div>
      )}

      <LogUsageDialog
        benefit={logBenefit}
        open={logOpen}
        onOpenChange={setLogOpen}
        onSubmit={handleLogUsage}
        editingLog={editingLog}
        onUpdate={handleUpdateUsage}
      />

      <AddBenefitDialog
        onAdd={handleAddBenefit}
        benefit={editBenefit}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSave={handleUpdateBenefit}
      />
    </div>
  );
}
