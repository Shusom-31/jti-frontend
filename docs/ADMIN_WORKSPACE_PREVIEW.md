# Admin and workspace preview

## Frontend preview now available

- Open `/admin` directly to enter the admin console; there is no admin sign-in screen in this frontend preview. This URL is not an access-control boundary and must be protected by backend authentication before production.
- `/admin` has a sidebar with Overview, Organization sync and Account create.
- Organization sync loads the source-organization list. Admins add organizations to the lower sync table, then use each row's Sync button to sync only that organization. Re-sync updates that organization's saved preview data and counters instead of adding a duplicate.
- Each synced organization has an Active/Inactive switch. Only organizations on the sync list that have completed a sync and remain Active appear in workspace pages.
- Admins can create workspace-only email/password accounts without choosing organizations, then edit the account email or password later. Accounts are retained in this browser preview until its local storage is cleared.
- Admin-console entry is by URL in this frontend preview. Workspace account login remains separate, but the URL itself does not prevent access to the admin console.
- Every workspace account sees the same synced, Active organizations; inactive or unsynced organizations are hidden.
- Preview accounts, passwords (salted PBKDF2 hashes), organization status and sync counters are stored in this browser's local storage. Sync uses the existing fixture assignments, reports zero files, and never writes to a server or database. The admin page labels this as preview mode.
- Workspace Forgot password updates the saved local preview password directly and sends no recovery email. A production reset needs a verified email or administrator recovery flow.

## Backend work required for production

The project has no backend or database yet. The preview must be replaced by server-side authentication, authorization, sync jobs and persistence before real accounts or organization data are used. The server must enforce account roles and organization scope on every endpoint; hiding organizations in the browser is only a presentation rule.

Suggested API contract:

| Method and path | Purpose |
| --- | --- |
| `POST /auth/admin/login` | Authenticate an admin and return an admin session |
| `POST /auth/workspace/login` | Authenticate a workspace account and return its allowed organization IDs |
| `POST /auth/logout` | Revoke the current session |
| `GET /admin/organizations` | Return organization name, active state, sync status, record/file counts, and last sync |
| `PATCH /admin/organizations/:id` | Change organization active state |
| `GET /admin/source/organizations` | List organizations available from the source system |
| `POST /admin/organizations/:id/sync` | Sync or update only the selected organization and return a job ID |
| `GET /admin/sync-jobs/:jobId` | Return progress, synced employee records/files, and failures |
| `GET /admin/workspace-accounts` | List workspace accounts |
| `POST /admin/workspace-accounts` | Create a non-admin account with email and server-hashed password |
| `PATCH /admin/workspace-accounts/:id` | Update email, password, or account status |

Workspace data endpoints must derive allowed organization IDs from the authenticated account, not trust a client-supplied organization filter. Passwords must be hashed server-side and never returned to the browser. Production admin access also needs a real admin user provisioned by the backend; the preview credentials in this UI must be removed.

Still needed from the organization data owner: the source system or file/API format, credentials or OAuth method, database choice, and rules for identifying an employee and handling repeated syncs.
