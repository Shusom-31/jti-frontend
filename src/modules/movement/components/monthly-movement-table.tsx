import { useTableFilters } from '../../../hooks/use-table-filters';
import { monthLabel, percent } from '../../../lib/utils/format';
import { summarize } from '../../workforce/data/selectors';
import type { Assignment } from '../../../types';

export function MonthlyMovementTable({ assignments }: { assignments: Assignment[] }) {
  const { filters, period, historyMonths, openEmployees } = useTableFilters();
  return <section className="panel table-panel monthly-movement">
    <div className="section-title"><div>
      <h2>Monthly workforce movement</h2>
      <p>{period.mode === 'all' ? `All ${historyMonths.length} available months · ` : ''}Monthly headcount, joins, exits and attrition · all current filters apply</p>
    </div><span className="badge">ASSIGNMENTS</span></div>
    <div className="table-scroll"><table>
      <thead><tr>{['Month', 'Active employees', 'Joiners', 'Leavers', 'Attrition'].map(h => <th key={h}>{h}</th>)}</tr></thead>
      <tbody>{[...historyMonths].reverse().map(month => {
        const s = summarize(assignments, month);
        return <tr className={period.mode === 'monthly' && month === filters.month ? 'selected-row' : ''} key={month}>
          <td><strong>{monthLabel(month, true)}</strong></td>
          <td><button className="metric-link" onClick={() => openEmployees('active', { month })}>{s.active.length}</button></td>
          <td><button className="metric-link text-green" onClick={() => openEmployees('joiners', { month })}>{s.joiners.length}</button></td>
          <td><button className="metric-link text-rose" onClick={() => openEmployees('leavers', { month })}>{s.leavers.length}</button></td>
          <td><button className="metric-link" onClick={() => openEmployees('leavers', { month })}>{percent(s.attrition)}</button></td>
        </tr>;
      })}</tbody>
    </table></div>
  </section>;
}
