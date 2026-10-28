# Implemented work - 28 October 2026

Implemented in this repository: guarded demo login; combined and organization dashboards; shared AND filters and location drilldowns; monthly movement and retention analytics; employee directory, profiles and full filtered masked CSV; matched NID agency switches, gaps, overlaps and person timelines; responsive layout, loading, empty and error states.

Verification: 23 analytics/export tests and ten local browser smoke groups passed, with zero browser runtime exceptions. Live backend/authentication and real data integration remain pending because none were supplied. The complete work log, source map and verification details are at the top of [IMPLEMENTATION.md](IMPLEMENTATION.md).

Latest reporting update: all screens offer Monthly and Full data. Full data covers every available year/month and historical assignment; KPI, location, directory, movement, retention, switch and CSV scopes stay consistent. Monthly drilldowns select their exact month. See IMPLEMENTATION.md for the current behavior, including requested branding and content removals.

Latest organization update: selected agency pages now use inline employee information, with joining/resignation dates and status. Organization, Department and Designation filters and both organization graphs were removed. KPI/location counts update this same page; Clear all keeps the agency. Search, sorting, pagination, CSV and profiles work in place.

Original supplied handoff follows unchanged.

---

BP Workforce Analytics Frontend Requirements

Implementation handoff  |  Version 1.0  |  28 October 2026

Build a login based workforce analytics portal for three organizations. After login, users see the combined workforce summary, open an organization, filter its workforce by location and employee attributes, and inspect the people behind each metric. Agency switches are presented as a person timeline linked by NID.

This document specifies frontend screens, navigation, fields, interactions, display rules and acceptance criteria. Database design, backend implementation and API endpoint design are outside this document.

1 Product language and terminology

Use Organization and Agency for the same business entity. Use Employee or BP consistently in screen labels. Total employees means active employment assignments at the end of the reporting period; label this explicitly as Active employees. Show Unique people separately when a person has concurrent agency assignments.

2 Navigation and page structure

Sidebar item

Destination and purpose

Dashboard

Combined totals and three organization cards. Default page after login.

Organizations

Organization selector; opens the selected organization dashboard.

Joiners and Leavers

Monthly movement and location breakdown, within the current agency scope.

Attrition and Retention

Attrition trends and retention analysis, within the current scope.

Agency Switches

NID linked movements, gaps and simultaneous active assignments.

Employee Directory

All employees with agency, location, status and date filters.

3 Login and access flow

Provide email and password fields, show or hide password, a Sign in button and inline validation. Required or invalid email errors appear beside the field. Show a loading state during submission and prevent duplicate submits. Invalid credentials display a clear message without clearing the email.

A successful login opens Dashboard. An expired session returns the user to Login and preserves the intended destination for after sign in. Logout clears the client session and returns to Login. Direct dashboard URLs require an authenticated session; credentials must not appear in URLs or browser logs.

4 Combined dashboard

The default dashboard shows all three organizations for the current month in Asia/Dhaka time. Place the reporting month selector and reporting period label above the summary. Users can change the month without leaving the screen.

Top summary cards

Card

Display and click behavior

Active employees

Combined active assignments at period end. Click opens the corresponding employee list.

Total attrition

Attrition percentage for the period. Display the leaver count alongside it. Click opens Attrition and Retention.

Joined this month

Count of joining assignments in the selected month. Click opens those joiners.

Left this month

Count of exits in the selected month. Click opens those leavers.

Secondary summary values may show retention percentage and monthly gross payroll when actual values are available. Do not present a daily rate multiplied by assumed paid days as actual gross payroll.

Three organization cards

Place the three cards below the combined summary. Each card contains organization name, logo or initials, active employee count, attrition percentage and leaver count for the selected period. Optional secondary values are monthly joiners and net movement. The whole card and its View organization action open the organization dashboard.

Sky Tracker ltd is the supplied organization. Read the other organization names from available organization data; demo names must stay visibly marked as demo. Carry the selected reporting month into the organization screen.

Supporting charts

Stacked bar: active employees by agency, split by Type or Category. Clicking a segment applies that agency and segment filter.

