import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { BarChart3, LogOut, Menu, X } from 'lucide-react';
import { navigation } from '../../config/nav';
import { useTableFilters } from '../../hooks/use-table-filters';
import { useWorkforce, WorkforceProvider } from '../../hooks/use-workforce';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearSession } from '../../store/slices/session-slice';
import { baseApi } from '../../store/api/base-api';
import { DataBoundary } from '../shared/states';
function ScrollMemory() {
  const location = useLocation();
  const positions = useRef(new Map<string, number>());
  const previousPath = useRef(location.pathname);
  const navigationType = useNavigationType();
  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    const save = () => positions.current.set(key, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [location.pathname, location.search]);
  useLayoutEffect(() => {
    const key = `${location.pathname}${location.search}`;
    const y = navigationType === 'POP' ? positions.current.get(key) || 0 : previousPath.current === location.pathname ? window.scrollY : 0;
    previousPath.current = location.pathname;
    let timer: number;
    const restore = () => { window.scrollTo(0, y); if (document.querySelector('.skeleton-stack')) timer = window.setTimeout(restore, 50); };
    timer = window.setTimeout(restore, 40);
    return () => { clearTimeout(timer); };
  }, [location.pathname, location.search, navigationType]);
  return null;
}
function ShellContent() {
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(s => s.session.user);
  const { data, setMode } = useWorkforce();
  const { filters, href } = useTableFilters();
  const page = navigation.find(n => n.to === location.pathname);

  useEffect(() => {
    setMobile(false);
    document.title = `${page?.label || 'Page'} · JTI Workforce`;
  }, [location.pathname, page?.label]);

  function signOut() {
    dispatch(clearSession());
    dispatch(baseApi.util.resetApiState());
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      {mobile && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMobile(false)} />}
      <aside className={`sidebar ${mobile ? 'open' : ''}`} aria-label="Main navigation">
        <div className="brand">
          <span className="brand-symbol"><BarChart3 size={23} /></span>
          <div>JTI Workforce<span>ANALYTICS PORTAL</span></div>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setMobile(false)}><X size={20} /></button>
        </div>
        <nav>
          {navigation.map(item => (
            <div key={item.to}>
              {item.group && <span className="nav-group">{item.group}</span>}
              <NavLink
                end={item.to === '/'}
                to={href(item.to, { metric: '', reason: '', band: '', cohort: '', elapsed: '' })}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={18} /><span>{item.label}</span>
                {item.to === '/organizations' && data && <small>{data.organizations.length}</small>}
              </NavLink>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="user-block" onClick={signOut} aria-label="Sign out">
            <span className="avatar">WA</span>
            <span><strong>{user?.name}</strong><small>Workforce analyst</small></span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="row">
            <button className="icon-button menu-button" aria-label="Open navigation" aria-expanded={mobile} onClick={() => setMobile(!mobile)}><Menu size={21} /></button>
            <span className="topbar-breadcrumb">Workspace <span>/</span> <strong>{page?.label || 'Page'}</strong></span>
          </div>
          <span className="avatar small-avatar">WA</span>
        </header>
        <main id="main-content" className="main-content" tabIndex={-1}>
          {data?.unavailableOrganizations.length ? (
            <div className="notice warning" role="alert">
              <strong>Combined totals are incomplete.</strong>{' '}
              {data.unavailableOrganizations.map(id => data.organizations.find(o => o.id === id)?.name).join(', ')} is unavailable. Available agency results are shown.
              <button className="text-button" onClick={() => setMode('normal')}>Retry connection</button>
            </div>
          ) : null}
          <DataBoundary><Outlet /></DataBoundary>
        </main>
        <footer className="footer">
          <span>JTI Workforce <span>·</span> {data ? `Updated ${new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(data.updatedAt))}` : 'No current data'} · Asia/Dhaka</span>
          <span className="powered-by">Powered by <strong>Upscalebd Ltd.</strong></span>
        </footer>
      </div>
      <ScrollMemory />
      <span className="sr-only" aria-live="polite">{filters.organization ? `Selected agency ${filters.organization}` : 'All organizations'}</span>
    </div>
  );
}
export function Shell() { return <WorkforceProvider><ShellContent /></WorkforceProvider>; }

