import type { Assignment, WorkforceSnapshot } from '../../../types';
import { dateLabel, initials, maskNid } from '../../../lib/utils/format';
import { EmptyState } from '../../../components/shared/states';

type EmployeeTableProps = {
  rows: Assignment[];
  data: WorkforceSnapshot;
  open: (a: Assignment) => void;
  clear: () => void;
  personView?: boolean;
  variant?: 'directory' | 'organization' | 'organization-all';
};

export function EmployeesTable({ rows, data, open, clear, personView = false, variant = 'directory' }: EmployeeTableProps) {
  if (!rows.length) return <EmptyState clear={clear} />;
  const organizationView = variant === 'organization';
  const organizationAllView = variant === 'organization-all';
  const columns = [
    'Employee', 'Employee ID', 'Login ID',
    ...(!organizationView ? ['Organization', ...(organizationAllView ? [] : ['Department', 'Designation'])] : []),
    'Joining date', 'Resignation / exit date', 'Status', 'Region', 'Area', 'Territory', 'Office', 'Type', 'Category', 'NID',
  ];
  return <div className="table-scroll employee-table"><table>
    <thead><tr>{columns.map(col => <th key={col}>{col}</th>)}</tr></thead>
    <tbody>{rows.map(a => {
      const linked = personView ? data.assignments.filter(other => other.personId && other.personId === a.personId).length : 0;
      return <tr key={a.id}>
        <td className="identity-cell"><button className="employee-link" onClick={() => open(a)}>
          <span className="avatar table-avatar">{initials(a.name)}</span>
          <span><strong>{a.name}</strong><small>{personView ? `${linked || 1} linked assignment${linked !== 1 ? 's' : ''}` : organizationView ? a.employmentType : a.designation}</small></span>
        </button></td>
        <td className="mono">{a.employeeId}</td><td className="mono">{a.loginId}</td>
        {!organizationView && <><td>{data.organizations.find(o => o.id === a.organization)?.name}</td>{!organizationAllView && <><td>{a.department}</td><td>{a.designation}</td></>}</>}
        <td>{dateLabel(a.joined)}</td><td>{dateLabel(a.exited)}</td>
        <td><span className={`status ${a.status.toLowerCase()}`}>{a.status}</span></td>
        <td>{a.region || 'Not provided'}</td><td>{a.area || 'Not provided'}</td><td>{a.territory || 'Not provided'}</td><td>{a.office || 'Not provided'}</td>
        <td>{a.type}</td><td>{a.category}</td><td className="mono muted">{maskNid(data.people.find(p => p.id === a.personId)?.nid)}</td>
      </tr>;
    })}</tbody>
  </table></div>;
}
