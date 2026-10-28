import { useWorkforce } from '../../../hooks/use-workforce';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { scopedAssignments, summarize, metricAssignments } from '../../workforce/data/selectors';
import { FilterBar, PeriodSelector } from '../../workforce/components/filter-bar';
import { KpiCards } from '../../workforce/components/kpi-card';
import { ScopeLine } from '../../workforce/components/charts';
import { LocationExplorer } from '../../workforce/components/location-explorer';
import { MonthlyMovementTable } from '../components/monthly-movement-table';
import { displayLocation } from '../../../lib/utils/format';
import { EmptyState } from '../../../components/shared/states';
export function MovementScreen() {
  const { data } = useWorkforce(); const { filters, period, openEmployees } = useTableFilters(); if (!data) return null;
  const rows = scopedAssignments(data, filters); const s = summarize(rows, period);
  const offices = [...new Set(s.leavers.map(a => a.office || '__unknown'))].map(office => ({ office, n: s.leavers.filter(a => (a.office || '__unknown') === office).length })).sort((a, b) => b.n - a.n).slice(0, 10);
  return <><div className="page-heading"><div><span className="eyebrow">UNDERSTAND THE MOVEMENT</span><h1>Joiners & leavers<span className="title-dot">.</span></h1><p>See who joined, who left, and how your workforce changed.</p></div><PeriodSelector /></div><ScopeLine filters={filters} organizations={data.organizations} /><FilterBar exclude={['department', 'designation']} resultCount={metricAssignments(data, filters, { metric: 'all' }).length} /><KpiCards summary={s} /><MonthlyMovementTable assignments={rows} /><LocationExplorer /><section className="panel"><div className="section-title"><div><h2>Top 10 offices by leavers</h2><p>Office breakdown · {period.label} · leaver assignments</p></div></div>{offices.length ? <div className="ranked-bars">{offices.map(({ office, n }) => <button key={office} onClick={() => openEmployees('leavers', { office })}><span>{displayLocation(office === '__unknown' ? '' : office)}</span><span className="rank-track"><i style={{ width: `${n / offices[0].n * 100}%` }} /></span><strong>{n}</strong></button>)}</div> : <EmptyState title="No leavers in this period" />}<p className="chart-hint">The supplied fixture has Office data. No separate Sales Point field is available.</p></section></>;
}
