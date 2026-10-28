import test from 'node:test';
import assert from 'node:assert/strict';
import { fixtureSnapshot } from './workforce.data';
import { activeOn, cohortAt, earlyAttrition, exactNidAssignments, matches, metricAssignments, scopedAssignments, summarize } from './selectors';
import { addDays, bounds, daysBetween, dhakaMonth, monthsThrough } from '../../../lib/utils/format';
import { csvCell, employeeCsv } from '../../../lib/utils/export';
import { availableRange, monthsInRange, reportingMonths, reportingPeriod } from '../../../lib/utils/reporting-period';
import { organizationEmployees } from '../../organizations/data/organization-employees';
import { filterKeys, type Assignment, type Filters } from '../../../types';
const snapshot = fixtureSnapshot();
const f = (values: Partial<Filters> = {}) => ({ ...Object.fromEntries(filterKeys.map(k => [k, ''])), month: '2026-10', ...values }) as Filters;
const sample: Assignment = { ...snapshot.assignments[1], id: 'test', joined: '2026-09-01', exited: '2026-10-10', status: 'Left' };

test('workforce accounting reconciles for every month, organization and intersecting scope', () => {
  for (const month of monthsThrough('2026-10', 13)) {
    for (const organization of ['', 'sky', 'delta', 'nova']) {
      for (const scope of [{}, { region: 'Mymensingh', area: 'Sylhet', type: 'Campaign' }, { category: 'Urban' }, { region: '__unknown' }]) {
        const filters = f({ month, organization, ...scope });
        const s = summarize(scopedAssignments(snapshot, filters), month);
        assert.equal(s.active.length, s.opening.length + s.joiners.length - s.leavers.length, `${month}/${organization}`);
        for (const metric of ['active', 'opening', 'joiners', 'leavers', 'retained'] as const) assert.deepEqual(metricAssignments(snapshot, filters, { metric }).map(a => a.id), s[metric].map(a => a.id));
      }
    }
  }
});
test('combined attrition uses aggregate counts rather than averaging agency percentages', () => {
  const combined = summarize(snapshot.assignments, '2026-10');
  const agencies = snapshot.organizations.map(o => summarize(snapshot.assignments.filter(a => a.organization === o.id), '2026-10'));
  assert.equal(combined.attrition, combined.leavers.length / ((combined.opening.length + combined.active.length) / 2) * 100);
  assert.equal(combined.active.length, agencies.reduce((sum, a) => sum + a.active.length, 0));
  assert.notEqual(combined.attrition, agencies.reduce((sum, a) => sum + (a.attrition || 0), 0) / 3);
});
test('exit date is effective removal day, with joining and exiting on the same day reconciled', () => {
  assert.equal(activeOn(sample, '2026-10-09'), true);
  assert.equal(activeOn(sample, '2026-10-10'), false);
  const a = { ...sample, joined: '2026-10-10' };
  const s = summarize([a], '2026-10');
  assert.equal(s.joiners.length, 1); assert.equal(s.leavers.length, 1); assert.equal(s.active.length, 0);
  assert.equal(summarize([], '2026-10').attrition, null);
  assert.equal(summarize([], '2026-10').retention, null);
});
test('all workforce filters combine with AND and keep unassigned locations visible', () => {
  const filters = f({ organization: 'sky', region: 'Mymensingh', area: 'Sylhet', type: 'Campaign', category: 'Metro' });
  const rows = scopedAssignments(snapshot, filters);
  assert.ok(rows.length > 0);
  assert.ok(rows.every(a => a.organization === 'sky' && a.region === 'Mymensingh' && a.area === 'Sylhet' && a.type === 'Campaign' && a.category === 'Metro'));
  assert.ok(scopedAssignments(snapshot, f({ region: '__unknown' })).length > 0);
  assert.equal(matches(sample, f({ region: 'Mymensign' })), false);
});
test('directory period contains active and former records while leaver drilldowns retain exit dates', () => {
  const rows = metricAssignments(snapshot, f(), { metric: 'all' });
  assert.ok(rows.some(a => a.status === 'Active')); assert.ok(rows.some(a => a.status === 'Left'));
  const leavers = metricAssignments(snapshot, f(), { metric: 'leavers' });
  assert.ok(leavers.length > 0); assert.ok(leavers.every(a => a.exited?.startsWith('2026-10')));
  assert.deepEqual(metricAssignments(snapshot, f(), { metric: 'leavers', reason: 'Not provided' }), leavers.filter(a => !a.exitReason));
});
test('NID lookup preserves leading zeros and never matches names or employee IDs', () => {
  const sw = snapshot.switches[0]; const nid = snapshot.people.find(p => p.id === sw.personId)!.nid!;
  assert.ok(nid.startsWith('00'));
  const rows = exactNidAssignments(snapshot, nid);
  assert.ok(rows.length >= 2); assert.ok(rows.every(a => a.personId === sw.personId));
  assert.equal(exactNidAssignments(snapshot, String(Number(nid))).length, 0);
  assert.equal(exactNidAssignments(snapshot, rows[0].name).length, 0);
  assert.equal(exactNidAssignments(snapshot, rows[0].employeeId).length, 0);
});
test('switches distinguish same day, gaps, overlaps, active concurrency and incomplete history', () => {
  assert.ok(snapshot.switches.some(sw => sw.gap === 0 && sw.result === 'Switched'));
  assert.ok(snapshot.switches.some(sw => sw.gap !== null && sw.gap > 0));
  assert.ok(snapshot.switches.some(sw => sw.gap !== null && sw.gap < 0));
  assert.ok(snapshot.switches.some(sw => sw.gap === null && sw.result === 'Overlapping active assignments' && !sw.previous.exited));
  assert.ok(snapshot.switches.some(sw => sw.gap === null && sw.result === 'Incomplete history' && sw.previous.status === 'Left'));
  assert.equal(daysBetween('2026-10-01', '2026-10-01'), 0);
  assert.equal(daysBetween('2026-10-03', '2026-10-01'), -2);
});
test('internal switches are not reported as company wide person departures', () => {
  const internal = metricAssignments(snapshot, f(), { metric: 'internal' });
  const external = metricAssignments(snapshot, f(), { metric: 'external' });
  assert.ok(internal.length > 0);
  assert.ok(!external.some(a => internal.some(b => a.id === b.id)));
  assert.equal(new Set(external.map(a => a.personId || a.id)).size, external.length);
});
test('incomplete exit histories are visible in directory but excluded from date metrics', () => {
  const incomplete = snapshot.assignments.find(a => a.status === 'Left' && !a.exited)!;
  assert.ok(incomplete);
  assert.equal(activeOn(incomplete, '2026-10-31'), false);
  assert.ok(metricAssignments(snapshot, f(), { metric: 'all' }).some(a => a.id === incomplete.id));
  assert.equal(summarize(snapshot.assignments, '2026-10').excluded, 1);
});
test('early attrition includes only fully observed 90 day windows ending in the period', () => {
  const eligible = { ...sample, joined: '2026-07-10', exited: '2026-08-01' };
  const notObserved = { ...sample, id: 'future-window', joined: '2026-09-01', exited: '2026-09-20' };
  const data = earlyAttrition([eligible, notObserved], '2026-10', '2026-10-28');
  assert.equal(data.eligible.length, 1); assert.equal(data.left.length, 1); assert.equal(data.value, 100);
  assert.ok(addDays(eligible.joined, 90) <= '2026-10-28');
  assert.equal(earlyAttrition([notObserved], '2026-10').value, null);
});
test('cohort retention uses original cohort and does not fabricate future observations', () => {
  const retained = { ...sample, id: 'retained', joined: '2026-08-01', exited: null, status: 'Active' as const };
  const left = { ...sample, joined: '2026-08-02', exited: '2026-09-02' };
  const data = cohortAt([retained, left], '2026-08', 1, '2026-10-28');
  assert.equal(data.value, 50); assert.equal(data.retained.length, 1); assert.equal(data.left.length, 1);
  const future = cohortAt([retained, left], '2026-08', 2, '2026-10-28');
  assert.equal(future.observed, false); assert.equal(future.value, null);
});
test('partial agency failures remove that agency and never create new inferred transitions', () => {
  const partial = fixtureSnapshot('delta');
  assert.deepEqual(partial.unavailableOrganizations, ['delta']);
  assert.ok(partial.assignments.every(a => a.organization !== 'delta'));
  assert.ok(partial.switches.every(sw => sw.previous.organization !== 'delta' && sw.next.organization !== 'delta'));
  assert.ok(partial.switches.every(sw => snapshot.switches.some(full => full.id === sw.id)));
});
test('CSV exports the complete supplied result set, preserves IDs and masks every NID', () => {
  const rows = metricAssignments(snapshot, f(), { metric: 'all' });
  assert.ok(rows.length > 25);
  const csv = employeeCsv(rows, snapshot);
  assert.equal(csv.split('\r\n').length, rows.length + 1);
  assert.ok(csv.includes(`"${rows[0].employeeId}"`));
  assert.ok(!snapshot.people.some(p => p.nid && csv.includes(p.nid)));
  assert.ok(csv.includes('••••••'));
  assert.equal(csvCell('=1+1'), '"\'=1+1"');
  assert.equal(csvCell('Name, "quoted"'), '"Name, ""quoted"""');
});
test('reporting dates use Dhaka month boundaries and calendar days across leap dates', () => {
  assert.equal(dhakaMonth(new Date('2026-09-30T19:00:00Z')), '2026-10');
  assert.equal(bounds('2024-02').end, '2024-02-29');
  assert.equal(daysBetween('2024-02-28', '2024-03-01'), 2);
});

