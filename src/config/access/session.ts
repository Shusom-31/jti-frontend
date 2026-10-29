export type SessionUser = { name: string; email: string; expiresAt: number; role: 'workspace' | 'admin'; organizationIds: string[]; canLookupNid: boolean; canRevealNid: boolean };
export const SESSION_KEY = 'bp-demo-session';
