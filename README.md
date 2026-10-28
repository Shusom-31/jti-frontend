# Implementation status — 28 October 2026

Latest Joiners & Leavers update: removed Department and Designation filters, removed the “Why employees leave” chart, and ordered dashboard KPIs as Active employees, Joiners, Leavers, Attrition. Monthly workforce movement now shows Month, Active employees, Joiners, Leavers and Attrition; Opening and Net movement were removed. Net movement was also removed from organization and location summaries.

Latest organization update: agency pages show employee information inline, with joining date, resignation date and status. Organization, Department and Designation filters and the two organization graphs were removed. KPI/location clicks update this list on the same page; Clear all keeps the selected agency. Search, sorting, pagination, CSV and profiles are available in place.

Latest reporting update: **Monthly** and **Full data** options are available on every screen. Full data includes all available years, months and historical assignments; filters, drilldowns and CSV keep the selected scope. Date limits come from the dataset. Monthly chart/table points still open the exact selected month's people.

Latest access update: corrected the name to **JTI Workforce**, added **Powered by Upscalebd Ltd.** to login and application footers, and replaced the visible login credential card with **Quick sign in**. It starts a random fixture visitor session without entering credentials and preserves the intended destination.

UI update: renamed the portal to **JTI Workforce**, applied a dark green sidebar, and removed the agency scorecard, workspace guide card, workspace badge, demo labels and connection simulator controls from the interface.

Implemented the supplied frontend requirements using the requested module structure: demo login, combined/organization dashboards, shared filters and location drilldowns, movement/retention analytics, employee directory/profiles, masked CSV export and matched NID agency history. Completed work is listed at the top of [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md), including decisions, verification and the remaining live API/auth integration.

Added `.env` and `.env.example` with `VITE_API_BASE_URL`; the shared RTK Query base API reads this setting. `.env` files are ignored by Git, while `.env.example` is tracked.

Production build: **passed**. Analytics/export tests: **23 passed**. Local Edge: **ten smoke groups passed**, zero runtime exceptions. Demo data only; no production backend is connected.

# JTI Workforce

Local React + TypeScript workforce analytics portal. Workforce records currently come from fixtures until an authoritative API is connected.

```sh
npm ci
npm run dev
```

On Login, click **Quick sign in** to enter without typing an email or password. This uses the local fixture authentication adapter; a production authentication service is still pending.

Set the backend base URL in `.env` when available, for example:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api
```

The default `/api` points to the same origin. On a fresh checkout, copy `.env.example` to `.env`. Restart `npm run dev` after changing it; production builds must be rebuilt. Vite exposes `VITE_` values to the browser, so use this variable for the public backend URL. Workforce and authentication still use the documented demo adapters until backend endpoint contracts are connected.

- [Implementation notes](docs/IMPLEMENTATION.md)
- [Original frontend requirements](docs/requirements.md)
- [Supplied module architecture](docs/module-architecture.md)

`npm run build` checks TypeScript and builds `dist`. `npm test` checks analytics and scope invariants. Configure your static host to serve `index.html` for application routes.

`npm run test:browser` checks desktop/mobile flows using local Edge. Set `BP_BROWSER` to another Chromium executable if needed. See the implementation notes for fictional NID examples, fixture semantics and this checkout's temporary D: dependency location.

