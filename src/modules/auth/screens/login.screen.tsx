import { useRef, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, BarChart3, Eye, EyeOff, LoaderCircle, ShieldCheck, UsersRound } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setSession } from '../../../store/slices/session-slice';
import type { SessionUser } from '../../../config/access/session';
import { quickSignIn, signIn } from '../api/auth.api';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState<'form' | 'quick' | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string; credentials?: string }>({});
  const busy = useRef(false);
  const user = useAppSelector(s => s.session.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; expired?: boolean } | null;
  const destination = state?.from?.startsWith('/') && !state.from.startsWith('//') && !state.from.startsWith('/login') ? state.from : '/';

  async function authenticate(request: () => Promise<SessionUser>, method: 'form' | 'quick') {
    if (busy.current) return;
    busy.current = true;
    setPending(method);
    setErrors({});
    try {
      const session = await request();
      dispatch(setSession(session));
      setPassword('');
      navigate(destination, { replace: true });
    } catch (error) {
      setErrors({ credentials: (error as Error).message });
    } finally {
      setPending(null);
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
    await authenticate(() => signIn(email.trim(), password), 'form');
  }

  if (user && user.expiresAt > Date.now()) return <Navigate to={destination} replace />;

  return <main className="login-page">
    <section className="login-story">
      <div className="brand"><span className="brand-symbol"><BarChart3 size={25} /></span><div>JTI Workforce<span>ANALYTICS PORTAL</span></div></div>
      <div className="login-story-copy">
        <span className="overline light">PEOPLE. MOVEMENT. PERSPECTIVE.</span>
        <h1>A clearer view of<br />your workforce.</h1>
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
        <span className="eyebrow">WELCOME BACK</span>
        <h2>Sign in to your workspace</h2>
        <p className="muted">Your workforce overview is a sign in away.</p>
        {state?.expired && <p className="notice">Your session expired. Sign in to continue where you left off.</p>}
        <form onSubmit={submit} noValidate>
          <label className="field"><span>Email address</span>
            <input type="email" autoComplete="username" placeholder="you@organization.com" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} required />
            {errors.email && <small id="email-error" className="field-error">{errors.email}</small>}
          </label>
          <label className="field"><span>Password</span>
            <div className="password-input">
              <input type={visible ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : undefined} required />
              <button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {errors.password && <small id="password-error" className="field-error">{errors.password}</small>}
          </label>
          {errors.credentials && <p className="field-error" role="alert">{errors.credentials}</p>}
          <button className="button sign-in" disabled={!!pending} type="submit">
            {pending === 'form' ? <><LoaderCircle className="spin" size={18} /> Signing in…</> : <>Sign in <ArrowRight size={18} /></>}
          </button>
        </form>
        <div className="quick-access">
          <span className="login-divider">or</span>
          <button className="button secondary quick-sign-in" type="button" disabled={!!pending} onClick={() => void authenticate(quickSignIn, 'quick')}>
            {pending === 'quick' ? <><LoaderCircle className="spin" size={17} /> Signing in…</> : <>Quick sign in <ArrowRight size={17} /></>}
          </button>
        </div>
        <p className="login-security"><ShieldCheck size={16} /> JTI Workforce analytics portal</p>
      </div>
      <div className="login-copyright"><span>© 2026 JTI Workforce</span><span>Powered by <strong>Upscalebd Ltd.</strong></span></div>
    </section>
  </main>;
}
