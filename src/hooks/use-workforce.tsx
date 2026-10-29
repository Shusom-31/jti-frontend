import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useWorkforceQuery } from '../modules/workforce/api/workforce.api';
import type { WorkforceSnapshot } from '../types';
import { useAppSelector } from '../store/hooks';
import { getActiveOrganizationIds } from '../modules/admin/data/admin-preview';
type DataState = { data?: WorkforceSnapshot; loading: boolean; error: string | null; retry: () => void; mode: string; setMode: (mode: string) => void; nid: string; setNid: (nid: string) => void };
const DataContext = createContext<DataState | null>(null);
export function WorkforceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState('normal');
  const [nid, setNid] = useState('');
  const query = useWorkforceQuery(mode);
  const user = useAppSelector(state => state.session.user);
  const data = useMemo(() => {
    const source = query.currentData;
    if (!source || user?.role !== 'workspace') return source;
    const allIds = source.organizations.map(org => org.id);
    const visibleIds = getActiveOrganizationIds(allIds);
    const allowed = new Set(user.organizationIds.length ? visibleIds.filter(id => user.organizationIds.includes(id)) : visibleIds);
    const assignments = source.assignments.filter(assignment => allowed.has(assignment.organization));
    const people = source.people.filter(person => assignments.some(assignment => assignment.personId === person.id));
    return { ...source, organizations: source.organizations.filter(org => allowed.has(org.id)), assignments, people, switches: source.switches.filter(sw => allowed.has(sw.previous.organization) && allowed.has(sw.next.organization)), unavailableOrganizations: source.unavailableOrganizations.filter(id => allowed.has(id)) } satisfies WorkforceSnapshot;
  }, [query.currentData, user]);
  return <DataContext.Provider value={{ data, loading: query.isFetching && !data, error: query.isError ? 'The data connection is unavailable. Restore the connection and retry.' : null, retry: () => void query.refetch(), mode, setMode, nid, setNid }}>{children}</DataContext.Provider>;
}
export function useWorkforce() { const ctx = useContext(DataContext); if (!ctx) throw new Error('WorkforceProvider is required'); return ctx; }
