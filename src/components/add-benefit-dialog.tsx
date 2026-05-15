'use client';

import { useState } from 'react';
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
import { CreditType, PeriodType } from '@/lib/types';

interface AddBenefitDialogProps {
  onAdd: (benefit: {
    name: string;
    description: string;
    credit_type: CreditType;
    credit_amount: number;
    period_type: PeriodType;
    is_auto_used: boolean;
  }) => void;
}

export function AddBenefitDialog({ onAdd }: AddBenefitDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creditType, setCreditType] = useState<CreditType>('dollar');
  const [amount, setAmount] = useState('');
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [isAutoUsed, setIsAutoUsed] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onAdd({
      name,
      description,
      credit_type: creditType,
      credit_amount: creditType === 'dollar' ? parseFloat(amount) || 0 : 0,
      period_type: periodType,
      is_auto_used: isAutoUsed,
    });
    setName('');
    setDescription('');
    setCreditType('dollar');
    setAmount('');
    setPeriodType('monthly');
    setIsAutoUsed(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
        <Plus className="h-4 w-4" /> Add Benefit
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Benefit</DialogTitle>
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
          <label className="flex items-center gap-2 cursor-pointer">
            <Switch checked={isAutoUsed} onCheckedChange={setIsAutoUsed} />
            <span className="text-sm">Automatically used each period (e.g. subscription)</span>
          </label>
          <Button type="submit" className="w-full">Add Benefit</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
