import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import type { Filters, Organization, WorkforceSnapshot } from '../../../types';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { matches, summarize } from '../data/selectors';
import { monthLabel, percent } from '../../../lib/utils/format';
import { EmptyState } from '../../../components/shared/states';
export function AttritionTrend({ data, filters }: { data: WorkforceSnapshot; filters: Filters }) {
  const { href, historyMonths: months } = useTableFilters(); const navigate = useNavigate();
  const orgs = filters.organization ? data.organizations.filter(o => o.id === filters.organization) : data.organizations;
  const series = orgs.map(org => ({ org, points: months.map(month => summarize(data.assignments.filter(a => a.organization === org.id && matches(a, { ...filters, organization: org.id })), month).attrition) }));
  const max = Math.max(10, ...series.flatMap(s => s.points.map(v => v || 0))) * 1.15;
  const width = Math.max(600, (months.length - 1) * 90 + 100);
  const x = (i: number) => 52 + i * 90; const y = (v: number) => 175 - v / max * 142;
  return <section className="panel"><div className="section-title"><div><h2>Attrition over time</h2><p>Monthly attrition (%) · {monthLabel(months[0], true)} – {monthLabel(months[months.length - 1], true)}</p></div><span className="badge">{months.length} MONTHS</span></div><div className="chart-legend">{orgs.map(org => <span key={org.id}><i style={{ background: org.color }} />{org.name}</span>)}</div><div className="chart-scroll"><svg viewBox={`0 0 ${width} 215`} style={{ minWidth: width }} className="line-chart full-history" role="img" aria-label="Monthly attrition by organization. Select a point to view that month’s leavers.">{[0, 1, 2, 3].map(i => <g key={i}><line x1="50" y1={y(max * i / 3)} x2={width - 30} y2={y(max * i / 3)} stroke="#e7ebe7" strokeDasharray="3 4" /><text x="37" y={y(max * i / 3) + 4} textAnchor="end">{(max * i / 3).toFixed(0)}%</text></g>)}{months.map((m, i) => <text key={m} x={x(i)} y="204" textAnchor="middle">{monthLabel(m, true)}</text>)}{series.map(s => <g key={s.org.id}><polyline fill="none" stroke={s.org.color} strokeWidth="2.5" points={s.points.map((v, i) => v === null ? '' : `${x(i)},${y(v)}`).join(' ')} />{s.points.map((v, i) => v === null ? null : <a key={months[i]} href={href('/organizations', { metric: 'leavers', organization: s.org.id, month: months[i], reason: '', band: '' })} onClick={e => { e.preventDefault(); navigate(href('/organizations', { metric: 'leavers', organization: s.org.id, month: months[i], reason: '', band: '' })); }} aria-label={`${s.org.name}, ${monthLabel(months[i])}, ${percent(v)} attrition: view leavers`}><circle cx={x(i)} cy={y(v)} r="5" stroke={s.org.color} strokeWidth="2" fill="white" /><title>{s.org.name} · {monthLabel(months[i])}: {percent(v)} · View leavers</title></a>)}</g>)}</svg></div><p className="chart-hint">Select a point to explore that agency’s leavers. {filters.organization ? 'Current organization' : 'All organizations'} · active filters applied.</p></section>;
}
export function WorkforceComposition({ data, filters }: { data: WorkforceSnapshot; filters: Filters }) {
  const [split, setSplit] = useState<'type' | 'category'>('type'); const { openEmployees, period } = useTableFilters();
  const rows = data.organizations.filter(o => !filters.organization || o.id === filters.organization).map(org => ({ org, assignments: summarize(data.assignments.filter(a => a.organization === org.id && matches(a, { ...filters, organization: org.id })), period).active }));
  const segments = [...new Set(rows.flatMap(r => r.assignments.map(a => a[split])))].sort();
  const colors = ['#475569', '#64748b', '#80673b', '#635d87'];
  const max = Math.max(1, ...rows.map(r => r.assignments.length));
  return <section className="panel"><div className="section-title"><div><h2>Workforce composition</h2><p>Active employees by organization · {period.label}</p></div><select aria-label="Composition split" value={split} onChange={e => setSplit(e.target.value as 'type' | 'category')}><option value="type">By type</option><option value="category">By category</option></select></div><div className="chart-legend">{segments.map((s, i) => <span key={s}><i style={{ background: colors[i % colors.length] }} />{s}</span>)}</div><div className="stacked-chart">{rows.map(({ org, assignments }) => <div className="stacked-row" key={org.id}><div className="stacked-label"><span>{org.name}</span><strong>{assignments.length}</strong></div><div className="bar-track">{segments.map((segment, i) => { const n = assignments.filter(a => a[split] === segment).length; return n ? <button key={segment} style={{ width: `${n / max * 100}%`, background: colors[i % colors.length] }} onClick={() => openEmployees('active', { organization: org.id, [split]: segment })} title={`${org.name} · ${segment}: ${n} active employees`} aria-label={`${org.name} ${segment}: ${n} active employees`}>{n}</button> : null; })}</div></div>)}</div>{!segments.length && <EmptyState title="No active employees in this scope" />}<p className="chart-hint">Select a segment to see matching employees. Counts are assignments at period end.</p></section>;
}
export function ScopeLine({ filters, organizations }: { filters: Filters; organizations: Organization[] }) {
  const { period } = useTableFilters();
  return <span className="scope-line">{filters.organization ? organizations.find(o => o.id === filters.organization)?.name : 'All 3 organizations'} · {period.label} · selected filters applied</span>;
}

