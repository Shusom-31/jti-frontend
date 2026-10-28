import { createContext, useContext, useState, type ReactNode } from 'react';
import { useWorkforceQuery } from '../modules/workforce/api/workforce.api';
import type { WorkforceSnapshot } from '../types';
type DataState = { data?: WorkforceSnapshot; loading: boolean; error: string | null; retry: () => void; mode: string; setMode: (mode: string) => void; nid: string; setNid: (nid: string) => void };
const DataContext = createContext<DataState | null>(null);
export function WorkforceProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState('normal');
  const [nid, setNid] = useState('');
  const query = useWorkforceQuery(mode);
  return <DataContext.Provider value={{ data: query.currentData, loading: query.isFetching && !query.currentData, error: query.isError ? 'The data connection is unavailable. Restore the connection and retry.' : null, retry: () => void query.refetch(), mode, setMode, nid, setNid }}>{children}</DataContext.Provider>;
}
export function useWorkforce() { const ctx = useContext(DataContext); if (!ctx) throw new Error('WorkforceProvider is required'); return ctx; }
