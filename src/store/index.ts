import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api/base-api';
import session from './slices/session-slice';
import { SESSION_KEY } from '../config/access/session';
export const store = configureStore({ reducer: { session, [baseApi.reducerPath]: baseApi.reducer }, middleware: getDefault => getDefault().concat(baseApi.middleware) });
store.subscribe(() => {
  const user = store.getState().session.user;
  try { if (user) sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); else sessionStorage.removeItem(SESSION_KEY); } catch { /* Memory session still works when storage is disabled. */ }
});
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
