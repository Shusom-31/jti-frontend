import type { Assignment, Filters, WorkforceSnapshot } from '../../types';
import { maskNid } from './format';
import { reportingPeriod } from './reporting-period';
export function csvCell(value: unknown) {
  const text = String(value ?? 'Not provided');
  // Prefix formula characters before CSV quoting to prevent spreadsheet formula execution.
  const safe = /^[=+@\-\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function employeeCsv(rows: Assignment[], snapshot: WorkforceSnapshot) {
  const headings = ['Employee name', 'Employee ID (text)', 'Login ID', 'Organization', 'Department', 'Designation', 'Joining date', 'Exit date', 'Status', 'Region', 'Area', 'Territory', 'Office', 'Type', 'Category', 'NID (masked)'];
  const records = rows.map(a => [a.name, a.employeeId, a.loginId, snapshot.organizations.find(o => o.id === a.organization)?.name, a.department, a.designation, a.joined, a.exited, a.status, a.region || 'Not provided', a.area || 'Not provided', a.territory || 'Not provided', a.office || 'Not provided', a.type, a.category, maskNid(snapshot.people.find(p => p.id === a.personId)?.nid)]);
  return '\uFEFF' + [headings, ...records].map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function exportEmployees(rows: Assignment[], snapshot: WorkforceSnapshot, filters: Filters, metric = 'all') {
  const csv = employeeCsv(rows, snapshot);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const anchor = document.createElement('a'); anchor.href = url;
  const org = snapshot.organizations.find(o => o.id === filters.organization)?.name || 'all-organizations';
  const period = reportingPeriod(snapshot, filters);
  const interval = period.mode === 'all' ? `full-data-${period.start}-${period.end}` : filters.month;
  anchor.download = `jti-workforce-${org.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}-${interval}-${metric}.csv`;
  document.body.appendChild(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

