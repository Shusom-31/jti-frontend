# কী কী implement করা হয়েছে — 29 October 2026

সর্বশেষ পরিবর্তন: অনুরোধ অনুযায়ী Attrition & Retention-এর সম্পূর্ণ page UI ও sidebar link সরানো হয়েছে। ওই পেজের early attrition, tenure, cohort, heatmap, exit-reason table ও metric-definition section আর নেই। পুরোনো `/retention` URL reporting filters রেখে Dashboard-এ নেয়। Dashboard ও অন্য পেজের Attrition metric এখন matching leavers-এর Organization list খোলে। Shared analytics calculation রাখা হয়েছে।

দেওয়া requirements ও module structure অনুসারে খালি repository-তে frontend তৈরি করা হয়েছে। অনুরোধ অনুযায়ী কাজের তালিকা docs-এর সবার উপরে রাখা হয়েছে। সব employee, NID ও metric demo fixture; live backend যুক্ত করা বাকি।

- সর্বশেষ organization flow update: তিনটি organization card থেকে agency খুললে Organization, Department ও Designation filter এবং নিচের দুইটি graph সরানো হয়েছে। একই পেজে `Employee information` table আছে—নাম, Employee ID/Login ID, joining date, resignation date ও status আগে দেখায়। Organization-এর KPI, attrition ও location count click করলে ওই পেজের list বদলায়। All employees/Active/Joiners/Leavers tabs, search, sorting, pagination, CSV ও profile drawer কাজ করে। Clear all selected organization ধরে রাখে; পুরোনো Department/Designation URL values সরানো হয়। Monthly/Full data দুই mode-ই আছে।
- সর্বশেষ branding/login update: নাম সংশোধন করে `JTI Workforce` করা হয়েছে। Login ও application footer-এ `Powered by Upscalebd Ltd.` আছে। Login-এর credentials card সরিয়ে `Quick sign in` button দেওয়া হয়েছে; email/password ছাড়াই random visitor session তৈরি করে intended destination-এ নেয়। Duplicate click prevention, expiry, logout ও masked NID permissions বজায় আছে। এটি বর্তমান fixture auth adapter-এর অংশ; production auth এখনো যুক্ত হয়নি।
- সর্বশেষ period update: Dashboard, Organizations, Joiners & Leavers, Attrition & Retention, Agency Switches ও Directory-তে `Monthly` এবং `Full data` দুই option আছে। Full data সব available বছর/মাস/assignment দেখায়; কোনো ছয় মাসের সীমা নেই। Monthly picker-এর শুরু/শেষ তারিখ dataset থেকে আসে। KPI, location filters, people lists, chart drill-down ও CSV একই selected period ধরে কাজ করে।
- সর্বশেষ UI পরিবর্তন: product name সব screen, browser title, footer ও CSV filename-এ `JTI Workforce`; sidebar গাঢ় সবুজ করা হয়েছে। Agency scorecard, workforce workspace badge, sidebar guide card, visible demo labels এবং connection simulator controls সরানো হয়েছে। Data source এখনো আগের fixture adapter।
- `.env` ও tracked `.env.example` যোগ করা হয়েছে। `VITE_API_BASE_URL` থেকে environment config ও shared RTK Query base API backend URL নেয়; actual live endpoints যুক্ত করা বাকি। `.env` Git-এ ignore করা আছে।
- Login validation, show/hide password, loading, duplicate submit prevention, guarded routes, session expiry, intended destination ও logout।
- Combined dashboard-এর চারটি KPI, তিনটি organization card এবং composition/attrition charts।
- Organization dashboard, shared AND filters, cascading location controls, removable chips, result counts ও Region → Area → Territory → Office drill-down।
- Monthly joiners/leavers, headcount/attrition history table ও office ranking।
- Attrition/retention trend, 90 day early attrition, joining cohort curves, tenure distribution ও territory heatmap।
- Employee directory-তে assignment/person views, search, sorting, pagination, joining/exit date filters, scoped CSV export ও employee profile drawer।
- Matched NID দিয়ে agency switches, previous/new assignment details, gap/overlap, incomplete history, movement matrix, concurrency alerts ও full person timeline।
- NID masking, memory-only exact lookup, missing/unknown fields, loading skeleton, empty/error/retry এবং incomplete agency totals।
- Responsive sidebar/cards/filters/tables, keyboard focus, labeled controls, native modal drawer ও profile বন্ধ করলে আগের focus/state ফেরত দেওয়া।
- Browser checks-এ পাওয়া rapid filter update bug ঠিক করা হয়েছে; নতুন filter পুরোনো selection হারায় না। Reporting month পাল্টালেও metric context থাকে।

