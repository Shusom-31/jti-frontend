import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import type { Assignment, Metric } from '../../../types';
import { useWorkforce } from '../../../hooks/use-workforce';
import { metricNames, useTableFilters } from '../../../hooks/use-table-filters';
import { EmployeesTable, EmployeeProfile } from '../../employees';
import { Pagination } from '../../../components/shared/pagination';
import { Field } from '../../../components/form/fields';
import { exportEmployees } from '../../../lib/utils/export';
import { organizationEmployees } from '../data/organization-employees';

const views: { metric: Metric; label: string }[] = [
  { metric: 'all', label: 'All employees' },
  { metric: 'active', label: 'Active employees' },
  { metric: 'joiners', label: 'Joiners' },
  { metric: 'leavers', label: 'Leavers' },
];

export function OrganizationEmployees({ combined = false }: { combined?: boolean }) {
  const { data } = useWorkforce();
  const { filters, period, context, params, update, openEmployees, clear } = useTableFilters();
  const [selected, setSelected] = useState<Assignment | null>(null);
  if (!data) return null;
  const rows = organizationEmployees(data, filters, context, params);
  const size = [10, 25, 50].includes(Number(params.get('size'))) ? Number(params.get('size')) : 10;
  const page = Math.min(Math.max(1, Math.floor(Number(params.get('page')) || 1)), Math.max(1, Math.ceil(rows.length / size)));
  const organization = data.organizations.find(o => o.id === filters.organization);
  return <>
    <section className="panel table-panel organization-employees" id="organization-employees" aria-labelledby="organization-employees-title">
      <div className="section-title"><div>
        <h2 id="organization-employees-title">Employee information <span className="count-badge">{rows.length}</span></h2>
        <p>{organization?.name || (combined ? 'All organizations' : '')} · {period.label} · {metricNames[context.metric]}</p>
      </div><button className="button secondary small-button" disabled={!rows.length} onClick={() => exportEmployees(rows, data, filters, context.metric)}><Download size={15} /> Export CSV ({rows.length})</button></div>
      <div className="organization-employee-views" role="group" aria-label="Employee list scope">
        {views.map(view => <button key={view.metric} className={context.metric === view.metric ? 'selected' : ''} aria-pressed={context.metric === view.metric} onClick={() => openEmployees(view.metric)}>{view.label}</button>)}
      </div>
      <div className="directory-tools organization-employee-tools">
        <div className="search-input"><Search size={17} /><input aria-label="Search organization employees" placeholder="Search name, employee ID or login ID…" value={params.get('q') || ''} onChange={e => update({ q: e.target.value }, true)} /></div>
        <Field label="Sort employees"><select value={params.get('sort') || 'name'} onChange={e => update({ sort: e.target.value })}>
          <option value="name">Employee name</option><option value="employeeId">Employee ID</option><option value="joined">Joining date</option><option value="exited">Resignation date</option>
        </select></Field>
        <Field label="Order"><select value={params.get('direction') || 'asc'} onChange={e => update({ direction: e.target.value })}><option value="asc">Ascending</option><option value="desc">Descending</option></select></Field>
      </div>
      <div className="table-summary"><span><strong>{rows.length}</strong> matching employees · {metricNames[context.metric]}</span><span>Joining date, resignation date and status · {organization?.name || 'all organizations'}</span></div>
      <EmployeesTable rows={rows.slice((page - 1) * size, page * size)} data={data} open={setSelected} clear={clear} variant={combined ? 'organization-all' : 'organization'} />
      <Pagination page={page} size={size} total={rows.length} change={update} />
    </section>
    {selected && <EmployeeProfile assignment={selected} close={() => setSelected(null)} />}
  </>;
}
