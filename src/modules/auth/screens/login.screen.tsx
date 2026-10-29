import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BarChart3, Eye, EyeOff, LoaderCircle, ShieldCheck, UsersRound } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSession } from '../../../store/slices/session-slice';
import type { SessionUser } from '../../../config/access/session';
import { signIn } from '../api/auth.api';
import { resetWorkspacePassword } from '../../admin/data/admin-preview';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; credentials?: string }>({});
  const busy = useRef(false);
  const user = useAppSelector(s => s.session.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; expired?: boolean } | null;
  const destination = state?.from?.startsWith('/') && !state.from.startsWith('//') && !state.from.startsWith('/login') ? state.from : '/';

  async function authenticate(request: () => Promise<SessionUser>) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setErrors({});
    try {
      const session = await request();
      dispatch(setSession(session));
      setPassword('');
      navigate(session.role === 'admin' ? '/admin' : destination, { replace: true });
    } catch (error) {
      setErrors({ credentials: (error as Error).message });
    } finally {
      setPending(false);
      busy.current = false;
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    const validation = {
      email: !email.trim() ? 'Email is required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'Enter a valid email address.' : undefined,
      password: !password ? 'Password is required.' : undefined,
    };
    setErrors(validation);
    if (validation.email || validation.password) return;
    await authenticate(() => signIn(email.trim(), password));
  }

  async function submitReset(e: FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setErrors({});
    setResetError('');
    setResetMessage('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErrors({ email: 'Enter the email address for your workspace account.' }); return; }
    if (resetPassword.length < 8) { setResetError('Use a password with at least 8 characters.'); return; }
    if (!confirmResetPassword) { setResetError('Confirm your new password.'); return; }
    if (resetPassword !== confirmResetPassword) { setResetError('Passwords do not match. Enter the same password twice.'); return; }
    busy.current = true;
    setPending(true);
    try {
      await resetWorkspacePassword(email, resetPassword);
      setPassword(resetPassword);
      setResetMode(false);
      setResetPassword('');
      setConfirmResetPassword('');
      setVisible(false);
      setResetMessage('Password reset for this browser preview. Sign in with your new password.');
    } catch (error) {
      setResetError((error as Error).message);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  function changeResetMode(next: boolean) {
    setResetMode(next);
    setResetPassword('');
    setConfirmResetPassword('');
    setResetError('');
    setResetMessage('');
    setErrors({});
  }

  if (user && user.expiresAt > Date.now()) return <Navigate to={user.role === 'admin' ? '/admin' : destination} replace />;

  return <main className="login-page">
    <section className="login-story">
      <div className="brand"><span className="brand-symbol"><BarChart3 size={25} /></span><div>JTI Workforce<span>ANALYTICS PORTAL</span></div></div>
      <div className="login-story-copy">
        <span className="overline light">PEOPLE. MOVEMENT. PERSPECTIVE.</span>
        <h1>A clearer view of your workforce.</h1>
        <p>Understand your people, connect the dots across agencies, and turn workforce movements into informed decisions.</p>
        <div className="login-art" aria-hidden="true">
          <div className="art-stats"><UsersRound size={24} /><span>One connected workforce</span>
            <div className="art-bars">{[45, 68, 56, 85, 73, 100, 90].map((v, i) => <i key={i} style={{ height: `${v}%` }} />)}</div>
            <small>Three agencies. One shared perspective.</small>
          </div><span className="art-dot d1" /><span className="art-dot d2" />
        </div>
      </div>
      <span className="login-bottom">WORKFORCE INTELLIGENCE, WITH CLARITY.</span>
    </section>
    <section className="login-form-panel">
      <div className="login-form-inner">
        <span className="eyebrow">{resetMode ? 'ACCOUNT RECOVERY' : 'WELCOME BACK'}</span>
        <h2>{resetMode ? 'Reset your password' : 'Sign in to your workspace'}</h2>
        <p className="muted">{resetMode ? 'Set a new password for your workspace account.' : 'Sign in with the email and password created for your workspace.'}</p>
        {state?.expired && !resetMode && <p className="notice">Your session expired. Sign in to continue where you left off.</p>}
        {resetMessage && !resetMode && <p className="notice" role="status">{resetMessage}</p>}
        <form onSubmit={resetMode ? submitReset : submit} noValidate>
          <label className="field"><span>Email address</span>
            <input type="email" autoComplete="username" placeholder="you@organization.com" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} required />
            {errors.email && <small id="email-error" className="field-error">{errors.email}</small>}
          </label>
          {resetMode ? <>
            <label className="field"><span>New password</span><input type="password" autoComplete="new-password" placeholder="At least 8 characters" value={resetPassword} onChange={e => setResetPassword(e.target.value)} aria-invalid={!!resetError && resetPassword.length < 8} aria-describedby={resetError ? 'login-form-error' : undefined} required /></label>
            <label className="field"><span>Confirm password</span><input type="password" autoComplete="new-password" placeholder="Enter the new password again" value={confirmResetPassword} onChange={e => setConfirmResetPassword(e.target.value)} aria-invalid={!!resetError && (!confirmResetPassword || confirmResetPassword !== resetPassword)} aria-describedby={resetError ? 'login-form-error' : undefined} required /></label>
          </> : <label className="field"><span>Password</span>
            <div className="password-input">
              <input type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} required />
              <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {errors.password && <small id="password-error" className="field-error">{errors.password}</small>}
          </label>}
          {(errors.credentials || (resetMode && resetError)) && <p id="login-form-error" className="field-error" role="alert">{resetMode ? resetError : errors.credentials}</p>}
          <button className="button sign-in" disabled={pending} type="submit">
            {pending ? <><LoaderCircle className="spin" size={18} /> {resetMode ? 'Resetting password…' : 'Signing in…'}</> : <>{resetMode ? 'Reset password' : 'Sign in'} <ArrowRight size={18} /></>}
          </button>
        </form>
        <p className="login-security"><ShieldCheck size={16} /> JTI Workforce analytics portal</p>
        {resetMode ? <button className="text-button login-recovery-link" type="button" disabled={pending} onClick={() => changeResetMode(false)}><ArrowLeft size={14} /> Back to sign in</button> : <button className="text-button login-recovery-link" type="button" disabled={pending} onClick={() => changeResetMode(true)}>Forgot password?</button>}
        {resetMode && <p className="login-reset-note">Frontend preview only: no recovery email is sent. This changes the saved password in this browser.</p>}
      </div>
      <div className="login-copyright"><span>© 2026 JTI Workforce</span><span>Powered by <strong>Upscalebd Ltd.</strong></span></div>
    </section>
  </main>;
}
