import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWorkforce } from '../../../hooks/use-workforce';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { OrganizationCard } from '../../overview/components/organization-card';
import { FilterBar, PeriodSelector } from '../../workforce/components/filter-bar';
import { KpiCards } from '../../workforce/components/kpi-card';
import { LocationExplorer } from '../../workforce/components/location-explorer';
import { scopedAssignments, summarize } from '../../workforce/data/selectors';
import { OrganizationEmployees } from '../components/organization-employees';
import { organizationEmployees } from '../data/organization-employees';

export function OrganizationsScreen() {
  const { data } = useWorkforce();
  const { filters, period, context, params, update, href } = useTableFilters();

  useEffect(() => {
    if (filters.organization && (params.has('department') || params.has('designation'))) {
      update({ department: '', designation: '' }, true);
    }
  }, [filters.organization, params, update]);

  if (!data) return null;
  const org = data.organizations.find(o => o.id === filters.organization);
  const rows = scopedAssignments(data, filters);
  const showCombinedEmployees = params.has('metric');
  if (filters.organization && !org) return <div className="empty-state"><h1>Organization not found</h1><Link className="button" to={href('/organizations', { organization: '' })}>Choose an organization</Link></div>;

  return <>
    <Link className="back-link" to={href(org ? '/organizations' : '/', { organization: '', metric: '' })}><ArrowLeft size={15} /> {org ? 'Organizations' : 'Dashboard'}</Link>
    <div className="page-heading"><div>
      <span className="eyebrow">{org ? 'ORGANIZATION WORKSPACE' : 'THREE TEAMS. ONE PERSPECTIVE.'}</span>
      <h1>{org ? <><span className="org-avatar heading-avatar" style={{ color: org.color }}>{org.initials}</span>{org.name}</> : <>Organizations<span className="title-dot">.</span></>}</h1>
      <p>{org ? 'Filter your employees and explore joining dates, resignation dates and status.' : 'Select an organization to explore its people and movement.'}</p>
    </div><PeriodSelector /></div>
    {!org ? <><div className="organization-grid">{data.organizations.map(o => <OrganizationCard key={o.id} organization={o} summary={summarize(scopedAssignments(data, { ...filters, organization: o.id }), period)} unavailable={data.unavailableOrganizations.includes(o.id)} preserveMetric={showCombinedEmployees} />)}</div>{showCombinedEmployees && <div className="organization-workspace combined-organization-workspace"><FilterBar exclude={['department', 'designation']} resultCount={organizationEmployees(data, filters, context, params).length} /><OrganizationEmployees combined /></div>}</>
      : data.unavailableOrganizations.includes(org.id) ? <div className="empty-state"><h2>Organization data is unavailable</h2><p>Try again when the organization connection is available.</p></div>
      : <div className="organization-workspace">
        <FilterBar exclude={['organization', 'department', 'designation']} resultCount={organizationEmployees(data, filters, context, params).length} />
        <KpiCards summary={summarize(rows, period)} inline />
        <OrganizationEmployees />
        <LocationExplorer />
      </div>}
  </>;
}
