import { ArrowUpRight, UsersRound, UserRoundPlus, UserRoundMinus, TrendingDown } from 'lucide-react';
import type { Summary } from '../../../types';
import { count, percent } from '../../../lib/utils/format';
import { useTableFilters } from '../../../hooks/use-table-filters';
import { useNavigate } from 'react-router-dom';
export function KpiCards({ summary, inline = false }: { summary: Summary; inline?: boolean }) {
  const { openEmployees, href, period } = useTableFilters(); const navigate = useNavigate();
  const cards = [
    { title: 'Active employees', value: count(summary.active.length), detail: `${summary.unique} unique people · at period end`, icon: UsersRound, className: 'green', action: () => openEmployees('active') },
    { title: 'Joiners', value: count(summary.joiners.length), detail: `New assignments · ${period.mode === 'all' ? 'full history' : 'selected month'}`, icon: UserRoundPlus, className: 'blue', action: () => openEmployees('joiners') },
    { title: 'Leavers', value: count(summary.leavers.length), detail: `Exits, including internal switches · ${period.mode === 'all' ? 'full history' : 'selected month'}`, icon: UserRoundMinus, className: 'amber', action: () => openEmployees('leavers') },
    { title: 'Attrition', value: percent(summary.attrition), detail: `${summary.leavers.length} leavers in the reporting period`, icon: TrendingDown, className: 'rose', action: () => inline ? openEmployees('leavers') : navigate(href('/retention')) },
  ];
  return <><div className="kpi-grid">{cards.map(card => <button className={`kpi-card ${card.className}`} onClick={card.action} key={card.title}><div className="kpi-label"><span>{card.title}</span><span className="kpi-icon"><card.icon size={18} /></span></div><strong className="kpi-value">{card.value}</strong><div className="kpi-bottom"><span>{card.detail}</span><ArrowUpRight size={15} /></div></button>)}</div>{summary.excluded > 0 && <p className="data-caveat">{summary.excluded} assignment with an unconfirmed exit date is excluded from date based metrics and remains visible in the directory and person history.</p>}</>;
}
