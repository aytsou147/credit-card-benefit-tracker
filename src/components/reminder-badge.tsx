'use client';

import { CardWithBenefits } from '@/lib/types';
import { getCurrentPeriod, getUsageForPeriod, daysUntilPeriodEnd } from '@/lib/periods';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ReminderBadgesProps {
  cards: CardWithBenefits[];
}

interface ExpiringBenefit {
  cardName: string;
  benefitName: string;
  daysLeft: number;
  remaining: number;
  creditType: string;
}

export function ReminderBadges({ cards }: ReminderBadgesProps) {
  const notifiedRef = useRef(false);

  const expiring: ExpiringBenefit[] = [];

  for (const card of cards) {
    for (const benefit of card.benefits) {
      if (!benefit.reminder_enabled || benefit.is_locked || benefit.period_type === 'one_time') continue;

      const daysLeft = daysUntilPeriodEnd(benefit.period_type);
      if (daysLeft > benefit.reminder_days_before) continue;

      const period = getCurrentPeriod(benefit.period_type);
      const used = benefit.is_auto_used
        ? benefit.credit_amount
        : getUsageForPeriod(benefit.usage_logs, period.start);

      if (benefit.credit_type === 'dollar') {
        const remaining = benefit.credit_amount - used;
        if (remaining > 0) {
          expiring.push({
            cardName: card.name,
            benefitName: benefit.name,
            daysLeft,
            remaining,
            creditType: 'dollar',
          });
        }
      } else {
        if (used === 0) {
          expiring.push({
            cardName: card.name,
            benefitName: benefit.name,
            daysLeft,
            remaining: 1,
            creditType: 'perk',
          });
        }
      }
    }
  }

  useEffect(() => {
    if (notifiedRef.current || expiring.length === 0) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (Notification.permission === 'granted') {
      const msg = expiring
        .map((e) =>
          e.creditType === 'dollar'
            ? `${e.cardName} – ${e.benefitName}: $${e.remaining.toFixed(0)} unused (${e.daysLeft}d left)`
            : `${e.cardName} – ${e.benefitName}: unused (${e.daysLeft}d left)`
        )
        .join('\n');
      new Notification('Credit Benefits Expiring Soon', { body: msg });
      notifiedRef.current = true;
    }
  }, [expiring]);

  if (expiring.length === 0) return null;

  return (
    <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <span className="font-medium text-yellow-800 dark:text-yellow-200">
          Benefits expiring soon
        </span>
      </div>
      <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
        {expiring.map((e, i) => (
          <li key={i}>
            <span className="font-medium">{e.cardName}</span> – {e.benefitName}:{' '}
            {e.creditType === 'dollar'
              ? `$${e.remaining.toFixed(0)} unused`
              : 'not yet used'}{' '}
            ({e.daysLeft} day{e.daysLeft !== 1 ? 's' : ''} left)
          </li>
        ))}
      </ul>
    </div>
  );
}
