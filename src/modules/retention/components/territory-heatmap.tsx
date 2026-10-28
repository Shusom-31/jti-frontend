import type { Assignment } from '../../../types';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { summarize } from '../../workforce/data/selectors';
import { displayLocation, monthLabel, percent } from '../../../lib/utils/format';
import { EmptyState } from '../../../components/shared/states';

export function TerritoryHeatmap({ assignments }: { assignments: Assignment[] }) {
  const { period, historyMonths: months, openEmployees } = useTableFilters();
  const territories = [...new Set(assignments.map(a => a.territory || '__unknown'))].sort();
  return <section className="panel table-panel">
    <div className="section-title"><div>
      <h2>Territory attrition heatmap</h2>
      <p>Monthly attrition (%) · territory × month · {period.mode === 'all' ? `all ${months.length} available months` : 'current reporting scope'}</p>
    </div><div className="heat-legend"><span>Lower</span><i /><span>Higher</span></div></div>
    {territories.length ? <div className="table-scroll"><table className="heatmap">
      <thead><tr><th>Territory</th>{months.map(m => <th key={m}>{monthLabel(m, true)}</th>)}</tr></thead>
      <tbody>{territories.map(territory => <tr key={territory}>
        <td>{displayLocation(territory === '__unknown' ? '' : territory)}</td>
        {months.map(month => {
          const s = summarize(assignments.filter(a => (a.territory || '__unknown') === territory), month);
          return <td key={month}><button
            disabled={s.attrition === null}
            style={{ background: s.attrition === null ? '#f4f5f2' : `rgba(47,116,97,${0.06 + Math.min(s.attrition, 50) / 50 * 0.65})`, color: (s.attrition || 0) > 25 ? '#fff' : '#224a3e' }}
            onClick={() => openEmployees('leavers', { territory, month })}
            aria-label={`${displayLocation(territory === '__unknown' ? '' : territory)}, ${monthLabel(month)}: ${percent(s.attrition)}, view leavers`}
          >{percent(s.attrition)}</button></td>;
        })}
      </tr>)}</tbody>
    </table></div> : <EmptyState title="No territories in the selected scope" />}
    <p className="chart-hint padded">Select a cell to see that territory’s leavers in that month. N/A means no workforce denominator.</p>
  </section>;
}
