# Implemented work - 28 October 2026

Implemented in this repository: guarded demo login; combined and organization dashboards; shared AND filters and location drilldowns; monthly movement and retention analytics; employee directory, profiles and full filtered masked CSV; matched NID agency switches, gaps, overlaps and person timelines; responsive layout, loading, empty and error states.

Verification: 23 analytics/export tests and ten local browser smoke groups passed, with zero browser runtime exceptions. Live backend/authentication and real data integration remain pending because none were supplied. The complete work log, source map and verification details are at the top of [IMPLEMENTATION.md](IMPLEMENTATION.md).

Latest reporting update: all screens offer Monthly and Full data. Full data covers every available year/month and historical assignment; KPI, location, directory, movement, retention, switch and CSV scopes stay consistent. Monthly drilldowns select their exact month. See IMPLEMENTATION.md for the current behavior, including requested branding and content removals.

Latest organization update: selected agency pages now use inline employee information, with joining/resignation dates and status. Organization, Department and Designation filters and both organization graphs were removed. KPI/location counts update this same page; Clear all keeps the agency. Search, sorting, pagination, CSV and profiles work in place.

Original supplied handoff follows unchanged.

---

```text
aab-payroll/
│
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
│
├── public/
│   └── favicon.png
│
└── src/
    │
    ├── main.tsx
    │   └── App-এর entry point
    │
    ├── app/
    │   ├── app.tsx
    │   │   └── Main route এবং application tree
    │   ├── guards/
    │   │   ├── session-gate.tsx
    │   │   ├── session-guards.tsx
    │   │   └── portal-redirect.tsx
    │   └── screens/
    │       ├── error-screen.tsx
    │       └── not-found-screen.tsx
    │
    ├── config/
    │   ├── routes.ts
    │   │   └── সব application route
    │   ├── nav.ts
    │   │   └── Sidebar navigation
    │   ├── env.ts
    │   │   └── Environment configuration
    │   └── access/
    │       ├── features.ts
    │       ├── roles.ts
    │       ├── modules.ts
    │       └── session.ts
    │
    ├── components/
    │   ├── layout/
    │   │   ├── shell.tsx
    │   │   ├── auth-shell.tsx
    │   │   ├── employee-shell.tsx
    │   │   ├── sidebar/
    │   │   └── topbar/
    │   ├── shared/
    │   │   ├── data-table.tsx
    │   │   ├── dialog.tsx
    │   │   ├── callout.tsx
    │   │   └── confirm-dialog.tsx
    │   ├── form/
    │   │   ├── form.tsx
    │   │   ├── fields.tsx
    │   │   └── form-item.tsx
    │   └── ui/
    │       ├── button.tsx
    │       ├── input.tsx
    │       ├── tabs.tsx
    │       └── toaster.tsx
    │
    ├── modules/
    │   │
    │   ├── employees/
    │   │   ├── index.ts
    │   │   │   └── Module-এর public exports
    │   │   ├── api/
    │   │   │   └── employees.api.ts
    │   │   ├── screens/
    │   │   │   ├── employees.screen.tsx
    │   │   │   ├── employee-detail.screen.tsx
    │   │   │   └── employee-setup.screen.tsx
    │   │   ├── components/
    │   │   │   ├── employees-table.tsx
    │   │   │   └── bank-details-dialog.tsx
    │   │   ├── types/
    │   │   │   ├── index.ts
    │   │   │   └── api.ts
    │   │   └── data/
    │   │       └── employees.data.ts
    │   │
    │   ├── payroll-runs/
    │   │   ├── index.ts
    │   │   ├── api/
    │   │   │   └── payroll-runs.api.ts
    │   │   ├── screens/
    │   │   │   ├── payroll-runs.screen.tsx
    │   │   │   └── payroll-run-detail.screen.tsx
    │   │   ├── components/
    │   │   ├── types/
    │   │   └── data/
    │   │
    │   ├── salary-structure/
    │   │   ├── index.ts
    │   │   ├── api/
    │   │   ├── screens/
    │   │   ├── components/
    │   │   ├── types/
    │   │   └── data/
    │   │
    │   ├── approvals/
    │   ├── provident-fund/
    │   ├── benefits/
    │   ├── tax/
    │   ├── reports/
    │   ├── users-roles/
    │   └── auth/
    │       ├── index.ts
    │       ├── api/
    │       │   └── auth.api.ts
    │       ├── screens/
    │       │   └── login.screen.tsx
    │       └── types/
    │
    ├── store/
    │   ├── index.ts
    │   │   └── Redux store configuration
    │   ├── hooks.ts
    │   ├── persist.ts
    │   ├── api/
    │   │   ├── base-api.ts
    │   │   ├── endpoints.ts
    │   │   ├── tags.ts
    │   │   └── api-error.ts
    │   ├── slices/
    │   │   └── session-slice.ts
    │   └── middleware/
    │       └── api-error-middleware.ts
    │
    ├── hooks/
    │   ├── use-current-user.ts
    │   ├── use-permissions.ts
    │   └── use-table-filters.ts
    │
    ├── lib/
    │   ├── toast.ts
    │   ├── logger.ts
    │   └── utils/
    │       ├── cn.ts
    │       └── format.ts
    │
    ├── styles/
    │   ├── globals.css
    │   └── tokens.css
    │
    └── types/
        ├── index.ts
        ├── api.ts
        └── import.ts
```

## একটি module-এর ভিতরের basic pattern

```text
modules/employees/
│
├── index.ts
│   └── বাইরে export করার entry file
│
├── api/
│   └── employees.api.ts
│       └── API endpoint এবং RTK Query hooks
│
├── screens/
│   └── employees.screen.tsx
│       └── Main page/UI
│
├── components/
│   └── employees-table.tsx
│       └── শুধু employees feature-এর reusable component
│
├── types/
│   ├── index.ts
│   └── api.ts
│       └── Request/response এবং TypeScript types
│
└── data/
    └── employees.data.ts
        └── Mock বা static data
```

## Simple data flow

```text
employees.screen.tsx
        ↓
useEmployeesQuery()
        ↓
employees.api.ts
        ↓
base-api.ts
        ↓
Backend API
        ↓
RTK Query Cache
        ↓
employees.screen.tsx
```

## Example `index.ts`

```ts
export { EmployeesScreen } from './screens/employees.screen';
export { EmployeeDetailScreen } from './screens/employee-detail.screen';

export { useEmployeesQuery } from './api/employees.api';

export type { Employee, EmployeeRow } from './types';
```

## Example `employees.api.ts`

```ts
import { baseApi } from '@store/api/base-api';

export const employeesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    employees: build.query<Employee[], void>({
      query: () => '/employees',
    }),
  }),
});

export const { useEmployeesQuery } = employeesApi;
```

## Example `employees.screen.tsx`

```tsx
import { useEmployeesQuery } from '../api/employees.api';

export function EmployeesScreen() {
  const { data, isLoading } = useEmployeesQuery();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Employees</h1>

      {data?.map((employee) => (
        <p key={employee.id}>{employee.name}</p>
      ))}
    </div>
  );
}
```

মূল concept:

```text
app        = application control
config     = route, role, permission
components = reusable UI
modules    = business features
store      = global state এবং API cache
hooks      = reusable logic
lib        = utility functions
types      = shared TypeScript types
styles     = global styling
```




