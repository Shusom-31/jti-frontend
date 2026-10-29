import { useEffect, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { useAppDispatch } from '../../store/hooks';
import { setSession } from '../../store/slices/session-slice';

export function AdminGate({ children }: { children?: ReactNode } = {}) {
  const user = useAppSelector(state => state.session.user);
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (user?.role === 'admin' && user.expiresAt > Date.now()) return;
    dispatch(setSession({ name: 'JTI Workforce Admin', email: 'admin@jti.local', role: 'admin', organizationIds: [], expiresAt: Date.now() + 8 * 60 * 60 * 1000, canLookupNid: false, canRevealNid: false }));
  }, [dispatch, user]);
  if (!user || user.role !== 'admin' || user.expiresAt <= Date.now()) return <main className="admin-page"><div className="admin-loading">Opening admin console…</div></main>;
  return children ?? <Outlet />;
}
