export const env = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL?.trim() || '/api').replace(/\/+$/, '') || '/api',
  dataMode: 'demo' as const,
  timezone: 'Asia/Dhaka',
  sessionHours: 8,
};
