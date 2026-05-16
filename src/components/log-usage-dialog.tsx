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
import { BenefitWithUsage } from '@/lib/types';
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
}

export function LogUsageDialog({ benefit, open, onOpenChange, onSubmit, initialPeriodStart }: LogUsageDialogProps) {
  const [amount, setAmount] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (benefit && open) {
      const key = initialPeriodStart ?? periodStartKey(getCurrentPeriod(benefit.period_type).start);
      setPeriodStart(key);

      if (benefit.credit_type === 'perk') {
        setAmount('1');
      } else {
        const periodDate = new Date(key + 'T00:00:00');
        const used = getUsageForPeriod(benefit.usage_logs, periodDate);
        const remaining = benefit.credit_amount - used;
        setAmount(remaining > 0 ? remaining.toFixed(2) : benefit.credit_amount.toFixed(2));
      }
      setNotes('');
    }
  }, [benefit, open, initialPeriodStart]);

  if (!benefit) return null;

  const year = new Date().getFullYear();
  const periods = [
    ...getAllPeriodsForYear(benefit.period_type, year - 1),
    ...getAllPeriodsForYear(benefit.period_type, year),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = benefit!.credit_type === 'perk' ? 1 : parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    onSubmit(benefit!.id, numAmount, periodStart, notes);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Usage: {benefit.name}</DialogTitle>
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={periodStart} onValueChange={(v) => v && setPeriodStart(v)}>
              <SelectTrigger>
                <SelectValue />
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
            Log Usage
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