test('Full data directory includes every historical assignment while Monthly keeps interval overlap', () => {
  const all = metricAssignments(snapshot, f({ period: 'all' }), { metric: 'all' });
  const monthly = metricAssignments(snapshot, f({ period: 'monthly' }), { metric: 'all' });
  assert.equal(all.length, snapshot.assignments.length);
  assert.ok(all.length > monthly.length);
  assert.ok(all.some(a => a.exited && a.exited < '2026-10-01'));
  assert.ok(monthly.every(a => a.joined <= '2026-10-31' && (!a.exited || a.exited >= '2026-10-01')));
});

test('Full data summaries and each KPI drilldown use the same complete interval and AND scope', () => {
  for (const scope of [{}, { organization: 'sky' }, { region: 'Mymensingh', area: 'Sylhet', type: 'Campaign' }]) {
    const filters = f({ ...scope, period: 'all' });
    const period = reportingPeriod(snapshot, filters);
    const s = summarize(scopedAssignments(snapshot, filters), period);
    assert.equal(s.active.length, s.opening.length + s.joiners.length - s.leavers.length);
    for (const metric of ['active', 'opening', 'joiners', 'leavers', 'retained'] as const) {
      assert.deepEqual(metricAssignments(snapshot, filters, { metric }), s[metric]);
    }
  }
  const all = reportingPeriod(snapshot, f({ period: 'all' }));
  assert.deepEqual({ start: all.start, end: all.end }, { start: '2025-10-01', end: '2026-10-28' });
  assert.equal(summarize(snapshot.assignments, all).opening.length, 0);
  assert.equal(summarize(snapshot.assignments, all).retention, null);
});

