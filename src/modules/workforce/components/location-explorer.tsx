import { ChevronRight, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { useWorkforce } from '../../../hooks/use-workforce';
import { displayLocation, percent } from '../../../lib/utils/format';
import { scopedAssignments, summarize } from '../data/selectors';
import { EmptyState } from '../../../components/shared/states';
import type { FilterKey } from '../../../types';
const levels: FilterKey[] = ['region', 'area', 'territory', 'office'];
export function LocationExplorer() {
  const { data } = useWorkforce(); const { filters, period, href, openEmployees, clear } = useTableFilters(); const location = useLocation(); if (!data) return null;
  const depth = levels.findIndex(key => !filters[key]); const key = levels[depth === -1 ? 3 : depth];
  const scoped = scopedAssignments(data, filters);
  const values = [...new Set(scoped.map(a => a[key] || '__unknown'))].sort();
  const name = filters.organization ? data.organizations.find(o => o.id === filters.organization)?.name : 'All organizations';
  function overrides(index: number, value?: string) {
    return Object.fromEntries(levels.map((level, i) => [level, i < index ? filters[level] : i === index && value ? value : '']));
  }
  return <section className="panel table-panel"><div className="section-title"><div><h2><MapPin size={18} /> Location explorer</h2><p>{period.label} · assignment counts · select a location to drill down</p></div><span className="badge">{key.toUpperCase()} LEVEL</span></div><nav className="location-breadcrumb" aria-label="Location breadcrumb"><Link to={href(location.pathname, overrides(0))}>{name}</Link>{levels.map((level, i) => filters[level] ? <span key={level}><ChevronRight size={12} /><Link to={href(location.pathname, { ...overrides(i + 1), [level]: filters[level] })}>{displayLocation(filters[level] === '__unknown' ? '' : filters[level])}</Link></span> : null)}</nav>{values.length ? <div className="table-scroll"><table><thead><tr>{[key[0].toUpperCase() + key.slice(1), 'Active employees', 'Joiners', 'Leavers', 'Attrition'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{values.map(value => { const rows = scoped.filter(a => (a[key] || '__unknown') === value); const s = summarize(rows, period); const scope = { [key]: value }; return <tr key={value}><td>{depth === -1 || key === 'office' ? <button className="employee-link" onClick={() => openEmployees('active', scope)}>{displayLocation(value === '__unknown' ? '' : value)} <ChevronRight size={14} /></button> : <Link className="employee-link" to={href(location.pathname, overrides(levels.indexOf(key), value))}>{displayLocation(value === '__unknown' ? '' : value)} <ChevronRight size={14} /></Link>}</td><td><button className="metric-link" onClick={() => openEmployees('active', scope)}>{s.active.length}</button></td><td><button className="metric-link text-green" onClick={() => openEmployees('joiners', scope)}>{s.joiners.length}</button></td><td><button className="metric-link text-rose" onClick={() => openEmployees('leavers', scope)}>{s.leavers.length}</button></td><td><button className="metric-link" onClick={() => openEmployees('leavers', scope)}>{percent(s.attrition)}</button></td></tr>; })}</tbody></table></div> : <EmptyState title="No locations match your filters" clear={clear} />}</section>;
}
