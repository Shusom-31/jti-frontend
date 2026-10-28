import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Organization, Summary } from '../../../types';
import { percent } from '../../../lib/utils/format';
import { useTableFilters } from '../../../hooks/use-table-filters';
export function OrganizationCard({ organization: org, summary, unavailable, preserveMetric = false }: { organization: Organization; summary: Summary; unavailable: boolean; preserveMetric?: boolean }) {
  const { href } = useTableFilters();
  return <Link to={href('/organizations', preserveMetric ? { organization: org.id } : { organization: org.id, metric: '' })} className={`organization-card ${unavailable ? 'unavailable' : ''}`} style={{ '--agency-color': org.color } as React.CSSProperties}><div className="organization-top"><span className="org-avatar">{org.initials}</span><ArrowUpRight size={18} /></div><div className="organization-name"><h3>{org.name}</h3></div>{unavailable ? <p className="field-error">Data unavailable · combined totals incomplete</p> : <><div className="organization-count"><strong>{summary.active.length}</strong><span>active employees</span></div><div className="organization-metrics"><div><span>Attrition</span><strong>{percent(summary.attrition)}</strong></div><div><span>Leavers</span><strong>{summary.leavers.length}</strong></div></div></>}<div className="organization-action">View organization <ArrowRight size={15} /></div></Link>;
}
