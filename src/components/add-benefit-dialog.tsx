'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { BenefitWithUsage, CreditType, PeriodType } from '@/lib/types';

export interface BenefitFields {
  name: string;
  description: string;
  credit_type: CreditType;
  credit_amount: number;
  period_type: PeriodType;
  is_auto_used: boolean;
  cycle_start_date: string | null;
}

interface AddBenefitDialogProps {
  onAdd: (benefit: BenefitFields) => void;
  // Edit mode: pass the benefit plus controlled open state and onSave.
  benefit?: BenefitWithUsage | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: (benefitId: string, benefit: BenefitFields) => void;
}

export function AddBenefitDialog({ onAdd, benefit, open: openProp, onOpenChange, onSave }: AddBenefitDialogProps) {
  const isEdit = !!benefit;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isEdit ? openProp ?? false : internalOpen;
  const setOpen = isEdit ? onOpenChange ?? (() => {}) : setInternalOpen;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creditType, setCreditType] = useState<CreditType>('dollar');
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [isAutoUsed, setIsAutoUsed] = useState(false);
  const [cycleStartDate, setCycleStartDate] = useState('');

  /* eslint-disable react-hooks/set-state-in-effect */
  // Seed the form from the benefit when the (parent-controlled) edit dialog opens.
  useEffect(() => {
    if (isEdit && open && benefit) {
      setName(benefit.name);
      setDescription(benefit.description ?? '');
      setCreditType(benefit.credit_type);
      setAmount(benefit.credit_amount ? String(benefit.credit_amount) : '');
      setPeriodType(benefit.period_type);
      setIsAutoUsed(benefit.is_auto_used);
      setCycleStartDate(benefit.cycle_start_date ?? '');
    }
  }, [isEdit, open, benefit]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fields: BenefitFields = {
      name,
      description,
      credit_type: creditType,
      credit_amount: creditType === 'dollar' ? parseFloat(amount) || 0 : 0,
      period_type: periodType,
      is_auto_used: isAutoUsed,
      cycle_start_date: periodType === 'annual' ? cycleStartDate || null : null,
    };

    if (isEdit && benefit && onSave) {
      onSave(benefit.id, fields);
    } else {
      onAdd(fields);
      setName('');
      setDescription('');
      setCreditType('dollar');
      setAmount('');
      setPeriodType('monthly');
      setIsAutoUsed(false);
      setCycleStartDate('');
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
          <Plus className="h-4 w-4" /> Add Benefit
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Benefit' : 'Add Benefit'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="benefit-name">Name</Label>
            <Input
              id="benefit-name"
              placeholder="e.g. Uber Credit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="benefit-desc">Description (optional)</Label>
            <Textarea
              id="benefit-desc"
              placeholder="Any notes about this benefit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={creditType} onValueChange={(v) => v && setCreditType(v as CreditType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dollar">Dollar Credit</SelectItem>
                  <SelectItem value="perk">Perk</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Select value={periodType} onValueChange={(v) => v && setPeriodType(v as PeriodType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                  <SelectItem value="one_time">One-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {creditType === 'dollar' && (
            <div className="space-y-2">
              <Label htmlFor="benefit-amount">Credit Amount ($)</Label>
              <Input
                id="benefit-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          )}
          {periodType === 'annual' && (
            <div className="space-y-2">
              <Label htmlFor="benefit-cycle">Anniversary date (optional)</Label>
              <Input
                id="benefit-cycle"
                type="date"
                value={cycleStartDate}
                onChange={(e) => setCycleStartDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to reset on the calendar year (Jan 1). Set a date to reset on that anniversary instead.
              </p>
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={isAutoUsed} onCheckedChange={setIsAutoUsed} />
            <span className="text-sm">Automatically used each period (e.g. subscription)</span>
          </label>
          <Button type="submit" className="w-full">{isEdit ? 'Save Changes' : 'Add Benefit'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