test('Full data includes all 13 observed months and preserves years; Monthly keeps its trailing six', () => {
  const all = reportingMonths(snapshot, f({ period: 'all' }));
  assert.equal(all.length, 13);
  assert.equal(all[0], '2025-10'); assert.equal(all[all.length - 1], '2026-10');
  assert.equal(reportingMonths(snapshot, f({ period: 'monthly' })).length, 6);
  assert.deepEqual(reportingMonths(snapshot, f({ month: '2025-10' })), ['2025-10']);
  assert.deepEqual(monthsInRange({ start: '2024-12-31', end: '2025-02-01' }), ['2024-12', '2025-01', '2025-02']);
});

test('available years and months expand with the dataset instead of a hardcoded fixture year', () => {
  const expanded = { ...snapshot, reportingCoverage: undefined, updatedAt: '2028-03-15T10:00:00Z', assignments: [{ ...sample, joined: '2018-02-01', exited: null, status: 'Active' as const }, ...snapshot.assignments] };
  assert.deepEqual(availableRange(expanded), { start: '2018-02-01', end: '2028-03-15' });
  const history = reportingMonths(expanded, f({ period: 'all' }));
  assert.equal(history.length, 122); assert.equal(history[0], '2018-02'); assert.equal(history[121], '2028-03');
  const partial = fixtureSnapshot('sky');
  assert.deepEqual(availableRange(partial), availableRange(snapshot));
});

