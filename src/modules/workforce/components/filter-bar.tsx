import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { useWorkforce } from '../../../hooks/use-workforce';
import { filterKeys, type FilterKey } from '../../../types';
import { optionsFor } from '../data/selectors';
import { dateLabel, displayLocation } from '../../../lib/utils/format';
import { Field } from '../../../components/form/fields';
export const filterLabels: Record<FilterKey, string> = { organization: 'Organization', region: 'Region', area: 'Area', territory: 'Territory', office: 'Office', category: 'Category', type: 'Type', department: 'Department', designation: 'Designation', status: 'Status' };
export function PeriodSelector({ directory = false }: { directory?: boolean }) {
  const { filters, period, available, change } = useTableFilters();
  const all = period.mode === 'all';
  return <div className="period-control">
    <div className="period-options">
      <div className="segmented period-toggle" role="group" aria-label="Reporting view">
        <button className={!all ? 'selected' : ''} aria-pressed={!all} onClick={() => change('period', 'monthly')}>Monthly</button>
        <button className={all ? 'selected' : ''} aria-pressed={all} onClick={() => change('period', 'all')}>Full data</button>
      </div>
      {!all && <label><span className="sr-only">Reporting month</span><input type="month" aria-label="Reporting month" min={available.start.slice(0, 7)} max={available.end.slice(0, 7)} value={filters.month} onChange={e => { if (e.target.value) change('month', e.target.value); }} /></label>}
    </div>
    <span>{all ? `${dateLabel(period.start)} – ${dateLabel(period.end)} · all years and months` : directory ? 'Assignments overlapping this month' : 'Active employees at month end'} · Asia/Dhaka</span>
  </div>;
}
export function FilterBar({ resultCount, compact = false, exclude = [] }: { resultCount?: number; compact?: boolean; exclude?: FilterKey[] }) {
  const { filters, period, change, clear, notice } = useTableFilters();
  const { data } = useWorkforce();
  const [expanded, setExpanded] = useState(false);
  if (!data) return null;
  const visible: FilterKey[] = (compact && !expanded ? ['organization', 'region', 'area', 'type'] as FilterKey[] : [...filterKeys]).filter(k => !exclude.includes(k));
  const selected = filterKeys.filter(k => filters[k] && !exclude.includes(k));
  const label = (key: FilterKey, value: string) => key === 'organization' ? data.organizations.find(o => o.id === value)?.name || value : value === '__unknown' ? 'Unknown / Unassigned' : value;
  return <section className="filter-panel" aria-label="Workforce filters"><div className="filter-top"><span><SlidersHorizontal size={15} /> Filter workforce</span><div className="row">{resultCount !== undefined && <span className="muted">{resultCount} matching assignments</span>}{compact && <button className="text-button" onClick={() => setExpanded(!expanded)}>{expanded ? 'Fewer filters' : 'All filters'}</button>}<button className="text-button" onClick={clear}>Clear all</button></div></div><div className="filter-grid">{visible.map(key => <Field key={key} label={filterLabels[key]}><select value={filters[key]} onChange={e => change(key, e.target.value)}><option value="">All {filterLabels[key].toLowerCase()}s</option>{(key === 'organization' ? data.organizations.map(o => o.id) : key === 'status' ? ['Active', 'Left'] : optionsFor(data.assignments, filters, key)).map(value => <option key={value} value={value}>{key === 'organization' ? `${label(key, value)}` : displayLocation(label(key, value))}</option>)}{filters[key] && !optionsFor(data.assignments, filters, key).includes(filters[key]) && key !== 'organization' && key !== 'status' && <option value={filters[key]}>{label(key, filters[key])} (unavailable)</option>}</select></Field>)}</div>{selected.length > 0 && <div className="filter-chips">{selected.map(key => <button key={key} className="chip" onClick={() => change(key, '')}>{filterLabels[key]}: {label(key, filters[key])}<X size={12} /></button>)}<span className="muted small">{period.label} · filters combine with AND</span></div>}{notice && <p className="notice" role="status">{notice}</p>}</section>;
}
