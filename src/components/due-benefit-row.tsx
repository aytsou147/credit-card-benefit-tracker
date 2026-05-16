'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Check, PlusCircle, Zap } from 'lucide-react';
import { BenefitWithUsage } from '@/lib/types';
import {
  getCurrentPeriod,
  getUsageForPeriod,
  periodTypeLabel,
  daysUntilPeriodEnd,
} from '@/lib/periods';

interface DueBenefitRowProps {
  benefit: BenefitWithUsage;
  cardName: string;
  cardColor: string;
  onLogUsage: (benefit: BenefitWithUsage) => void;
}

export function DueBenefitRow({ benefit, cardName, cardColor, onLogUsage }: DueBenefitRowProps) {
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
    <div className={`rounded-lg border p-4 transition-colors ${isFullyUsed ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: cardColor }}
            />
            <span className="text-sm text-muted-foreground truncate">{cardName}</span>
          </div>

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

          {isDollar ? (
            <div className="mt-2">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">{period.label}</span>
                <span className="font-medium">
                  ${used.toFixed(2)} / ${benefit.credit_amount.toFixed(2)}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          ) : (
            <div className="mt-2 text-sm text-muted-foreground">
              {period.label}: {isFullyUsed ? 'Used' : 'Not yet used'}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {!benefit.is_auto_used && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onLogUsage(benefit)}
            >
              <PlusCircle className="h-4 w-4" />
              Log
            </Button>
          )}
          {daysLeft !== null && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {daysLeft}d left
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
