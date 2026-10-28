import { baseApi } from '../../../store/api/base-api';
import { fixtureSnapshot } from '../data/workforce.data';
import type { WorkforceSnapshot } from '../../../types';
export const workforceApi = baseApi.injectEndpoints({ endpoints: build => ({
  workforce: build.query<WorkforceSnapshot, string>({
    async queryFn(mode, api) {
      await new Promise<void>(resolve => { const timer = setTimeout(resolve, 320); api.signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true }); });
      if (api.signal.aborted) return { error: { status: 'CUSTOM_ERROR', error: 'Request cancelled.' } };
      if (mode === 'error') return { error: { status: 'CUSTOM_ERROR', error: 'The data connection is unavailable. Restore the connection and retry.' } };
      return { data: fixtureSnapshot(mode.startsWith('partial:') ? mode.slice(8) : '') };
    }, providesTags: ['Workforce'],
  }),
}) });
export const { useWorkforceQuery } = workforceApi;
