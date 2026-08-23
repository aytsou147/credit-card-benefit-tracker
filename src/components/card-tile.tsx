'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { Trash2, ChevronRight, Zap, Bell, Lock } from 'lucide-react';
import { CardWithBenefits } from '@/lib/types';
import { getCurrentPeriod, getUsageForPeriod } from '@/lib/periods';
import { rewardCategoriesForCard } from '@/lib/card-templates';

interface CardTileProps {
  card: CardWithBenefits;
  onDelete: (cardId: string) => void;
}

export function CardTile({ card, onDelete }: CardTileProps) {
  const tracked = card.benefits.filter((b) => !b.is_dismissed);
  const active = tracked.filter((b) => !b.is_locked);
  const dollarBenefits = active.filter((b) => b.credit_type === 'dollar');
  const perkBenefits = active.filter((b) => b.credit_type === 'perk');
  const lockedCount = tracked.length - active.length;

  let totalAvailable = 0;
  let totalUsed = 0;
  for (const b of dollarBenefits) {
    const period = getCurrentPeriod(b.period_type, b.cycle_start_date);
    const used = b.is_auto_used
      ? b.credit_amount
      : getUsageForPeriod(b.usage_logs, period.start);
    totalAvailable += b.credit_amount;
    totalUsed += Math.min(used, b.credit_amount);
  }

  const pct = totalAvailable > 0 ? (totalUsed / totalAvailable) * 100 : 0;
  const hasReminders = active.some((b) => b.reminder_enabled);
  const hasAutoUsed = active.some((b) => b.is_auto_used);
  const rewardCategories = rewardCategoriesForCard(card);

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <div
        className="absolute left-0 top-0 h-full w-1.5"
        style={{ backgroundColor: card.color }}
      />
      <CardHeader className="pb-2 pl-6">
        <div className="flex items-start justify-between">
          <div>
            <Link
              href={`/card/${card.id}`}
              className="text-lg font-semibold hover:underline"
            >
              {card.name}
            </Link>
            <p className="text-sm text-muted-foreground">
              {card.issuer}
              {card.annual_fee > 0 && ` · $${card.annual_fee}/yr`}
            </p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100"
                />
              }
              title="Delete card"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {card.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the card and all its benefits and usage history.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => onDelete(card.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="pl-6">
        {dollarBenefits.length > 0 && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Current period credits</span>
              <span className="font-medium">
                ${totalUsed.toFixed(0)} / ${totalAvailable.toFixed(0)}
              </span>
            </div>
            <Progress value={pct} className="h-2" />
          </div>
        )}

        {rewardCategories.length > 0 && (
          <div className="mb-3 space-y-0.5">
            {rewardCategories.map((category, i) => (
              <div key={i} className="text-sm">
                {category}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasAutoUsed && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Zap className="h-3 w-3" /> Auto
              </Badge>
            )}
            {hasReminders && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Bell className="h-3 w-3" /> Reminders
              </Badge>
            )}
            {perkBenefits.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {perkBenefits.length} perk{perkBenefits.length > 1 ? 's' : ''}
              </Badge>
            )}
            {lockedCount > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Lock className="h-3 w-3" /> {lockedCount} locked
              </Badge>
            )}
          </div>
          <Link href={`/card/${card.id}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              Details <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
