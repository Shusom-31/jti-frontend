import { CircleAlert, SearchX, RefreshCw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useWorkforce } from '../../hooks/use-workforce';
import { useSearchParams } from 'react-router-dom';
import { dhakaMonth } from '../../lib/utils/format';
import { availableRange } from '../../lib/utils/reporting-period';
export function LoadingSkeleton() { return <div className="skeleton-stack" role="status" aria-label="Loading workforce data"><div className="skeleton skeleton-title" /><div className="kpi-grid">{[1, 2, 3, 4].map(i => <div className="skeleton skeleton-card" key={i} />)}</div><div className="skeleton skeleton-panel" /><span className="sr-only">Loading workforce data…</span></div>; }
export function EmptyState({ title = 'No matching employees', detail = 'Try a different reporting month or clear your filters.', clear }: { title?: string; detail?: string; clear?: () => void }) { return <div className="empty-state"><SearchX size={30} /><h3>{title}</h3><p>{detail}</p>{clear && <button className="button secondary" onClick={clear}>Clear filters</button>}</div>; }
export function DataBoundary({ children }: { children: ReactNode }) {
  const { data, loading, error, retry } = useWorkforce();
  const [params, setParams] = useSearchParams();
  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="empty-state error-state" role="alert"><CircleAlert size={30} /><h2>Unable to load workforce data</h2><p>{error}</p><button className="button" onClick={retry}><RefreshCw size={16} /> Retry</button></div>;
  if (!data) return <LoadingSkeleton />;
  const month = params.get('month') || dhakaMonth();
  const available = availableRange(data);
  if (params.get('period') !== 'all' && /^\d{4}-\d{2}$/.test(month) && (month < available.start.slice(0, 7) || month > available.end.slice(0, 7))) return <div className="unavailable-period"><EmptyState title="Reporting history unavailable" detail={`Available history: ${available.start.slice(0, 7)} through ${available.end.slice(0, 7)}. Choose an available month or open Full data.`} clear={() => { const next = new URLSearchParams(params); next.set('month', available.end.slice(0, 7)); setParams(next); }} /><button className="button secondary" onClick={() => { const next = new URLSearchParams(params); next.set('period', 'all'); setParams(next); }}>View full data</button></div>;
  return children;
}