Verification: final TypeScript/production build passed; 23 analytics/export tests and ten browser smoke check groups passed with zero runtime exceptions. The new checks cover reduced organization filters, removed graphs, inline joining/resignation/status results, KPI/location actions, agency-preserving Clear all, stale filter removal, search, pagination, profiles and mobile layout. Organization desktop/mobile screenshots were inspected.

Production integration remaining: real authentication, live organization/employee feeds, authoritative server metrics, server permissions and real NID matching. No backend/API endpoint contract was supplied. Reporting supports a selected calendar month or the complete available history, with separate joining/exit ranges in the directory. Optional custom reporting intervals are not implemented.

# Implementation notes

## Scope and data boundary

The handoff specifies frontend behavior; no live API, organization feed, credentials or employee dataset was supplied. Sky Tracker ltd is the supplied organization name. The other two organizations and every employee and metric are demo fixtures. The frontend does not claim real authentication, live payroll or verified real identities.

## Structure

`src/app` owns routes and guards; `src/config` owns navigation, route and environment constants; `src/components` owns reusable layout and controls; `src/modules` owns screens, feature components, typed API adapters and fixtures; `src/store` owns Redux and RTK Query; `src/hooks`, `src/lib`, `src/styles` and `src/types` own shared utilities.

## Metric rules

Calendar dates are represented as ISO date strings. Asia/Dhaka determines the current reporting month. Exit dates are the effective removal day: an assignment is active on a date when joining date <= date and exit date is absent or > date. Opening counts are measured immediately before period start. This yields closing = opening + joiners - leavers, including same day transitions.

Combined attrition uses combined counts, not the average of agency percentages. No gross payroll is derived from daily rates. Missing denominator results are N/A. Missing identity remains separate. Person references and NID match status come from the fixture adapter; the UI does not merge records by names or IDs.

## Production integration

Replace the fixture query implementation in `src/modules/workforce/api/workforce.api.ts` with the authenticated backend adapter and server supplied scoped summaries, history and identity matches. Replace the demo auth adapter with a server session using secure cookies. The demo session is a browser convenience, not production access control. Apply NID authorization on the server as well as in the UI. The default demo role can look up exact NID but cannot reveal or export full NIDs.

The fixture adapter supports loading, retry and partial agency states. Its simulator controls have been removed from the user interface at the user's request. No external service or deployment is configured.

## Implemented routes and source

| Route | Module | Main behavior |
| --- | --- | --- |
| `/login` | `modules/auth` | Demo sign in and validation |
| `/` | `modules/overview` | Combined summary, three organizations and charts |
| `/organizations` | `modules/organizations` | Three-card selector or selected agency dashboard with reduced filters, inline employee information and location explorer |
| `/movement` | `modules/movement` | Monthly movement, waterfall, locations and exit reasons |
| `/retention` | Legacy redirect | Dashboard-এ redirect; এই route-এর নিজস্ব UI নেই |
| `/switches` | `modules/switches` | Matched person transitions, exact NID history, matrix and alerts |
| `/directory` | `modules/employees` | Every overlapping assignment or explicit metric set, profiles and CSV |

`modules/workforce` supplies the shared fixture API, selectors, filters, KPI cards and charts used by the other modules. Each business module exports its public entry through `index.ts`. Domain types live in `src/types`; Redux state and RTK Query configuration live in `src/store`. No unrelated payroll, tax or approvals modules were created: those names in the architecture handoff illustrate the module pattern.

## Filters, employee context and navigation

The URL stores only public scope: agency, reporting mode (`period=monthly` or `period=all`), remembered reporting month, location, Category, Type, department, designation, status, metric, ordinary text search, date ranges, sort, page and page size. Cohort and tenure drilldowns carry their specific context. Location changes clear incompatible descendants. Organization changes preserve compatible values and report removed filters. Search/filter changes reset the page; pagination preserves the search and sort. Rapid updates read the latest browser URL before merging changes.

Within a selected organization, Organization/Department/Designation controls and their chips are omitted. Department and designation are ignored immediately and removed from legacy URLs on entry. Organization scope stays fixed while filters are cleared. KPI and location actions update the same `/organizations` route and scroll to the inline employee table; attrition selects its leavers there. The table prioritizes name, employee/login IDs, joining date, resignation/exit date and status, with location, Type, Category and masked NID available horizontally. Search, sorting, pagination, CSV and profile drawers preserve the organization's result set. The organization composition and attrition graphs were removed; the global dashboards and analytics screens keep their own charts.

