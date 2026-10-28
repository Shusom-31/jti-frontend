import { useNavigate } from 'react-router-dom';
import type { Assignment } from '../../../types';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { cohortAt } from '../../workforce/data/selectors';
import { monthLabel, percent } from '../../../lib/utils/format';

export function CohortRetention({ assignments, observedThrough }: { assignments: Assignment[]; observedThrough: string }) {
  const { period, historyMonths: months, openEmployees, href } = useTableFilters();
  const navigate = useNavigate();
  const cutoff = period.end < observedThrough ? period.end : observedThrough;
  const elapsedMonths = Array.from({ length: period.mode === 'all' ? Math.max(1, months.length) : 6 }, (_, i) => i);
  const cohorts = months.map(cohort => ({ cohort, points: elapsedMonths.map(elapsed => cohortAt(assignments, cohort, elapsed, cutoff)) }));
  const colors = ['#285e50', '#5d9279', '#94bba5', '#9a9ac1', '#b68b61', '#8a99a7'];
  const width = Math.max(700, (elapsedMonths.length - 1) * 115 + 120);
  const color = (index: number) => colors[index % colors.length];
  return <section className="panel table-panel">
    <div className="section-title"><div><h2>Joining cohort retention</h2>
      <p>Original cohort retained (%) · month 0 = end of joining month · {period.mode === 'all' ? 'all available joining cohorts and elapsed months' : 'current agency and filters'}</p>
    </div></div>
    <div className="chart-legend cohort-legend">{cohorts.map((c, i) => <span key={c.cohort}><i style={{ background: color(i) }} />{monthLabel(c.cohort, true)}</span>)}</div>
    <div className="chart-scroll"><svg className="cohort-chart full-history" style={{ minWidth: width }} viewBox={`0 0 ${width} 180`} role="img" aria-label="Joining cohort retention curves, percentage retained by elapsed month">
      {[0, 50, 100].map(v => <g key={v}><line x1="50" x2={width - 50} y1={140 - v * 1.1} y2={140 - v * 1.1} stroke="#e6ebe6" strokeDasharray="3 4" /><text x="37" y={144 - v * 1.1} textAnchor="end">{v}%</text></g>)}
      {elapsedMonths.map(i => <text key={i} x={60 + i * 115} y="167" textAnchor="middle">Month {i}</text>)}
      {cohorts.map((c, ci) => <g key={c.cohort}>
        <polyline fill="none" stroke={color(ci)} strokeWidth="2" points={c.points.map((p, i) => p.value === null ? '' : `${60 + i * 115},${140 - p.value * 1.1}`).join(' ')} />
        {c.points.map((p, i) => p.value === null ? null : <a key={i}
          href={href('/organizations', { metric: 'cohort-retained', cohort: c.cohort, elapsed: String(i) })}
          onClick={e => { e.preventDefault(); navigate(href('/organizations', { metric: 'cohort-retained', cohort: c.cohort, elapsed: String(i) })); }}
          aria-label={`${monthLabel(c.cohort)} at month ${i}: ${percent(p.value)} retained`}
        ><circle cx={60 + i * 115} cy={140 - p.value * 1.1} r="4" fill="white" stroke={color(ci)} strokeWidth="2" /><title>{monthLabel(c.cohort)} · Month {i}: {percent(p.value)}</title></a>)}
      </g>)}
    </svg></div>
    <div className="table-scroll"><table className="cohort-table">
      <thead><tr><th>Joining cohort</th><th>Original size</th>{elapsedMonths.map(i => <th key={i}>Month {i}</th>)}</tr></thead>
      <tbody>{cohorts.map(c => <tr key={c.cohort}><td>{monthLabel(c.cohort, true)}</td><td>{c.points[0].cohort.length}</td>
        {c.points.map((p, elapsed) => <td key={elapsed}>{!p.observed ? <span className="unobserved" title="This elapsed month has not fully completed">Not yet observed</span> : p.value === null ? <span className="muted">N/A</span> : <div className="cohort-cell">
          <button className="metric-link" onClick={() => openEmployees('cohort-retained', { cohort: c.cohort, elapsed: String(elapsed) })}>{percent(p.value)}</button>
          <button className="text-button small" onClick={() => openEmployees('cohort-left', { cohort: c.cohort, elapsed: String(elapsed) })}>{p.left.length} leavers</button>
        </div>}</td>)}
      </tr>)}</tbody>
    </table></div>
    <p className="chart-hint padded">Counts use the original joining cohort as denominator. Future or incomplete elapsed months are not yet observed. Select a percentage for retained people or the companion leaver count.</p>
  </section>;
}