Line chart: monthly attrition percentage per agency. Clicking a point opens that agency and month with the matching leaver list.

Agency scorecard: active employees, joiners, leavers, net movement, attrition, retention and available payroll. Counts open employee lists.

Summary consistency

Combined attrition must use combined opening, closing and leaver counts. Do not average the three agency percentages. An agency switch is an exit for the old agency and a join for the new agency. Show internal switches separately from people leaving all agencies; do not label internal movement as a company wide unique person exit.

5 Organization dashboard and filters

Opening an organization card shows its name, logo or initials, a breadcrumb back to Dashboard, and the selected reporting month. Its top cards repeat active employees, attrition, monthly joiners and monthly leavers for that organization only.

Filter controls

Control

Available values or behavior

Reporting period

Month and year; optional custom date range with an explicit Apply action.

Region

Values from the organization workforce data.

Area

Areas available within the selected region.

Territory

Territories available within the selected region and area.

Office or Sales Point

Use office_name as Office. Show Sales Point only if that separate field exists.

Category

Metro, Urban, Rural, plus any additional supplied values.

Type

Prime, Campaign, plus any additional supplied values.

Department and designation

Department, BA, Supervisor and other supplied values.

Status

All, Active, Left and other explicitly supplied employment states.

Filter behavior at every level

All selected filters combine with AND. Region = Mymensingh, Area = Sylhet and Type = Campaign must show only employees matching all three. Changing filters refreshes KPI cards, charts, monthly tables, location tables, employee lists and result counts together.

Changing Region clears incompatible Area, Territory and Office selections. Changing Area clears incompatible Territory and Office selections. Preserve compatible filters when switching agencies; clear unavailable values and show a short notice. Display selected values as removable filter chips, with Clear all and a visible result count.

Location drill down

Navigate from Organization to Region, Area, Territory, and Office or Sales Point where available. At each level show active employees, joiners, leavers, net movement and attrition percentage. Clicking a location name opens its child level and updates the breadcrumb. Clicking a metric opens the corresponding employees within that exact location and period.

Example: Sky Tracker ltd > Mymensingh > Sylhet > Sylhet. Selecting Leavers opens only matching leavers. Back navigation restores the previous location, filters and scroll position. Keep Unknown or Unassigned locations visible rather than silently removing their employees.

6 Employee lists and profile

Any count opened from a KPI, chart, month or location must retain its full scope. Above the list show organization, date range, selected filters, metric name and matching count. Provide search, sorting and pagination; a list opened from Leavers must not silently revert to active employees.

Employee list columns

Field

Display rule

Employee name

Clickable name; opens employee profile.

Employee ID and Login ID

Keep separate. Display IDs as text, preserving leading zeros.

Organization and department

Agency name and department_name.

Designation

designation_name, such as BA or Supervisor.

Joining date

Assignment joining date in a consistent day month year format.

Resignation or exit date

Confirmed exit date. Show Not provided when missing.

Status

Active, Left or the supplied state; include text with badge color.

Location

Region, Area, Territory and Office; allow horizontal scrolling.

Type and Category

Show supplied custom field values.

NID

Masked by default; searchable using an authorized NID search control.

Profile drawer or detail page

Show employee name, photo or initials, employee ID, login ID, organization, department, designation, status, joining date and resignation or exit date. Include Region, Area, Territory, Office, Type and Category, together with available manager and employment type information.

An Employment history section groups assignments belonging to the same NID. Each timeline entry shows agency, location, joining date, resignation or exit date and status. An agency transition shows the gap or overlap in days. A View agency switches action opens the matching person history with the current NID context.

If the profile is a drawer, closing it restores the exact source list. If it is a separate route, provide Back to results and restore filters, search, page and sorting. Never mix historical assignment fields with the person’s current agency details.

Missing and inconsistent fields

Show Not provided for absent dates, location values and exit reasons. Do not interpret every inactive status timestamp as a resignation date. Preserve supplied employee names. Location aliases such as Mymensign and Mymensingh should use the supplied canonical label; the frontend must not independently merge ambiguous values.

