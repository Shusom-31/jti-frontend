import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { expireSession } from '../../store/slices/session-slice';
export function SessionGate() {
  const user = useAppSelector(state => state.session.user);
  const expired = useAppSelector(state => state.session.expired);
  const dispatch = useAppDispatch();
  const location = useLocation();
  useEffect(() => {
    if (!user) return;
    const expire = () => { if (Date.now() >= user.expiresAt) dispatch(expireSession()); };
    const timer = setTimeout(expire, Math.max(0, user.expiresAt - Date.now()));
    window.addEventListener('focus', expire);
    return () => { clearTimeout(timer); window.removeEventListener('focus', expire); };
  }, [dispatch, user]);
  if (!user || user.expiresAt <= Date.now()) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}`, expired: expired || !!user }} />;
  return <Outlet />;
}
