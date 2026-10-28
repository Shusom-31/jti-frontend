import { ArrowUpRight, BriefcaseBusiness, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Assignment } from '../../../types';
import { useWorkforce } from '../../../hooks/use-workforce';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { Drawer } from '../../../components/shared/dialog';
import { dateLabel, initials, maskNid } from '../../../lib/utils/format';
import { EmploymentTimeline } from './employment-timeline';
export function EmployeeProfile({ assignment: a, close }: { assignment: Assignment; close: () => void }) {
  const { data, setNid } = useWorkforce(); const { href } = useTableFilters(); const navigate = useNavigate(); if (!data) return null;
  const person = data.people.find(p => p.id === a.personId);
  const history = a.personId ? data.assignments.filter(record => record.personId === a.personId) : [a];
  const fields = [
    ['Employee ID', a.employeeId], ['Login ID', a.loginId], ['Organization', data.organizations.find(o => o.id === a.organization)?.name],
    ['Department', a.department], ['Designation', a.designation], ['Joining date', dateLabel(a.joined)], ['Resignation / exit date', dateLabel(a.exited)],
    ['Region', a.region], ['Area', a.area], ['Territory', a.territory], ['Office', a.office], ['Type', a.type], ['Category', a.category],
    ['Manager', a.manager], ['Employment type', a.employmentType], ['Exit reason', a.exitReason], ['NID', maskNid(person?.nid)],
  ];
  return <Drawer title="Employee profile" close={close}><div className="profile-identity"><span className="avatar profile-avatar">{initials(a.name)}</span><h2>{a.name}</h2><p>{a.designation} · {data.organizations.find(o => o.id === a.organization)?.name}</p><span className={`status ${a.status.toLowerCase()}`}>{a.status}</span></div><div className="profile-section"><h3><BriefcaseBusiness size={17} /> Assignment details</h3><p className="muted small">These fields belong to this employment assignment.</p><dl className="profile-fields">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not provided'}</dd></div>)}</dl></div><div className="profile-section"><div className="section-title"><h3>Employment history</h3><span className="badge">{history.length} ASSIGNMENT{history.length !== 1 ? 'S' : ''}</span></div><p className="identity-match">{person?.matchStatus === 'Matched' ? <><ShieldCheck size={16} /> NID matched · masked</> : <><ShieldQuestion size={16} /> Identity unavailable · this record is not a verified switch</>}</p>{data.unavailableOrganizations.length > 0 && <p className="notice warning">History is incomplete while an agency is unavailable.</p>}<EmploymentTimeline assignments={history} data={data} />{person?.nid && <button className="button secondary full-width" onClick={() => { setNid(person.nid!); close(); navigate(href('/switches', { organization: '', metric: '' })); }}>View agency switches <ArrowUpRight size={16} /></button>}</div></Drawer>;
}
