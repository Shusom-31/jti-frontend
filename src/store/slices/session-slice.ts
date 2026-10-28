import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { SESSION_KEY, type SessionUser } from '../../config/access/session';
function restore(): SessionUser | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as SessionUser | null;
    return value && typeof value.expiresAt === 'number' && value.expiresAt > Date.now() ? { ...value, canLookupNid: true, canRevealNid: false } : null;
  } catch { return null; }
}
const sessionSlice = createSlice({
  name: 'session', initialState: { user: restore(), expired: false },
  reducers: {
    setSession(state, action: PayloadAction<SessionUser>) { state.user = action.payload; state.expired = false; },
    clearSession(state) { state.user = null; state.expired = false; },
    expireSession(state) { state.user = null; state.expired = true; },
  },
});
export const { setSession, clearSession, expireSession } = sessionSlice.actions;
export default sessionSlice.reducer;
