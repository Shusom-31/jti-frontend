export const TIMEZONE = 'Asia/Dhaka';
export function dhakaMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit' }).formatToParts(date);
  return `${parts.find(p => p.type === 'year')!.value}-${parts.find(p => p.type === 'month')!.value}`;
}
export function bounds(month: string) {
  const [year, m] = month.split('-').map(Number);
  return { start: `${month}-01`, end: new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10) };
}
export const shiftMonth = (month: string, offset: number) => {
  const [year, m] = month.split('-').map(Number);
  return new Date(Date.UTC(year, m - 1 + offset, 1)).toISOString().slice(0, 7);
};
export const monthsThrough = (month: string, count = 6) => Array.from({ length: count }, (_, i) => shiftMonth(month, i - count + 1));
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
export const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
export const dateLabel = (date: string | null | undefined) => date ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`)) : 'Not provided';
export const monthLabel = (month: string, short = false) => new Intl.DateTimeFormat('en-GB', { month: short ? 'short' : 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
export const percent = (value: number | null) => value === null ? 'N/A' : `${value.toFixed(2)}%`;
export const count = (value: number) => new Intl.NumberFormat('en-GB').format(value);
export const initials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('');
export const maskNid = (nid: string | null | undefined) => nid ? `••••••${nid.slice(-4)}` : 'Identity unavailable';
export const displayLocation = (value: string) => value || 'Unknown / Unassigned';
export const gapLabel = (gap: number | null) => gap === null ? 'N/A' : gap < 0 ? `${Math.abs(gap)} days overlap` : gap === 0 ? '0 days · Same day' : `${gap} days gap`;