test('Full data early attrition keeps the complete observed 90 day denominator', () => {
  const filters = f({ period: 'all' });
  const period = reportingPeriod(snapshot, filters);
  const early = earlyAttrition(snapshot.assignments, period, snapshot.updatedAt.slice(0, 10));
  assert.ok(early.eligible.length > earlyAttrition(snapshot.assignments, '2026-10').eligible.length);
  assert.ok(early.eligible.every(a => addDays(a.joined, 90) <= '2026-10-28'));
  assert.deepEqual(metricAssignments(snapshot, filters, { metric: 'early' }), early.left);
});

test('Full data CSV includes historical leavers and every filtered assignment with masked identity', () => {
  const filters = f({ period: 'all', organization: 'sky' });
  const rows = metricAssignments(snapshot, filters, { metric: 'all' });
  const csv = employeeCsv(rows, snapshot);
  assert.equal(csv.split('\r\n').length, rows.length + 1);
  assert.ok(rows.some(a => a.exited && a.exited < '2026-10-01'));
  assert.ok(!snapshot.people.some(p => p.nid && csv.includes(p.nid)));
});

test('organization employee results ignore removed department/designation filters and keep the selected agency', () => {
  const filters = f({ organization: 'sky', period: 'all', department: 'Removed department', designation: 'Removed designation' });
  const rows = organizationEmployees(snapshot, filters, { metric: 'all' }, new URLSearchParams());
  assert.ok(rows.length > 0);
  assert.ok(rows.every(a => a.organization === 'sky'));
  assert.equal(rows.length, metricAssignments(snapshot, f({ organization: 'sky', period: 'all' }), { metric: 'all' }).length);
  assert.equal(metricAssignments(snapshot, filters, { metric: 'all' }).length, 0, 'The standalone directory retains its own department/designation filters');
});

test('inline organization leavers keep the exact month, workforce filters and confirmed resignation dates', () => {
  const example = metricAssignments(snapshot, f({ organization: 'sky' }), { metric: 'leavers' })[0];
  const filters = f({ organization: 'sky', region: example.region || '__unknown', area: example.area || '__unknown', type: example.type });
  const rows = organizationEmployees(snapshot, filters, { metric: 'leavers' }, new URLSearchParams());
  const summary = summarize(scopedAssignments(snapshot, filters), filters.month);
  assert.ok(rows.length > 0);
  assert.deepEqual(new Set(rows.map(a => a.id)), new Set(summary.leavers.map(a => a.id)));
  assert.ok(rows.every(a => a.exited?.startsWith('2026-10') && a.status === 'Left'));
  const searched = organizationEmployees(snapshot, filters, { metric: 'leavers' }, new URLSearchParams({ q: rows[0].employeeId }));
  assert.equal(searched.length, 1); assert.equal(searched[0].employeeId, rows[0].employeeId);
});

test('inline organization search and date sorting operate before pagination across the entire result set', () => {
  const filters = f({ organization: 'sky', period: 'all' });
  const original = snapshot.assignments.map(a => a.id);
  const sorted = organizationEmployees(snapshot, filters, { metric: 'all' }, new URLSearchParams({ sort: 'joined', direction: 'desc' }));
  assert.ok(sorted.length > 10);
  assert.ok(sorted.every((a, i) => i === 0 || a.joined <= sorted[i - 1].joined));
  const last = sorted[sorted.length - 1];
  const found = organizationEmployees(snapshot, filters, { metric: 'all' }, new URLSearchParams({ q: last.loginId.toUpperCase() }));
  assert.equal(found.length, 1); assert.equal(found[0].id, last.id);
  assert.deepEqual(snapshot.assignments.map(a => a.id), original);
});
