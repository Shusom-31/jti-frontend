import type { Assignment, WorkforceSnapshot } from '../../../types';
import { dateLabel, displayLocation, gapLabel, daysBetween } from '../../../lib/utils/format';
export function EmploymentTimeline({ assignments, data }: { assignments: Assignment[]; data: WorkforceSnapshot }) {
  const history = [...assignments].sort((a, b) => a.joined.localeCompare(b.joined));
  return <div className="timeline">{history.map((a, i) => {
    const previous = history[i - 1];
    const bothActive = previous?.status === 'Active' && a.status === 'Active' && !previous.exited && !a.exited;
    return <div className="timeline-item" key={a.id}>{previous && <div className={`transition ${bothActive ? 'text-rose' : ''}`}>{bothActive ? 'Overlapping active assignments · no confirmed exit' : previous.exited ? gapLabel(daysBetween(previous.exited, a.joined)) : 'N/A · Incomplete history'}</div>}<div className="timeline-node"><span className="timeline-dot" /><div><div className="row between"><h4>{data.organizations.find(o => o.id === a.organization)?.name}</h4><span className={`status ${a.status.toLowerCase()}`}>{a.status}</span></div><p>{a.designation} · {a.department}</p><p className="mono">Employee {a.employeeId} · Login {a.loginId}</p><p>{dateLabel(a.joined)} → {a.exited ? dateLabel(a.exited) : a.status === 'Active' ? 'Present · exit not provided' : 'Exit date not provided'}</p><dl className="timeline-details"><div><dt>Region</dt><dd>{displayLocation(a.region)}</dd></div><div><dt>Area</dt><dd>{displayLocation(a.area)}</dd></div><div><dt>Territory</dt><dd>{displayLocation(a.territory)}</dd></div><div><dt>Office</dt><dd>{displayLocation(a.office)}</dd></div><div><dt>Type / Category</dt><dd>{a.type} / {a.category}</dd></div></dl></div></div></div>;
  })}</div>;
}
