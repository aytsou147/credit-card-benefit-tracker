'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { BenefitWithUsage, UsageLog } from '@/lib/types';
import {
  getAllPeriodsForYear,
  getCurrentPeriod,
  getUsageForPeriod,
  periodStartKey,
} from '@/lib/periods';

interface LogUsageDialogProps {
  benefit: BenefitWithUsage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (benefitId: string, amount: number, periodStart: string, notes: string) => void;
  initialPeriodStart?: string;
  // When set, the dialog edits an existing usage log instead of inserting a new one.
  editingLog?: UsageLog | null;
  onUpdate?: (logId: string, amount: number, periodStart: string, notes: string) => void;
}

export function LogUsageDialog({
  benefit,
  open,
  onOpenChange,
  onSubmit,
  initialPeriodStart,
  editingLog,
  onUpdate,
}: LogUsageDialogProps) {
  const [amount, setAmount] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [notes, setNotes] = useState('');

  const anchor = benefit?.cycle_start_date;
  const isEdit = !!editingLog;

  // Remaining credit for a given period, excluding the log currently being edited
  // so it isn't double-counted against itself.
  function remainingForPeriod(key: string): number {
    if (!benefit) return 0;
    const used = getUsageForPeriod(benefit.usage_logs, new Date(key + 'T00:00:00'));
    const own = editingLog && editingLog.period_start === key ? Number(editingLog.amount_used) : 0;
    return benefit.credit_amount - (used - own);
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  // Seed the form when the dialog opens (open is parent-controlled, so this must
  // run in an effect rather than an open-change handler).
  useEffect(() => {
    if (benefit && open) {
      const key = editingLog?.period_start
        ?? initialPeriodStart
        ?? periodStartKey(getCurrentPeriod(benefit.period_type, anchor).start);
      setPeriodStart(key);

      if (benefit.credit_type === 'perk') {
        setAmount('1');
      } else if (editingLog) {
        setAmount(Number(editingLog.amount_used).toFixed(2));
      } else {
        const remaining = remainingForPeriod(key);
        setAmount(remaining > 0 ? remaining.toFixed(2) : benefit.credit_amount.toFixed(2));
      }
      setNotes(editingLog?.notes ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [benefit, open, initialPeriodStart, editingLog]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!benefit) return null;

  const year = new Date().getFullYear();
  const periods = [
    ...getAllPeriodsForYear(benefit.period_type, year - 1, anchor),
    ...getAllPeriodsForYear(benefit.period_type, year, anchor),
  ];
  const labelByKey: Record<string, string> = {};
  for (const p of periods) labelByKey[periodStartKey(p.start)] = p.label;

  const remaining = remainingForPeriod(periodStart);

  function handlePeriodChange(key: string) {
    setPeriodStart(key);
    if (benefit!.credit_type === 'dollar' && !isEdit) {
      const r = remainingForPeriod(key);
      setAmount(r > 0 ? r.toFixed(2) : benefit!.credit_amount.toFixed(2));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = benefit!.credit_type === 'perk' ? 1 : parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    if (benefit!.credit_type === 'dollar' && numAmount > remaining + 0.001) {
      toast.error(`Only $${Math.max(0, remaining).toFixed(2)} remaining for ${labelByKey[periodStart] ?? 'this period'}`);
      return;
    }
    if (isEdit && onUpdate) {
      onUpdate(editingLog!.id, numAmount, periodStart, notes);
    } else {
      onSubmit(benefit!.id, numAmount, periodStart, notes);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Edit Usage' : 'Log Usage'}: {benefit.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {benefit.credit_type === 'dollar' && (
            <div className="space-y-2">
              <Label htmlFor="usage-amount">Amount Used ($)</Label>
              <Input
                id="usage-amount"
                type="number"
                step="0.01"
                min="0.01"
                max={Math.max(0, remaining).toFixed(2)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                ${Math.max(0, remaining).toFixed(2)} remaining this period
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={periodStart} onValueChange={(v) => v && handlePeriodChange(v)}>
              <SelectTrigger>
                <SelectValue>{(v: string) => labelByKey[v] ?? v}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => {
                  const key = periodStartKey(p.start);
                  return (
                    <SelectItem key={key} value={key}>
                      {p.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="usage-notes">Notes (optional)</Label>
            <Textarea
              id="usage-notes"
              placeholder="What did you use this credit for?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full">
            {isEdit ? 'Save Changes' : 'Log Usage'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