7 Movement and attrition screens

Monthly joiners and leavers

Display a monthly table containing Month, Opening employees, Joiners, Leavers, Closing employees, Net movement and Attrition percentage. Clicking Joiners, Leavers or Closing opens the exact employee set for that row’s month and active filters.

Waterfall: opening workforce, additions from joiners, reductions from leavers and closing workforce. Clickable bars open their employee lists.

Location table: Region > Area > Territory > Office or Sales Point, showing joiners, leavers and net movement at each level.

Ranked bar: top 10 sales points by leavers when sales point data exists; otherwise clearly label the chart as Territories or Offices.

Exit reason donut: selecting a reason opens matching leavers. Missing reasons appear as Not provided.

Attrition and retention

For the selected agency and filters, show the monthly attrition trend, 90 day early attrition, joining cohort retention curve, tenure band distribution, exit reasons by agency, and territory by month attrition heatmap. Each chart must state its period, units and applied scope.

Heatmap cells open employees who left in that territory and month. Tenure bands open employees in the selected band. An attrition point opens that month’s leavers. A retention curve point opens retained employees for that joining cohort and elapsed month, with a companion option to view cohort leavers.

Metric definitions for UI labels and tooltips

Metric

Definition to display consistently

Monthly attrition

Period leavers divided by average opening and closing workforce, multiplied by 100.

Retention

Employees present at period start who remain at period end, divided by opening employees, multiplied by 100.

Net movement

Joiners minus leavers. Closing = opening + joiners - leavers.

90 day early attrition

Employees leaving within 90 days of joining, divided by eligible joins with a full 90 day observation window.

Cohort retention

Percentage of an original joining cohort still employed at each elapsed month.

Show percentages to two decimal places and counts as whole numbers. Use N/A when a denominator is zero or historical data is unavailable. Keep future cohort periods blank or marked Not yet observed. Display a clear explanation rather than fabricated historical trends.

8 Agency switches through NID

Provide a dedicated Agency Switches page that groups a person’s assignments across organizations using the matched NID identity supplied to the UI. Keep NID as text and retain leading zeros. Names, phone numbers or employee IDs alone must not establish an agency switch.

Search and filters

Include exact NID search, employee name or ID search, previous agency, new agency, switch date range, movement status, minimum and maximum gap days, plus location, Category and Type filters. Provide a Location applies to selector with Previous assignment, New assignment and Either assignment. Default to New assignment and label it visibly.

A switch belongs to the selected month when the new assignment joining date falls in that month. Match name and ID search against either assignment. NID search returns every linked assignment for that person; the period and movement filters still govern the switch result table.

Switcher table fields

Field group

Required columns

Identity

Employee name, masked NID, previous employee ID and new employee ID.

Previous assignment

Previous agency, Region, Area, Territory and Office or Sales Point.

New assignment

New agency, Region, Area, Territory and Office or Sales Point.

Movement dates

Previous resignation or exit date, new joining date and gap days.

Movement result

Switched, Overlapping active assignments, or Incomplete history.

Gap and overlap display

Gap days = new joining date minus previous exit date using calendar dates in the reporting timezone. A same day transition shows 0 days. Positive values show a gap; negative values show an overlap of the absolute number of days. If either date is missing, show N/A and Incomplete history. Never invent an exit date for an assignment that is still active.

Movement summary and person history

Show switch count, average known gap and overlapping active assignment count. Display a from agency to agency matrix or Sankey; clicking a link or cell filters the switcher table. Clicking a person opens the full employment timeline with NID match status and both assignment details.

Keep simultaneous active assignments in a separate alert list. A missing or invalid NID displays Identity unavailable. Do not automatically mark such records as verified switches. Mask NID in general tables; reveal it only when the user has permission. Do not place a full NID in URL query parameters, analytics events or browser logs.

9 Employee directory and common behavior

Directory scope and controls

Employee Directory contains every employment record from the three agencies, including active and former employees. Default Status to All. Include agency, reporting period, Region, Area, Territory, Office or Sales Point, Category, Type, department, designation and status filters. Provide separate joining date and resignation date range filters.

