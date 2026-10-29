import type { SessionUser } from '../../../config/access/session';

export type PreviewOrganizationState = {
  active: boolean;
  syncedRecords: number;
  syncedFiles: number;
  lastSyncedAt: string | null;
};

export type PreviewWorkspaceAccount = {
  id: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
  active: boolean;
  createdAt: string;
};

const ORG_KEY = 'jti-admin-preview-organizations';
const ACCOUNT_KEY = 'jti-admin-preview-workspace-accounts';
const SYNC_LIST_KEY = 'jti-admin-preview-sync-organizations';

function readJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}

export function getOrganizationStates(ids: string[]) {
  const stored = readJson<Record<string, PreviewOrganizationState>>(ORG_KEY, {});
  return Object.fromEntries(ids.map(id => [id, stored[id] || { active: true, syncedRecords: 0, syncedFiles: 0, lastSyncedAt: null }])) as Record<string, PreviewOrganizationState>;
}

export function getActiveOrganizationIds(ids: string[]) {
  const states = getOrganizationStates(ids);
  const syncedIds = new Set(getSyncOrganizationIds(ids));
  return ids.filter(id => syncedIds.has(id) && states[id]?.active !== false && !!states[id]?.lastSyncedAt);
}

export function getSyncOrganizationIds(availableIds: string[]) {
  const stored = readJson<string[]>(SYNC_LIST_KEY, []);
  return [...new Set(stored.filter(id => availableIds.includes(id)))];
}

export function addSyncOrganizations(ids: string[], availableIds: string[]) {
  const next = [...new Set([...getSyncOrganizationIds(availableIds), ...ids.filter(id => availableIds.includes(id))])];
  localStorage.setItem(SYNC_LIST_KEY, JSON.stringify(next));
  return next;
}

export function removeSyncOrganization(id: string, availableIds: string[]) {
  const next = getSyncOrganizationIds(availableIds).filter(value => value !== id);
  localStorage.setItem(SYNC_LIST_KEY, JSON.stringify(next));
  return next;
}

export function saveOrganizationState(id: string, state: PreviewOrganizationState) {
  const stored = readJson<Record<string, PreviewOrganizationState>>(ORG_KEY, {});
  localStorage.setItem(ORG_KEY, JSON.stringify({ ...stored, [id]: state }));
}

export function getWorkspaceAccounts(): PreviewWorkspaceAccount[] {
  return readJson<PreviewWorkspaceAccount[]>(ACCOUNT_KEY, []);
}

export function setWorkspaceAccountActive(id: string, active: boolean) {
  const accounts = getWorkspaceAccounts().map(account => account.id === id ? { ...account, active } : account);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
  return accounts;
}

function toHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, saltHex: string) {
  const salt = new Uint8Array(saltHex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || []);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
  return toHex(bits);
}

export async function createWorkspaceAccount(email: string, password: string) {
  const accounts = getWorkspaceAccounts();
  if (accounts.some(account => account.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('An account already exists with this email.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordSalt = toHex(salt.buffer);
  const passwordHash = await hashPassword(password, passwordSalt);
  const account: PreviewWorkspaceAccount = {
    id: crypto.randomUUID(), email: email.trim().toLowerCase(), passwordSalt, passwordHash,
    active: true, createdAt: new Date().toISOString(),
  };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify([...accounts, account]));
  return account;
}

export async function updateWorkspaceAccount(id: string, email: string, password = '') {
  const accounts = getWorkspaceAccounts();
  if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Enter a valid email address.');
  if (accounts.some(account => account.id !== id && account.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('An account already exists with this email.');
  if (password && password.length < 8) throw new Error('Use a password with at least 8 characters.');
  const existing = accounts.find(account => account.id === id);
  if (!existing) throw new Error('Workspace account was not found.');
  const updated = { ...existing, email: email.trim().toLowerCase() };
  if (password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    updated.passwordSalt = toHex(salt.buffer);
    updated.passwordHash = await hashPassword(password, updated.passwordSalt);
  }
  const next = accounts.map(account => account.id === id ? updated : account);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
  return next;
}

export async function resetWorkspacePassword(email: string, password: string) {
  if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
  const accounts = getWorkspaceAccounts();
  const account = accounts.find(item => item.email.toLowerCase() === email.trim().toLowerCase());
  if (!account) throw new Error('No workspace account was found with this email.');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordSalt = toHex(salt.buffer);
  const passwordHash = await hashPassword(password, passwordSalt);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts.map(item => item.id === account.id ? { ...item, passwordSalt, passwordHash } : item)));
}

export async function authenticateWorkspaceAccount(email: string, password: string): Promise<SessionUser | null> {
  const account = getWorkspaceAccounts().find(item => item.email.toLowerCase() === email.trim().toLowerCase());
  if (!account || !account.active) return null;
  const passwordHash = await hashPassword(password, account.passwordSalt);
  if (passwordHash !== account.passwordHash) return null;
  return {
    name: account.email.split('@')[0], email: account.email, role: 'workspace', organizationIds: [],
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, canLookupNid: true, canRevealNid: false,
  };
}

