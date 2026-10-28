import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { dhakaMonth } from '../lib/utils/format';
import { filterKeys, type EmployeeContext, type FilterKey, type Filters, type Metric } from '../types';
import { useWorkforce } from './use-workforce';
import { reportingPeriod, reportingMonths, availableRange, monthsInRange } from '../lib/utils/reporting-period';
const allowedMetrics = ['all', 'active', 'opening', 'joiners', 'leavers', 'retained', 'early', 'tenure', 'cohort-retained', 'cohort-left', 'external', 'internal'];
export const metricNames: Record<Metric, string> = { all: 'All assignments', active: 'Active employees', opening: 'Opening employees', joiners: 'Joiners', leavers: 'Leavers', retained: 'Retained employees', early: '90 day early leavers', tenure: 'Tenure band', 'cohort-retained': 'Cohort retained employees', 'cohort-left': 'Cohort leavers', external: 'People leaving all agencies', internal: 'Internal agency exits' };
export function useTableFilters() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useWorkforce();
  const [notice, setNotice] = useState('');
  const requestedMonth = params.get('month') || '';
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth) && Number(requestedMonth.slice(0, 4)) >= 100 ? requestedMonth : dhakaMonth();
  const organizationWorkspace = location.pathname === '/organizations' && !!params.get('organization');
  const movementWorkspace = location.pathname === '/movement';
  const filters = { month, period: params.get('period') === 'all' ? 'all' : 'monthly', ...Object.fromEntries(filterKeys.map(k => [k, (organizationWorkspace || movementWorkspace) && (k === 'department' || k === 'designation') ? '' : params.get(k) || ''])) } as Filters;
  useEffect(() => {
    if (!movementWorkspace || (!params.has('department') && !params.has('designation'))) return;
    const next = new URLSearchParams(params);
    next.delete('department');
    next.delete('designation');
    setParams(next, { replace: true, preventScrollReset: true });
  }, [movementWorkspace, params, setParams]);
  const period = reportingPeriod(data, filters);
  const historyMonths = reportingMonths(data, filters);
  function update(values: Record<string, string | undefined>, replace = false) {
    // Browser history updates before React commits the next render. Read the latest
    // URL so rapid changes from an older event handler cannot discard selections.
    const next = new URLSearchParams(window.location.search);
    next.delete('clearedFilters');
    Object.entries(values).forEach(([k, v]) => { if (v) next.set(k, v); else next.delete(k); });
    if (!('page' in values)) next.delete('page');
    setParams(next, { replace, preventScrollReset: true });
  }
  function change(key: FilterKey | 'month' | 'period', value: string) {
    const changes: Record<string, string> = { [key]: value };
    const hierarchy: FilterKey[] = ['organization', 'region', 'area', 'territory', 'office'];
    const position = hierarchy.indexOf(key as FilterKey);
    const latest = new URLSearchParams(window.location.search);
    const candidate = { ...filters, ...Object.fromEntries(filterKeys.map(k => [k, latest.get(k) || ''])), [key]: value } as Filters;
    if (position >= 0 && data) {
      const cleared: string[] = [];
      const dependentKeys = key === 'organization' ? filterKeys.filter(k => k !== 'organization') : hierarchy.slice(position + 1);
      for (const child of dependentKeys) {
        if (!candidate[child]) continue;
        const parents = hierarchy.slice(0, Math.max(hierarchy.indexOf(child), 1));
        const exists = data.assignments.some(a => (a[child] || '__unknown') === candidate[child] && parents.every(p => !candidate[p] || (a[p] || '__unknown') === candidate[p]));
        if (!exists) { changes[child] = ''; candidate[child] = ''; cleared.push(child); }
      }
      changes.clearedFilters = cleared.join(', ');
      setNotice('');
    }
    update(changes);
  }
  function clear() {
    setNotice('');
    setParams({ month: filters.month, period: filters.period || 'monthly', ...(organizationWorkspace ? { organization: filters.organization } : {}) }, { preventScrollReset: true });
  }
  function href(path: string, overrides: Record<string, string | undefined> = {}, source = params) {
    const next = new URLSearchParams(source);
    next.set('month', filters.month);
    next.set('period', filters.period || 'monthly');
    ['page', 'q', 'sort', 'direction', 'view', 'joinedFrom', 'joinedTo', 'exitedFrom', 'exitedTo'].forEach(k => next.delete(k));
    Object.entries(overrides).forEach(([k, v]) => v ? next.set(k, v) : next.delete(k));
    // A month/chart row always opens that month's exact employees, even from Full data.
    if (overrides.month && !overrides.period) next.set('period', 'monthly');
    if (path === '/organizations' && next.get('organization')) {
      next.delete('department');
      next.delete('designation');
    }
    if (data && overrides.organization && overrides.organization !== filters.organization) {
      const hierarchy: FilterKey[] = ['region', 'area', 'territory', 'office', 'category', 'type', 'department', 'designation', 'status'];
      const cleared: string[] = [];
      for (const key of hierarchy) {
        const value = next.get(key);
        if (!value) continue;
        const index = hierarchy.indexOf(key);
        const parents = hierarchy.slice(0, Math.min(index, 4));
        if (!data.assignments.some(a => a.organization === overrides.organization && (a[key] || '__unknown') === value && parents.every(parent => !next.get(parent) || (a[parent] || '__unknown') === next.get(parent)))) {
          next.delete(key); cleared.push(key);
        }
      }
      if (cleared.length) next.set('clearedFilters', cleared.join(', '));
    }
    return `${path}?${next.toString()}`;
  }
  function openEmployees(metric: Metric, overrides: Record<string, string | undefined> = {}) {
    const destination = '/organizations';
    const inlineOrganization = organizationWorkspace || location.pathname === '/organizations' && params.has('metric') || !!(overrides.organization || filters.organization);
    navigate(href(destination, { metric, reason: '', band: '', cohort: '', elapsed: '', ...overrides }), { preventScrollReset: inlineOrganization });
    if (inlineOrganization) window.setTimeout(() => document.getElementById('organization-employees')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }), 60);
  }
  const rawMetric = params.get('metric') || 'all';
  const requestedCohort = params.get('cohort') || '';
  const cohort = /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedCohort) && Number(requestedCohort.slice(0, 4)) >= 100 ? requestedCohort : undefined;
  const requestedElapsed = Number(params.get('elapsed') || 0);
  const maxElapsed = Math.max(5, monthsInRange(availableRange(data)).length - 1);
  const elapsed = Number.isInteger(requestedElapsed) && requestedElapsed >= 0 && requestedElapsed <= maxElapsed ? String(requestedElapsed) : '0';
  const context: EmployeeContext = { metric: (allowedMetrics.includes(rawMetric) ? rawMetric : 'all') as Metric, reason: params.get('reason') || undefined, band: params.get('band') || undefined, cohort, elapsed };
  return { filters, period, historyMonths, available: availableRange(data), params, update, change, clear, href, openEmployees, context, notice: params.get('clearedFilters') ? `Unavailable filters cleared: ${params.get('clearedFilters')}.` : notice };
}
