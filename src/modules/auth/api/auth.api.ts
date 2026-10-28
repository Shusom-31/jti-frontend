import { env } from '../../../config/env';
import type { SessionUser } from '../../../config/access/session';

function createSession(email: string): SessionUser {
  return { name: 'Workforce Analyst', email, expiresAt: Date.now() + env.sessionHours * 3600000, canLookupNid: true, canRevealNid: false };
}

export async function signIn(email: string, password: string): Promise<SessionUser> {
  await new Promise(resolve => setTimeout(resolve, 450));
  if (email.toLowerCase() !== 'admin@bp.demo' || password !== 'Demo@2026') throw new Error('Email or password is incorrect.');
  return createSession(email);
}

export async function quickSignIn(): Promise<SessionUser> {
  await new Promise(resolve => setTimeout(resolve, 250));
  return createSession(`visitor-${crypto.randomUUID().slice(0, 8)}@jti.workforce`);
}
