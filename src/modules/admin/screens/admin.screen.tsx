import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Activity, Building2, Check, CloudDownload, Database, LayoutDashboard, LogOut, Pencil, Plus, RefreshCw, Save, ShieldCheck, UsersRound, X } from 'lucide-react';
import { useWorkforce } from '../../../hooks/use-workforce';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { clearSession } from '../../../store/slices/session-slice';
import { env } from '../../../config/env';
import { addSyncOrganizations, createWorkspaceAccount, getOrganizationStates, getSyncOrganizationIds, getWorkspaceAccounts, removeSyncOrganization, saveOrganizationState, setWorkspaceAccountActive, updateWorkspaceAccount, type PreviewOrganizationState, type PreviewWorkspaceAccount } from '../data/admin-preview';

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const dateTimeLabel = (date: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Dhaka' }).format(new Date(date));
const navigation = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/sync', label: 'Organization sync', icon: Building2 },
  { to: '/admin/accounts', label: 'Account create', icon: UsersRound },
];

export function AdminScreen() {
  const { data } = useWorkforce();
  const currentUser = useAppSelector(state => state.session.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const organizations = data?.organizations || [];
  const organizationIds = organizations.map(org => org.id);
  const [orgStates, setOrgStates] = useState<Record<string, PreviewOrganizationState>>({});
  const [syncIds, setSyncIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<PreviewWorkspaceAccount[]>(getWorkspaceAccounts);
  const [sourceLoaded, setSourceLoaded] = useState(false);
  const [sourceSelection, setSourceSelection] = useState<string[]>([]);
  const [syncingId, setSyncingId] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountMessage, setAccountMessage] = useState('');
  const [editingId, setEditingId] = useState('');
  const [editingEmail, setEditingEmail] = useState('');
  const [editingPassword, setEditingPassword] = useState('');

  useEffect(() => {
    if (!organizationIds.length) return;
    setOrgStates(getOrganizationStates(organizationIds));
    setSyncIds(getSyncOrganizationIds(organizationIds));
  }, [data]);

  const syncedOrganizations = useMemo(() => syncIds.map(id => organizations.find(org => org.id === id)).filter((org): org is NonNullable<typeof org> => !!org), [syncIds, organizations]);
  const activeSynced = syncedOrganizations.filter(org => orgStates[org.id]?.active !== false && !!orgStates[org.id]?.lastSyncedAt);
  const syncedRecords = syncedOrganizations.reduce((sum, org) => sum + (orgStates[org.id]?.syncedRecords || 0), 0);
  const syncedFiles = syncedOrganizations.reduce((sum, org) => sum + (orgStates[org.id]?.syncedFiles || 0), 0);
  const availableOrganizations = organizations.filter(org => !syncIds.includes(org.id));
  const page = location.pathname === '/admin/sync' ? 'sync' : location.pathname === '/admin/accounts' ? 'accounts' : 'overview';

  function signOut() {
    dispatch(clearSession());
    navigate('/login', { replace: true });
  }

  function updateOrgState(id: string, patch: Partial<PreviewOrganizationState>) {
    const current = orgStates[id] || { active: true, syncedRecords: 0, syncedFiles: 0, lastSyncedAt: null };
    const next = { ...current, ...patch };
    saveOrganizationState(id, next);
    setOrgStates(states => ({ ...states, [id]: next }));
  }

  function addSelectedOrganizations() {
    const next = addSyncOrganizations(sourceSelection, organizationIds);
    setSyncIds(next);
    setSourceSelection([]);
    setSyncMessage(`${sourceSelection.length} organization${sourceSelection.length === 1 ? '' : 's'} added to the sync list.`);
    setSyncError('');
  }

  function removeOrganization(id: string) {
    const next = removeSyncOrganization(id, organizationIds);
    setSyncIds(next);
    setSyncMessage('Organization removed from the sync list. It is no longer shown in workspace views.');
  }

  async function syncOrganization(id: string) {
    if (!data || syncingId) return;
    setSyncError('');
    setSyncMessage('');
    setSyncingId(id);
    try {
      await pause(500);
      const recordCount = data.assignments.filter(assignment => assignment.organization === id).length;
      updateOrgState(id, { syncedRecords: recordCount, syncedFiles: 0, lastSyncedAt: new Date().toISOString() });
      setSyncMessage(`${organizations.find(org => org.id === id)?.name || id} updated: ${recordCount} employee records, 0 files. This preview does not write to a backend.`);
    } catch {
      setSyncError('Organization sync preview could not be completed.');
    } finally {
      setSyncingId('');
    }
  }

  async function submitAccount(event: FormEvent) {
    event.preventDefault();
    setAccountError('');
    setAccountMessage('');
    if (password.length < 8) { setAccountError('Use a password with at least 8 characters.'); return; }
    try {
      await createWorkspaceAccount(email, password);
      setAccounts(getWorkspaceAccounts());
      setEmail('');
      setPassword('');
      setAccountMessage('Workspace account saved in this browser preview. It can sign in to active, synced organizations only.');
    } catch (error) {
      setAccountError((error as Error).message);
    }
  }

  function beginAccountEdit(account: PreviewWorkspaceAccount) {
    setEditingId(account.id);
    setEditingEmail(account.email);
    setEditingPassword('');
    setAccountError('');
    setAccountMessage('');
  }

  async function saveAccountEdit(account: PreviewWorkspaceAccount) {
    setAccountError('');
    setAccountMessage('');
    try {
      const updated = await updateWorkspaceAccount(account.id, editingEmail, editingPassword);
      setAccounts(updated);
      setEditingId('');
      setEditingPassword('');
      setAccountMessage('Workspace account updated in this browser preview.');
    } catch (error) {
      setAccountError((error as Error).message);
    }
  }

  function toggleAccount(account: PreviewWorkspaceAccount) {
    setAccounts(setWorkspaceAccountActive(account.id, !account.active));
  }

  if (!data) return <main className="admin-page"><aside className="admin-sidebar" /><div className="admin-loading"><RefreshCw className="spin" size={20} /> Loading organization preview…</div></main>;

  return <main className="admin-page">
    <aside className="admin-sidebar">
      <div className="admin-brand"><span className="brand-symbol"><ShieldCheck size={22} /></span><div>JTI Workforce<small>ADMIN CONSOLE</small></div></div>
      <nav aria-label="Admin navigation">{navigation.map(item => <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><item.icon size={17} /><span>{item.label}</span>{item.to === '/admin/sync' && <small>{syncedOrganizations.length}</small>}</NavLink>)}</nav>
      <div className="admin-sidebar-bottom"><div className="admin-identity"><span className="admin-avatar">AD</span><span><strong>{currentUser?.name || 'JTI Workforce Admin'}</strong><small>Administrator · URL access</small></span></div><button className="admin-signout" onClick={signOut}><LogOut size={16} /> Exit admin</button></div>
    </aside>

    <div className="admin-main">
      <header className="admin-topbar"><span>Workspace <i>/</i> <strong>{page === 'sync' ? 'Organization sync' : page === 'accounts' ? 'Account create' : 'Admin overview'}</strong></span><span className="admin-preview-badge"><Activity size={14} /> FRONTEND PREVIEW</span></header>
      <div className="admin-content">
        <div className="admin-preview-banner"><strong>Preview mode.</strong> Accounts, sync state and organization visibility are stored only in this browser. No source endpoint or database is connected yet.</div>

        {page === 'overview' && <>
          <div className="admin-heading"><div><span className="eyebrow">WORKSPACE MANAGEMENT</span><h1>Admin overview</h1><p>Manage organizations and the accounts that use the JTI Workforce workspace.</p></div></div>
          <section className="admin-stat-grid" aria-label="Workspace summary">
            <article><span>Workspace organizations</span><strong>{activeSynced.length}<small> active</small></strong></article>
            <article><span>Employee records synced</span><strong>{syncedRecords.toLocaleString()}</strong></article>
            <article><span>Files synced</span><strong>{syncedFiles.toLocaleString()}</strong></article>
            <article><span>Workspace accounts</span><strong>{accounts.length}</strong></article>
          </section>
          <section className="panel admin-panel"><div className="section-title"><div><h2>Workspace visibility</h2><p>Only synced and Active organizations appear for workspace users.</p></div></div><div className="table-scroll"><table className="admin-table"><thead><tr><th>Organization</th><th>Status</th><th>Records</th><th>Files</th><th>Last sync</th></tr></thead><tbody>{syncedOrganizations.length ? syncedOrganizations.map(org => { const state = orgStates[org.id]; return <tr key={org.id}><td><strong>{org.name}</strong></td><td><span className={`admin-status-pill ${state?.active === false ? 'is-inactive' : 'is-active'}`}>{state?.active === false ? 'Inactive' : 'Active'}</span></td><td>{(state?.syncedRecords || 0).toLocaleString()}</td><td>{state?.syncedFiles || 0}</td><td>{state?.lastSyncedAt ? dateTimeLabel(state.lastSyncedAt) : 'Not synced'}</td></tr>; }) : <tr><td colSpan={5} className="muted">No organizations have been added to the sync list.</td></tr>}</tbody></table></div></section>
        </>}

        {page === 'sync' && <>
          <div className="admin-heading"><div><span className="eyebrow">SOURCE DATA</span><h1>Organization sync</h1><p>Load organizations from the source, add them to the list, then sync one organization at a time.</p></div></div>
          <section className="panel admin-source-panel"><div className="admin-source-top"><span className="admin-source-icon"><Database size={18} /></span><div><strong>Organization source endpoint</strong><small>GET {env.apiBaseUrl}/admin/source/organizations</small></div><button className="button secondary small-button" onClick={() => { setSourceLoaded(true); setSyncError(''); }}>Load organizations</button></div><p>Preview source contains {organizations.length} organizations. A real endpoint will replace these fixture results when the backend is connected.</p></section>
          {sourceLoaded && <section className="panel admin-panel table-panel"><div className="section-title"><div><h2>Available organizations <span className="count-badge">{availableOrganizations.length}</span></h2><p>Choose organizations and add them to the sync list below.</p></div><button className="button" disabled={!sourceSelection.length} onClick={addSelectedOrganizations}><Plus size={15} /> Add selected ({sourceSelection.length})</button></div><div className="table-scroll"><table className="admin-table"><thead><tr><th><input aria-label="Select all available organizations" type="checkbox" checked={availableOrganizations.length > 0 && sourceSelection.length === availableOrganizations.length} onChange={event => setSourceSelection(event.target.checked ? availableOrganizations.map(org => org.id) : [])} /></th><th>Organization</th><th>Source ID</th><th>Action</th></tr></thead><tbody>{availableOrganizations.length ? availableOrganizations.map(org => <tr key={org.id}><td><input type="checkbox" aria-label={`Select ${org.name} from source`} checked={sourceSelection.includes(org.id)} onChange={event => setSourceSelection(ids => event.target.checked ? [...new Set([...ids, org.id])] : ids.filter(id => id !== org.id))} /></td><td><strong>{org.name}</strong></td><td className="mono">{org.id}</td><td><button className="text-button" onClick={() => { setSyncIds(addSyncOrganizations([org.id], organizationIds)); setSyncMessage(`${org.name} added to the sync list.`); }}>{syncIds.includes(org.id) ? 'Already added' : 'Add to list'}</button></td></tr>) : <tr><td colSpan={4} className="muted">All available organizations are already in the sync list.</td></tr>}</tbody></table></div></section>}

          <section className="panel admin-panel table-panel"><div className="section-title"><div><h2>Organizations to sync <span className="count-badge">{syncedOrganizations.length}</span></h2><p>Each Sync button updates only its organization. Re-sync replaces that organization’s saved preview count.</p></div></div>{syncMessage && <p className="admin-inline-success" role="status"><Check size={15} />{syncMessage}</p>}{syncError && <p className="field-error" role="alert">{syncError}</p>}<div className="table-scroll"><table className="admin-table"><thead><tr><th>Organization</th><th>Workspace visibility</th><th>Employees at source</th><th>Synced records</th><th>Files</th><th>Last sync</th><th>Sync</th><th></th></tr></thead><tbody>{syncedOrganizations.length ? syncedOrganizations.map(org => { const state = orgStates[org.id] || { active: true, syncedRecords: 0, syncedFiles: 0, lastSyncedAt: null }; const sourceCount = data.assignments.filter(assignment => assignment.organization === org.id).length; return <tr key={org.id}><td><strong>{org.name}</strong></td><td><button className={`admin-status-toggle ${state.active ? 'is-active' : 'is-inactive'}`} onClick={() => updateOrgState(org.id, { active: !state.active })} aria-pressed={state.active}>{state.active ? 'Active' : 'Inactive'}</button></td><td>{sourceCount.toLocaleString()}</td><td>{state.syncedRecords.toLocaleString()}</td><td>{state.syncedFiles.toLocaleString()}</td><td>{state.lastSyncedAt ? dateTimeLabel(state.lastSyncedAt) : 'Not synced'}</td><td><button className="button small-button" disabled={!!syncingId} onClick={() => void syncOrganization(org.id)}>{syncingId === org.id ? <><RefreshCw className="spin" size={14} /> Syncing…</> : <><CloudDownload size={14} /> Sync</>}</button></td><td><button className="icon-button" aria-label={`Remove ${org.name} from sync list`} title="Remove from sync list" onClick={() => removeOrganization(org.id)}><X size={15} /></button></td></tr>; }) : <tr><td colSpan={8} className="muted">Load organizations from the source, then add the ones to sync.</td></tr>}</tbody></table></div></section>
        </>}

        {page === 'accounts' && <>
          <div className="admin-heading"><div><span className="eyebrow">WORKSPACE ACCESS</span><h1>Account create</h1><p>Create workspace sign-ins. Accounts can use every organization that is synced and Active.</p></div></div>
          <section className="panel admin-panel account-panel"><div className="section-title"><div><h2>Create workspace account</h2><p>Admin credentials are separate and cannot be used to sign in to the workspace.</p></div><UsersRound size={19} /></div><form className="admin-account-form" onSubmit={submitAccount}><label className="field"><span>Account email</span><input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="person@organization.com" /></label><label className="field"><span>Workspace password</span><input type="password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} placeholder="At least 8 characters" /></label>{accountError && <p className="field-error" role="alert">{accountError}</p>}{accountMessage && <p className="admin-inline-success" role="status"><Check size={15} />{accountMessage}</p>}<button className="button" type="submit"><Plus size={15} /> Create account</button></form></section>
          <section className="panel admin-panel table-panel"><div className="section-title"><div><h2>Workspace accounts <span className="count-badge">{accounts.length}</span></h2><p>Email and password can be updated later. No organization selection is needed.</p></div></div>{accountError && <p className="field-error admin-account-message" role="alert">{accountError}</p>}{accountMessage && <p className="admin-inline-success" role="status"><Check size={15} />{accountMessage}</p>}<div className="table-scroll"><table className="admin-table"><thead><tr><th>Email</th><th>Workspace access</th><th>Account status</th><th>Created</th><th>Actions</th></tr></thead><tbody>{accounts.length ? accounts.map(account => <tr key={account.id}>{editingId === account.id ? <><td><input aria-label="Edit account email" type="email" required value={editingEmail} onChange={event => setEditingEmail(event.target.value)} /></td><td><input aria-label="Set a new workspace password" type="password" value={editingPassword} onChange={event => setEditingPassword(event.target.value)} placeholder="Leave blank to keep password" /></td><td><span className={`admin-status-pill ${account.active ? 'is-active' : 'is-inactive'}`}>{account.active ? 'Active' : 'Disabled'}</span></td><td>{dateTimeLabel(account.createdAt)}</td><td><div className="admin-row-actions"><button className="icon-button" aria-label="Save account" onClick={() => void saveAccountEdit(account)}><Save size={15} /></button><button className="icon-button" aria-label="Cancel account edit" onClick={() => setEditingId('')}><X size={15} /></button></div></td></> : <><td><strong>{account.email}</strong></td><td>All synced and Active organizations</td><td><button className={`admin-status-toggle ${account.active ? 'is-active' : 'is-inactive'}`} aria-pressed={account.active} onClick={() => toggleAccount(account)}>{account.active ? 'Active' : 'Disabled'}</button></td><td>{dateTimeLabel(account.createdAt)}</td><td><button className="icon-button" aria-label={`Edit ${account.email}`} title="Edit email or password" onClick={() => beginAccountEdit(account)}><Pencil size={15} /></button></td></>}</tr>) : <tr><td colSpan={5} className="muted">No workspace accounts have been created.</td></tr>}</tbody></table></div></section>
        </>}
      </div>
      <footer className="admin-footer">JTI Workforce · Powered by <strong>Upscalebd Ltd.</strong></footer>
    </div>
  </main>;
}
