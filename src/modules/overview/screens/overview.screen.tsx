import { ArrowDownToLine, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkforce } from '../../../hooks/use-workforce';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { summarize, scopedAssignments, metricAssignments } from '../../workforce/data/selectors';
import { KpiCards } from '../../workforce/components/kpi-card';
import { OrganizationCard } from '../components/organization-card';
import { AttritionTrend, WorkforceComposition } from '../../workforce/components/charts';
import { PeriodSelector, FilterBar } from '../../workforce/components/filter-bar';
import { percent } from '../../../lib/utils/format';
import { exportEmployees } from '../../../lib/utils/export';
export function OverviewScreen() {
  const { data } = useWorkforce(); const { filters, period, href, openEmployees } = useTableFilters(); if (!data) return null;
  const scoped = scopedAssignments(data, filters); const summary = summarize(scoped, period);
  const internal = metricAssignments(data, filters, { metric: 'internal' });
  const external = metricAssignments(data, filters, { metric: 'external' });
  return <><div className="page-heading"><div><span className="eyebrow">YOUR WORKFORCE, AT A GLANCE</span><h1>Workforce overview<span className="title-dot">.</span></h1><p>The people behind your organizations. All in one place.</p></div><button className="button secondary" onClick={() => exportEmployees(summary.active, data, filters, 'active')}><ArrowDownToLine size={16} /> Export overview</button></div><div className="reporting-row"><div><span className="live-dot" />Reporting period <strong>{period.label}</strong></div><PeriodSelector /></div><FilterBar compact resultCount={metricAssignments(data, filters, { metric: 'all' }).length} /><KpiCards summary={summary} /><div className="insight-strip"><span className="insight-icon"><Sparkles size={16} /></span><p><strong>{percent(summary.retention)} retention</strong> {period.mode === 'all' ? 'across the full reporting history.' : 'this month.'} <button onClick={() => openEmployees('internal')}>{internal.length} internal agency exits</button> and <button onClick={() => openEmployees('external')}>{external.length} people leaving all agencies</button>.</p><Link to={href('/retention')} aria-label="Explore retention"><ArrowRight size={18} /></Link></div><div className="section-heading"><div><h2>Your organizations <span className="count-badge">3</span></h2><p>Explore the workforce within each agency.</p></div><Link className="text-button" to={href('/organizations')}>View all organizations <ArrowRight size={15} /></Link></div><div className="organization-grid">{data.organizations.map(org => <OrganizationCard key={org.id} organization={org} summary={summarize(scopedAssignments(data, { ...filters, organization: org.id }), period)} unavailable={data.unavailableOrganizations.includes(org.id)} />)}</div><div className="charts-grid"><WorkforceComposition data={data} filters={filters} /><AttritionTrend data={data} filters={filters} /></div></>;
}
