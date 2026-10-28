import type { DateRange, Filters, ReportingPeriod, WorkforceSnapshot } from '../../types';
import { bounds, dhakaMonth, monthLabel, shiftMonth } from './format';

export function availableRange(snapshot?: WorkforceSnapshot): DateRange {
  if (snapshot?.reportingCoverage) return snapshot.reportingCoverage;
  if (!snapshot) return bounds(dhakaMonth());
  const dates = snapshot.assignments.flatMap(a => [a.joined, ...(a.exited ? [a.exited] : [])]).filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)).sort();
  const observed = snapshot.updatedAt.slice(0, 10);
  return { start: dates[0] || observed, end: dates.length && dates[dates.length - 1] > observed ? dates[dates.length - 1] : observed };
}

export function reportingPeriod(snapshot: WorkforceSnapshot | undefined, filters: Filters): ReportingPeriod {
  if (filters.period !== 'all') return { ...bounds(filters.month), mode: 'monthly', label: monthLabel(filters.month) };
  const range = availableRange(snapshot);
  return { ...range, mode: 'all', label: `Full data · ${monthLabel(range.start.slice(0, 7), true)} – ${monthLabel(range.end.slice(0, 7), true)}` };
}

export function monthsInRange(range: DateRange): string[] {
  const first = range.start.slice(0, 7), last = range.end.slice(0, 7);
  const count = (Number(last.slice(0, 4)) - Number(first.slice(0, 4))) * 12 + Number(last.slice(5, 7)) - Number(first.slice(5, 7)) + 1;
  return Array.from({ length: Math.max(0, count) }, (_, i) => shiftMonth(first, i));
}

export function reportingMonths(snapshot: WorkforceSnapshot | undefined, filters: Filters): string[] {
  const available = availableRange(snapshot);
  if (filters.period === 'all') return monthsInRange(available);
  const trailingStart = `${shiftMonth(filters.month, -5)}-01`;
  return monthsInRange({ start: trailingStart > available.start ? trailingStart : available.start, end: bounds(filters.month).end });
}

export const resolveRange = (period: string | DateRange) => typeof period === 'string' ? bounds(period) : period;
