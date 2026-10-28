import { useMemo, useState, type FormEvent } from 'react';
import { Download, Search, ShieldCheck, X } from 'lucide-react';
import { useWorkforce } from '../../../hooks/use-workforce';
import { metricNames, useTableFilters } from '../../../hooks/use-table-filters';
import { useAppSelector } from '../../../store/hooks';
import { exactNidAssignments, metricAssignments } from '../../workforce/data/selectors';
import { FilterBar, PeriodSelector } from '../../workforce/components/filter-bar';
import { EmployeesTable } from '../components/employees-table';
import { EmployeeProfile } from '../components/employee-profile';
import { Pagination } from '../../../components/shared/pagination';
import { Field } from '../../../components/form/fields';
import { exportEmployees } from '../../../lib/utils/export';
import { dateLabel, monthLabel } from '../../../lib/utils/format';
import type { Assignment } from '../../../types';
export function EmployeesScreen() {
  const { data } = useWorkforce(); const { filters, period, params, update, clear, context } = useTableFilters();
  const user = useAppSelector(s => s.session.user);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [nidInput, setNidInput] = useState(''); const [nid, setNid] = useState(''); const [nidError, setNidError] = useState('');
  const search = params.get('q') || ''; const sort = params.get('sort') || 'name'; const descending = params.get('direction') === 'desc';
  const personView = params.get('view') === 'people';
  const size = [10, 25, 50].includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;
  const rows = useMemo(() => {
    if (!data) return [];
    const ids = nid ? new Set(exactNidAssignments(data, nid).map(a => a.id)) : null;
    const found = metricAssignments(data, filters, context).filter(a => {
      const q = search.toLowerCase().trim();
      return (!q || [a.name, a.employeeId, a.loginId].some(value => value.toLowerCase().includes(q))) && (!ids || ids.has(a.id)) &&
        (!params.get('joinedFrom') || a.joined >= params.get('joinedFrom')!) && (!params.get('joinedTo') || a.joined <= params.get('joinedTo')!) &&
        (!params.get('exitedFrom') || !!a.exited && a.exited >= params.get('exitedFrom')!) && (!params.get('exitedTo') || !!a.exited && a.exited <= params.get('exitedTo')!);
    });
    const key = ['name', 'employeeId', 'joined', 'exited'].includes(sort) ? sort as 'name' | 'employeeId' | 'joined' | 'exited' : 'name';
    return found.sort((a, b) => ((a[key] || '9999').localeCompare(b[key] || '9999') || a.id.localeCompare(b.id)) * (descending ? -1 : 1));
  }, [data, filters, context, search, sort, descending, params, nid]);
  if (!data) return null;
  const grouped = personView ? [...new Map(rows.map(a => [a.personId || a.id, a])).values()] : rows;
  const identified = new Set(rows.filter(a => a.personId).map(a => a.personId)).size;
  const missing = rows.filter(a => !a.personId).length;
  const page = Math.min(Math.max(1, Number(params.get('page')) || 1), Math.max(1, Math.ceil(grouped.length / size)));
  const pageRows = grouped.slice((page - 1) * size, page * size);
  const range = period;
  function lookup(e: FormEvent) { e.preventDefault(); if (!/^\d{10,17}$/.test(nidInput)) { setNidError('Enter an exact NID of 10–17 digits. Leading zeros are preserved.'); return; } setNid(nidInput); setNidError(''); update({ page: '1' }, true); }
  const reset = () => { clear(); setNid(''); setNidInput(''); };
  const invalidDates = (params.get('joinedFrom') || '') > (params.get('joinedTo') || '9999') || (params.get('exitedFrom') || '') > (params.get('exitedTo') || '9999');
  return <><div className="page-heading"><div><span className="eyebrow">THE PEOPLE BEHIND THE NUMBERS</span><h1>Employee directory<span className="title-dot">.</span></h1><p>Explore assignments and connected employment histories.</p></div><button className="button secondary" disabled={!rows.length} onClick={() => exportEmployees(rows, data, filters, context.metric)}><Download size={16} /> Export CSV ({rows.length})</button></div><div className="reporting-row"><div><strong>{metricNames[context.metric]}</strong><span className="badge">{rows.length} MATCHING</span></div><PeriodSelector directory={context.metric === 'all'} /></div><div className="scope-notice"><strong>{filters.organization ? data.organizations.find(o => o.id === filters.organization)?.name : 'All organizations'}</strong> · {dateLabel(range.start)} – {dateLabel(range.end)} · {metricNames[context.metric]}{context.reason && ` · Reason: ${context.reason}`}{context.band && ` · ${context.band}`}{context.cohort && ` · Joining cohort: ${monthLabel(context.cohort)} · elapsed month ${context.elapsed || 0}`}<br /><span>{context.metric === 'all' ? period.mode === 'all' ? 'Full data includes every available assignment, including all former employees across every year and month. Status defaults to All.' : 'Period includes every assignment overlapping this interval, including former employees. Status defaults to All.' : 'This list preserves the exact metric and reporting interval selected at the source.'}</span></div><FilterBar resultCount={rows.length} /><section className="panel table-panel"><div className="directory-tools"><div className="search-input"><Search size={17} /><input aria-label="Search name, employee ID or login ID" placeholder="Search name, employee ID or login ID…" value={search} onChange={e => update({ q: e.target.value }, true)} /></div><div className="segmented" aria-label="Directory view"><button className={!personView ? 'selected' : ''} onClick={() => update({ view: '' })}>Assignment view</button><button className={personView ? 'selected' : ''} onClick={() => update({ view: 'people' })}>Person history view</button></div></div><div className="directory-controls"><Field label="Sort by"><select value={sort} onChange={e => update({ sort: e.target.value })}><option value="name">Employee name</option><option value="employeeId">Employee ID</option><option value="joined">Joining date</option><option value="exited">Resignation date</option></select></Field><Field label="Order"><select value={descending ? 'desc' : 'asc'} onChange={e => update({ direction: e.target.value })}><option value="asc">Ascending</option><option value="desc">Descending</option></select></Field>{[['joinedFrom', 'Joining from'], ['joinedTo', 'Joining to'], ['exitedFrom', 'Exit from'], ['exitedTo', 'Exit to']].map(([key, label]) => <Field key={key} label={label}><input type="date" value={params.get(key) || ''} onChange={e => update({ [key]: e.target.value })} /></Field>)}</div>{invalidDates && <p className="field-error table-message" role="alert">A date range starts after it ends. Correct the joining or exit range.</p>}{user?.canLookupNid && <form className="nid-lookup" onSubmit={lookup}><ShieldCheck size={17} /><label htmlFor="directory-nid">Authorized exact NID lookup</label><input id="directory-nid" type="password" autoComplete="off" inputMode="numeric" value={nidInput} onChange={e => setNidInput(e.target.value)} placeholder="Enter full NID" /><button className="button small-button secondary" type="submit">Look up</button>{nid && <button className="text-button" type="button" onClick={() => { setNid(''); setNidInput(''); }}><X size={14} /> Clear NID lookup</button>}<span className="muted small">Kept only in memory</span>{nidError && <span role="alert" className="field-error">{nidError}</span>}</form>}<div className="table-summary"><span><strong>{rows.length}</strong> matching assignments · <strong>{identified}</strong> identified people{missing > 0 && ` · ${missing} unidentified records`}</span><span>{personView ? 'Representative matching assignment per person; open to see full history.' : 'One row per employment assignment. NIDs are masked.'}</span></div><EmployeesTable rows={pageRows} data={data} open={setSelected} clear={reset} personView={personView} /><Pagination page={page} size={size} total={grouped.length} change={update} /></section>{selected && <EmployeeProfile assignment={selected} close={() => setSelected(null)} />}</>;
}
