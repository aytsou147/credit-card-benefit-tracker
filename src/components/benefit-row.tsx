'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Zap, Bell, BellOff, Check, PlusCircle } from 'lucide-react';
import { BenefitWithUsage } from '@/lib/types';
import {
  getCurrentPeriod,
  getUsageForPeriod,
  periodTypeLabel,
  daysUntilPeriodEnd,
} from '@/lib/periods';

interface BenefitRowProps {
  benefit: BenefitWithUsage;
  onLogUsage: (benefit: BenefitWithUsage) => void;
  onToggleAutoUsed: (benefitId: string, value: boolean) => void;
  onToggleReminder: (benefitId: string, enabled: boolean) => void;
  onDelete: (benefitId: string) => void;
}

export function BenefitRow({
  benefit,
  onLogUsage,
  onToggleAutoUsed,
  onToggleReminder,
  onDelete,
}: BenefitRowProps) {
  const period = getCurrentPeriod(benefit.period_type);
  const used = benefit.is_auto_used
    ? benefit.credit_amount
    : getUsageForPeriod(benefit.usage_logs, period.start);

  const isDollar = benefit.credit_type === 'dollar';
  const pct = isDollar && benefit.credit_amount > 0
    ? Math.min(100, (used / benefit.credit_amount) * 100)
    : 0;
  const isFullyUsed = isDollar
    ? used >= benefit.credit_amount
    : used > 0;
  const daysLeft = benefit.period_type !== 'one_time' ? daysUntilPeriodEnd(benefit.period_type) : null;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium">{benefit.name}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {periodTypeLabel(benefit.period_type)}
            </Badge>
            {benefit.is_auto_used && (
              <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                <Zap className="h-3 w-3" /> Auto
              </Badge>
            )}
            {isFullyUsed && (
              <Badge className="text-xs gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 shrink-0">
                <Check className="h-3 w-3" /> Used
              </Badge>
            )}
          </div>
          {benefit.description && (
            <p className="text-sm text-muted-foreground mt-0.5">{benefit.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!benefit.is_auto_used && !isFullyUsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onLogUsage(benefit)}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {benefit.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the benefit and all its usage history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(benefit.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isDollar && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">{period.label}</span>
            <span className="font-medium">
              ${used.toFixed(2)} / ${benefit.credit_amount.toFixed(2)}
            </span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      )}

      {!isDollar && (
        <div className="mb-3 text-sm text-muted-foreground">
          {period.label}: {isFullyUsed ? 'Used' : 'Not yet used'}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch
            checked={benefit.is_auto_used}
            onCheckedChange={(v) => onToggleAutoUsed(benefit.id, v)}
          />
          <span className="text-muted-foreground">Auto-used</span>
        </label>
        <button
          type="button"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onToggleReminder(benefit.id, !benefit.reminder_enabled)}
        >
          {benefit.reminder_enabled ? (
            <Bell className="h-4 w-4 text-yellow-500" />
          ) : (
            <BellOff className="h-4 w-4" />
          )}
          <span>{benefit.reminder_enabled ? 'Reminder on' : 'Reminder off'}</span>
        </button>
        {daysLeft !== null && (
          <span className="ml-auto text-xs text-muted-foreground">
            {daysLeft}d left in period
          </span>
        )}
      </div>
    </div>
  );
}