Search by name, employee ID or login ID, and offer a dedicated NID lookup. Organization pages may open the directory with an agency already selected. Display that scope clearly. The directory uses the employee columns and profile behavior specified on page 4.

Identity and assignment views

Default to Assignment view: one row per employment assignment, with agency and employee ID visible. Offer Person history view to group assignments linked to one NID. Display both matching assignment count and unique matched person count when available. Missing NIDs remain separate unidentified records.

Date and filter semantics

On a dashboard or metric list, period means the selected reporting interval; active means active at interval end. In the full directory, period selects assignments overlapping that interval, including those that left during it. Joining date and resignation date ranges add separate conditions. Show the interpretation next to the period selector.

Shared interaction requirements

Search, filtering, sorting and pagination must operate across the full result set. Reset to page 1 after a search or filter change. Show total results and page size controls.

Sort by employee name, employee ID, joining date or resignation date. Retain filters when opening and closing profiles, moving between pages and returning with browser Back.

Provide Export CSV for the complete filtered result set, with organization and period in the filename. Export personal identifiers only according to permission; mask NID by default.

Loading states use skeletons for cards and tables. Empty states describe the current filters and provide Clear filters. Errors provide Retry and do not display stale values as current results.

For partial agency failures, identify the unavailable agency and mark combined totals as incomplete. Display the last successful data update time and reporting timezone.

Responsive and accessible layout

Keep the sidebar fixed on desktop and collapsible on smaller screens. KPI cards wrap into fewer columns. Filters stack into readable controls. Wide tables scroll horizontally and keep identity columns easy to find. Use labeled form controls, visible keyboard focus, accessible dialogs and text alongside status colors. Return focus to the originating control when a drawer closes.

10 Frontend implementation handoff

Suggested frontend structure

Use React with TypeScript or the project’s established frontend stack. Keep screens, reusable controls and data adapters separate. Develop with fixtures covering three agencies, historical joins and exits, valid NID matches, missing NIDs and overlapping assignments. Mark fixture values as demo until live data is connected.

Area

Components or frontend responsibility

Application shell

LoginPage, AuthGuard, AppLayout, Sidebar and Breadcrumbs.

Dashboard screens

OverviewPage, OrganizationPage, KpiCard and OrganizationCard.

Workforce exploration

FilterBar, AppliedFilters, LocationExplorer and MonthlyMovementTable.

People and history

EmployeeTable, EmployeeProfile, EmploymentTimeline and DirectoryPage.

Analytics

MovementChart, AttritionTrend, CohortRetention and TerritoryHeatmap.

Switch tracking

AgencySwitchPage, NidSearch, SwitchMatrix and OverlapAlertList.

Shared states

LoadingSkeleton, EmptyState, ErrorState, pagination and filtered export.

State and data handling

Maintain one shared filter model: organization, reporting period, region, area, territory, office, category, type, department, designation and status. Keep metric context, list mode, search, sorting and pagination explicit. Use a separate switch model for previous agency, new agency, location side and gap range.

Represent NID, employee ID and login ID as strings. Use distinct person and employment assignment references. Preserve effective dates for historical location and agency context. Synchronize non sensitive filter values with the URL so refresh and Back restore the view; keep full NID out of the URL and persistent browser storage.

Use a single data adapter for supplied organization, employee, movement and summary objects. Cancel or ignore outdated requests when filters change quickly. Consume the same scoped counts for cards and their employee lists. The UI displays authoritative metrics and NID matches rather than deciding identity matches in the browser.

Completion criteria

The frontend is ready when each flow below works with consistent data and filters.

Login opens the combined dashboard with four required KPIs and three organization cards.

An organization card opens its own totals and preserves the reporting month.

Region, Area, Territory, Category and Type jointly update metrics and matching names.

Monthly joiners and leavers open the correct people, dates and employment statuses.

NID lookup shows previous and new agencies, both employee IDs, exit and join dates, and gap or overlap days.

Directory shows active and former assignments; filtered export, profiles, Back navigation and empty or error states work.






