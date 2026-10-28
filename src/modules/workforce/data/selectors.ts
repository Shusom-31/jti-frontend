import type { Assignment, DateRange, EmployeeContext, Filters, Summary, WorkforceSnapshot } from '../../../types';
import { filterKeys } from '../../../types';
import { addDays, bounds, daysBetween } from '../../../lib/utils/format';
import { reportingPeriod, resolveRange } from '../../../lib/utils/reporting-period';

export const hasDates = (a: Assignment) => !(a.status === 'Left' && !a.exited);
export const activeOn = (a: Assignment, date: string) => hasDates(a) && a.joined <= date && (!a.exited || a.exited > date);
export const inRange = (date: string | null, from: string, to: string) => !!date && date >= from && date <= to;
export function matches(a: Assignment, filters: Filters, omit: string[] = []) {
  return filterKeys.every(key => omit.includes(key) || !filters[key] || (a[key] || '__unknown') === filters[key]);
}
export const scopedAssignments = (snapshot: WorkforceSnapshot, filters: Filters) => snapshot.assignments.filter(a => matches(a, filters));
export function summarize(assignments: Assignment[], period: string | DateRange): Summary {
  const { start, end } = resolveRange(period);
  const dated = assignments.filter(hasDates);
  const opening = dated.filter(a => a.joined < start && (!a.exited || a.exited >= start));
  const active = dated.filter(a => activeOn(a, end));
  const joiners = dated.filter(a => inRange(a.joined, start, end));
  const leavers = dated.filter(a => inRange(a.exited, start, end));
  const retained = opening.filter(a => activeOn(a, end));
  const avg = (opening.length + active.length) / 2;
  return { opening, active, joiners, leavers, retained, attrition: avg ? leavers.length / avg * 100 : null,
    retention: opening.length ? retained.length / opening.length * 100 : null,
    net: joiners.length - leavers.length, unique: new Set(active.map(a => a.personId || a.id)).size, excluded: assignments.length - dated.length };
}
export const tenureBands = ['0–90 days', '91–180 days', '181–365 days', '366+ days'];
export function tenureBand(a: Assignment, date: string) {
  const days = daysBetween(a.joined, a.exited && a.exited <= date ? a.exited : date);
  return tenureBands[days <= 90 ? 0 : days <= 180 ? 1 : days <= 365 ? 2 : 3];
}
export function earlyAttrition(assignments: Assignment[], period: string | DateRange, observedThrough = resolveRange(period).end) {
  const { start, end } = resolveRange(period);
  // Eligible cohort: joins whose 90th day occurs within the reporting interval.
  const cutoff = observedThrough < end ? observedThrough : end;
  const eligible = assignments.filter(a => hasDates(a) && inRange(addDays(a.joined, 90), start, cutoff));
  const left = eligible.filter(a => a.exited && daysBetween(a.joined, a.exited) <= 90);
  return { eligible, left, value: eligible.length ? left.length / eligible.length * 100 : null };
}
export function cohortAt(assignments: Assignment[], cohort: string, elapsed: number, observedThrough: string) {
  const cohortSet = assignments.filter(a => hasDates(a) && a.joined.startsWith(cohort));
  const date = bounds(new Date(Date.UTC(Number(cohort.slice(0, 4)), Number(cohort.slice(5, 7)) - 1 + elapsed, 1)).toISOString().slice(0, 7)).end;
  if (date > observedThrough) return { cohort: cohortSet, retained: [] as Assignment[], left: [] as Assignment[], value: null, observed: false };
  const retained = cohortSet.filter(a => activeOn(a, date));
  return { cohort: cohortSet, retained, left: cohortSet.filter(a => !activeOn(a, date)), value: cohortSet.length ? retained.length / cohortSet.length * 100 : null, observed: true };
}
export function metricAssignments(snapshot: WorkforceSnapshot, filters: Filters, context: EmployeeContext): Assignment[] {
  const scoped = scopedAssignments(snapshot, filters);
  const period = reportingPeriod(snapshot, filters);
  const { start, end } = period;
  const s = summarize(scoped, period);
  let rows: Assignment[];
  switch (context.metric) {
    case 'active': case 'opening': case 'joiners': case 'leavers': case 'retained': rows = s[context.metric]; break;
    case 'early': rows = earlyAttrition(scoped, period, snapshot.updatedAt.slice(0, 10)).left; break;
    case 'tenure': rows = s.active.filter(a => tenureBand(a, end) === context.band); break;
    case 'cohort-retained': case 'cohort-left': {
      const cohort = cohortAt(scoped, context.cohort || filters.month, Number(context.elapsed || 0), end < snapshot.updatedAt.slice(0, 10) ? end : snapshot.updatedAt.slice(0, 10));
      rows = context.metric === 'cohort-retained' ? cohort.retained : cohort.left; break;
    }
    case 'internal': rows = s.leavers.filter(a => snapshot.switches.some(sw => sw.previous.id === a.id && sw.result === 'Switched')); break;
    case 'external': {
      const departures = s.leavers.filter(a => !snapshot.switches.some(sw => sw.previous.id === a.id && sw.result === 'Switched') && !snapshot.assignments.some(other => other.id !== a.id && other.personId && other.personId === a.personId && activeOn(other, end)));
      rows = [...new Map(departures.map(a => [a.personId || a.id, a])).values()]; break;
    }
    default: rows = filters.period === 'all' ? scoped : scoped.filter(a => a.joined <= end && (!a.exited || a.exited >= start));
  }
  return context.reason ? rows.filter(a => (a.exitReason || 'Not provided') === context.reason) : rows;
}
export function exactNidAssignments(snapshot: WorkforceSnapshot, nid: string) {
  const person = snapshot.people.find(p => p.nid === nid.trim() && p.matchStatus === 'Matched');
  return person ? snapshot.assignments.filter(a => a.personId === person.id) : [];
}
export function optionsFor(assignments: Assignment[], filters: Filters, key: keyof Assignment) {
  const hierarchy = ['organization', 'region', 'area', 'territory', 'office'];
  const index = hierarchy.indexOf(key);
  const restricted = assignments.filter(a => hierarchy.slice(0, index < 0 ? 1 : index).every(parent => !filters[parent as keyof Filters] || (a[parent as keyof Assignment] || '__unknown') === filters[parent as keyof Filters]));
  return [...new Set(restricted.map(a => String(a[key] || '__unknown')))].sort();
}
