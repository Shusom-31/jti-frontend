import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { env } from '../../config/env';

export const baseApi = createApi({
  reducerPath: 'workforceApi',
  baseQuery: fetchBaseQuery({ baseUrl: env.apiBaseUrl }),
  tagTypes: ['Workforce'],
  endpoints: () => ({}),
});
