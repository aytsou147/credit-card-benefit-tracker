'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CardWithBenefits } from '@/lib/types';
import { getAllPeriodsForYear, getUsageForPeriod, periodTypeLabel } from '@/lib/periods';

interface HistoryTableProps {
  cards: CardWithBenefits[];
  year: number;
}

export function HistoryTable({ cards, year }: HistoryTableProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  function toggleCard(cardId: string) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {cards.map((card) => {
        const isExpanded = expandedCards.has(card.id);

        let cardTotalAvailable = 0;
        let cardTotalUsed = 0;

        for (const benefit of card.benefits) {
          if (benefit.credit_type !== 'dollar') continue;
          const periods = getAllPeriodsForYear(benefit.period_type, year);
          for (const p of periods) {
            cardTotalAvailable += benefit.credit_amount;
            const used = benefit.is_auto_used
              ? benefit.credit_amount
              : getUsageForPeriod(benefit.usage_logs, p.start);
            cardTotalUsed += Math.min(used, benefit.credit_amount);
          }
        }

        const cardPct = cardTotalAvailable > 0
          ? (cardTotalUsed / cardTotalAvailable) * 100
          : 0;

        return (
          <Card key={card.id}>
            <CardHeader
              className="cursor-pointer pb-3"
              onClick={() => toggleCard(card.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-4 w-4 rounded-full shrink-0"
                  style={{ backgroundColor: card.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{card.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        ${cardTotalUsed.toFixed(0)} / ${cardTotalAvailable.toFixed(0)}
                      </span>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <Progress value={cardPct} className="h-1.5 mt-2" />
                </div>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {card.benefits.map((benefit) => {
                    const periods = getAllPeriodsForYear(benefit.period_type, year);
                    const isDollar = benefit.credit_type === 'dollar';

                    let benefitTotal = 0;
                    let benefitUsed = 0;

                    if (isDollar) {
                      for (const p of periods) {
                        benefitTotal += benefit.credit_amount;
                        const used = benefit.is_auto_used
                          ? benefit.credit_amount
                          : getUsageForPeriod(benefit.usage_logs, p.start);
                        benefitUsed += Math.min(used, benefit.credit_amount);
                      }
                    }

                    const benefitPct = benefitTotal > 0
                      ? (benefitUsed / benefitTotal) * 100
                      : 0;

                    return (
                      <div key={benefit.id} className="rounded border p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{benefit.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {periodTypeLabel(benefit.period_type)}
                            </Badge>
                          </div>
                          {isDollar && (
                            <span className="text-sm font-medium">
                              ${benefitUsed.toFixed(0)} / ${benefitTotal.toFixed(0)}
                            </span>
                          )}
                        </div>
                        {isDollar && <Progress value={benefitPct} className="h-1.5 mb-2" />}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 text-xs">
                          {periods.map((p) => {
                            const used = benefit.is_auto_used
                              ? (isDollar ? benefit.credit_amount : 1)
                              : getUsageForPeriod(benefit.usage_logs, p.start);
                            const isUsed = isDollar
                              ? used >= benefit.credit_amount
                              : used > 0;
                            const partial = isDollar && used > 0 && used < benefit.credit_amount;

                            return (
                              <div
                                key={p.label}
                                className={`rounded px-2 py-1 text-center ${
                                  isUsed
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : partial
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <div className="font-medium">{p.label}</div>
                                {isDollar && (
                                  <div>${Math.min(used, benefit.credit_amount).toFixed(0)}</div>
                                )}
                                {!isDollar && (
                                  <div>{isUsed ? 'Used' : '—'}</div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