Both reporting modes are available on every analytics/directory screen. Navigation, refresh, Clear all and browser Back preserve the selected mode. Full data uses optional server-supplied `reportingCoverage`, falling back to the earliest assignment date through the latest available assignment/update date. The range is global rather than shrinking when an organization or location is selected. Monthly charts/tables keep the preceding six available months; Full data charts, movement rows, heatmap columns and joining cohorts include the entire available range across every year. Empty movement months within that coverage remain visible.

Full data's directory includes every filtered assignment, including historical former employees. Active employees still means active at the interval end; joins and exits cover the full interval. Attrition is a full-period rate, not an annualized rate or an average of monthly percentages. Retention shows N/A when the opening workforce is zero. The cohort curve provides retention by joining cohort in that case. Early attrition includes only complete, observed 90 day windows in the selected interval.

A KPI/location drilldown retains the full reporting interval. Clicking a particular monthly row, attrition point or heatmap cell explicitly switches its destination to Monthly for that exact month; Back returns to Full data. CSV exports the complete filtered result set and includes `full-data` plus the start/end dates in the filename when appropriate. The month picker and full-history month lists derive their limits from data, with no fixed year or month count.

Closing a native profile drawer restores focus and leaves the source search, filters, sort and page intact. Browser Back restores URL scope and remembered scroll. Full NID is passed only through the mounted in-memory workforce context when a profile opens the switch page. General tables and CSV use masked NID. The default demo role allows an exact NID lookup but does not allow revealing full identifiers.

Employee and login IDs remain distinct strings, including leading zeros. CSV contains the full filtered assignment set, independent of pagination and person grouping. CSV fields are escaped and spreadsheet formulas are neutralized. When importing into spreadsheet applications, choose Text for identifier columns to preserve leading zeros; CSV itself has no column type metadata.

## Fixture coverage and metric details

The demo snapshot is dated 28 October 2026, 16:30 Asia/Dhaka and contains 205 assignments across three agencies. Reporting history is available from October 2025 through October 2026. The UI defaults to the current Dhaka month and explains unavailable historical/future periods rather than inventing data.

All fixture identities, employees and values are fictional. Sky Tracker ltd is the supplied organization name; Delta Connect and Nova Fieldforce remain fixture names. Visible demo badges were removed at the user's request. Fixtures include historical joins/exits, one missing confirmed exit, unknown locations, missing NIDs, same day switches, positive gaps, negative overlaps and concurrent active assignments. A partial failure does not create a new transition by linking around a missing agency.

Useful **fictional demo NIDs**, entered only in the dedicated lookup control:

| Demo NID | Scenario in October 2026 |
| --- | --- |
| `0028000100200` | Same day transition, gap 0 days |
| `0028000100201` | Three simultaneous active assignments |
| `0028000100202` | Previous assignment left, confirmed exit date missing |
| `0028000100204` | Negative known gap, five days of overlap |

Early attrition uses joins whose 90th calendar day falls in the reporting month and has been observed by the snapshot date. Cohort month 0 means the end of the joining month. Incomplete/future elapsed months are Not yet observed. Missing confirmed exit dates are excluded from date based summaries and retained in directory/history with an explicit notice. External departures are deduplicated by authoritative person reference and exclude confirmed internal switches; missing identities stay independent records.

## Verification and local environment

| Check | Result |
| --- | --- |
| Analytics/export unit tests | 23 passed, including organization filter isolation, exact inline leaver sets/dates, full-set search/sorting, complete historical assignment sets, full-period KPI/list consistency, dynamic month coverage, early attrition and masked CSV |
| Local Edge browser | Ten smoke groups passed, including inline organization results, reduced filters, removed graphs, fixed organization scope after Clear all, profile/pagination state, both reporting modes, exact monthly drilldowns, CSV, Quick sign in, branding and mobile layout. |
| Runtime exceptions in browser | 0 |
| Production build | Passed: TypeScript check and Vite production build; output in `dist/` |
| Visual review | Login, overview, agency switches and mobile overview screenshots inspected |

Run `npm ci`, `npm run dev`, `npm test` and `npm run build` from this folder. `npm run test:browser` uses locally installed Edge through CDP and stops its own preview and browser processes. Set `BP_BROWSER` for another Chromium executable and `BP_QA_DIR` for an alternate artifact location. No browser download is needed. The optional browser script uses fixed local ports 5178 and 9237.

During implementation C: initially had no free space. Dependencies/cache were installed at `D:\codex-bp-workforce-20261028`; this checkout's ignored `node_modules` is a junction to that installation. Screenshots are under its `qa` folder. This machine-specific arrangement is not needed for a clean clone. Initial browser attempts failed under local memory pressure; after resources became available the complete browser run passed.

The production output is `dist/`. Configure an SPA fallback to `index.html` on the chosen host. This task implements the local repository; it does not register or publish a hosted Site.

