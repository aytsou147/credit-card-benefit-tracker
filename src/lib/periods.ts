import { PeriodType } from './types';

export interface PeriodBoundary {
  start: Date;
  end: Date;
  label: string;
}

/** Anchor for annual benefits that reset on a card anniversary instead of the
 *  calendar year. A date string (YYYY-MM-DD); only its month/day are used. */
export type CycleAnchor = string | null | undefined;

function monthYearLabel(date: Date): string {
  return date.toLocaleString('default', { month: 'short', year: 'numeric' });
}

/** 12-month window that contains `date`, starting on the anchor's month/day. */
function anniversaryBoundary(date: Date, anchor: string): PeriodBoundary {
  const a = new Date(anchor + 'T00:00:00');
  const m = a.getMonth();
  const d = a.getDate();

  let startYear = date.getFullYear();
  if (date < new Date(startYear, m, d)) startYear -= 1;

  const start = new Date(startYear, m, d);
  const end = new Date(startYear + 1, m, d);
  end.setDate(end.getDate() - 1); // day before the next anniversary

  return { start, end, label: `${monthYearLabel(start)} – ${monthYearLabel(end)}` };
}

export function getPeriodBoundaries(periodType: PeriodType, date: Date, anchor?: CycleAnchor): PeriodBoundary {
  const year = date.getFullYear();
  const month = date.getMonth();

  switch (periodType) {
    case 'monthly': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return {
        start,
        end,
        label: start.toLocaleString('default', { month: 'short', year: 'numeric' }),
      };
    }
    case 'quarterly': {
      const q = Math.floor(month / 3);
      const start = new Date(year, q * 3, 1);
      const end = new Date(year, q * 3 + 3, 0);
      const qLabel = `Q${q + 1} ${year}`;
      return { start, end, label: qLabel };
    }
    case 'semi_annual': {
      const half = month < 6 ? 0 : 1;
      const start = new Date(year, half * 6, 1);
      const end = new Date(year, half * 6 + 6, 0);
      return {
        start,
        end,
        label: `${half === 0 ? 'H1' : 'H2'} ${year}`,
      };
    }
    case 'annual': {
      if (anchor) return anniversaryBoundary(date, anchor);
      return {
        start: new Date(year, 0, 1),
        end: new Date(year, 11, 31),
        label: `${year}`,
      };
    }
    case 'one_time': {
      return {
        start: new Date(0),
        end: new Date(9999, 11, 31),
        label: 'One-time',
      };
    }
  }
}

export function getCurrentPeriod(periodType: PeriodType, anchor?: CycleAnchor): PeriodBoundary {
  return getPeriodBoundaries(periodType, new Date(), anchor);
}

export function getAllPeriodsForYear(periodType: PeriodType, year: number, anchor?: CycleAnchor): PeriodBoundary[] {
  switch (periodType) {
    case 'monthly':
      return Array.from({ length: 12 }, (_, i) =>
        getPeriodBoundaries('monthly', new Date(year, i, 1))
      );
    case 'quarterly':
      return Array.from({ length: 4 }, (_, i) =>
        getPeriodBoundaries('quarterly', new Date(year, i * 3, 1))
      );
    case 'semi_annual':
      return [
        getPeriodBoundaries('semi_annual', new Date(year, 0, 1)),
        getPeriodBoundaries('semi_annual', new Date(year, 6, 1)),
      ];
    case 'annual': {
      if (anchor) {
        const a = new Date(anchor + 'T00:00:00');
        // The anniversary cycle that begins in `year`.
        return [getPeriodBoundaries('annual', new Date(year, a.getMonth(), a.getDate()), anchor)];
      }
      return [getPeriodBoundaries('annual', new Date(year, 0, 1))];
    }
    case 'one_time':
      return [getPeriodBoundaries('one_time', new Date(year, 0, 1))];
  }
}

export function periodStartKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysUntilPeriodEnd(periodType: PeriodType, anchor?: CycleAnchor): number {
  const { end } = getCurrentPeriod(periodType, anchor);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function periodTypeLabel(pt: PeriodType): string {
  switch (pt) {
    case 'monthly': return 'Monthly';
    case 'quarterly': return 'Quarterly';
    case 'semi_annual': return 'Semi-Annual';
    case 'annual': return 'Annual';
    case 'one_time': return 'One-Time';
  }
}

export function getUsageForPeriod(
  usageLogs: { amount_used: number; period_start: string }[],
  periodStart: Date,
): number {
  const key = periodStartKey(periodStart);
  return usageLogs
    .filter((l) => l.period_start === key)
    .reduce((sum, l) => sum + Number(l.amount_used), 0);
}
