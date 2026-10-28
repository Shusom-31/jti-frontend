import type { EmployeeContext, Filters, WorkforceSnapshot } from '../../../types';
import { metricAssignments } from '../../workforce/data/selectors';

export function organizationEmployees(data: WorkforceSnapshot, filters: Filters, context: EmployeeContext, params: URLSearchParams) {
  const search = (params.get('q') || '').trim().toLowerCase();
  const rows = metricAssignments(data, { ...filters, department: '', designation: '' }, context).filter(a =>
    !search || [a.name, a.employeeId, a.loginId].some(value => value.toLowerCase().includes(search)),
  );
  const requestedSort = params.get('sort') || 'name';
  const sort = ['name', 'employeeId', 'joined', 'exited'].includes(requestedSort) ? requestedSort as 'name' | 'employeeId' | 'joined' | 'exited' : 'name';
  const direction = params.get('direction') === 'desc' ? -1 : 1;
  return rows.sort((a, b) => ((a[sort] || '9999').localeCompare(b[sort] || '9999') || a.id.localeCompare(b.id)) * direction);
}
