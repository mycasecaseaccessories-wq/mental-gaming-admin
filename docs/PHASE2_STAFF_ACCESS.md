# Admin Staff Access — Phase 2

## Scope

This module connects Admin A to the separate `mental-gaming-admin` Supabase project. It does not change the customer Store API, MongoDB records, storefront, Telegram bot, or MY CASE Supabase project.

- Staff roster and role assignments live in `private.admin_staff_accounts`.
- Role definitions and permission mappings remain in `private.admin_roles`, `private.admin_permissions`, and `private.role_permissions`.
- Admin staff activity is written to `private.admin_staff_activity_logs`.
- The existing `private.admin_activity_logs` and auth-user-linked tables are left unchanged.
- Public RPC wrappers are executable only by `service_role`; `anon`, `authenticated`, and `PUBLIC` are explicitly revoked.
- RPC functions use a fixed `search_path` and access only the private schema.
- Server routes verify the existing Admin A signed session. Mutating requests additionally require the existing CSRF token.
- The Supabase service key is read only by server-side code. It is never sent to the browser.

## Required protected environment variables

Set these only on the Admin A Vercel project after reviewing the preview configuration:

- `MG_ADMIN_SUPABASE_URL=https://ikkleniqmhfvdlwvwnbe.supabase.co`
- `MG_ADMIN_SUPABASE_SERVICE_ROLE_KEY=<service role secret for the new Admin Supabase project>`

Do not use the MY CASE project URL/key. Do not put the key in a `NEXT_PUBLIC_*` or Vite client variable. Do not commit secrets to Git.

If either variable is missing or invalid, staff/roles/audit routes fail closed with HTTP 503. No fallback to another Supabase project is attempted.

## Bootstrap and current login limitation

The first authenticated Admin A session calls `mg_admin_bootstrap_super_admin`. If there is no active super-admin yet, the configured Admin A email is registered as the initial super-admin. This uses the existing `MG_ADMIN_EMAIL` session identity and does not create a Supabase Auth user.

The configured primary Admin A Email/Password login remains unchanged. Staff accounts use the same login screen but authenticate against a per-staff scrypt password hash and unique random salt stored in the private Admin Supabase table. A super admin sets or resets a staff password from the Staff form; password length is 12–128 characters and plaintext is never stored. New roster entries remain `pending_auth` until a password is set. No Supabase Auth user or Telegram identity is created. Staff sessions are checked against the current database account and role on `/me` and every protected API request, so disabling an account or changing its role takes effect immediately. Staff login attempts use durable IP and account-keyed throttling in Admin Supabase as well as the in-process limiter. There is no email invitation or self-service password reset yet.

## Available endpoints

All endpoints require the existing Admin A session:

- `GET /api/admin/access/staff` — requires `staff.manage`
- `GET /api/admin/access/roles` — requires `roles.manage`
- `GET /api/admin/access/activity?limit=150` — requires `audit.view`
- `GET /api/admin/access/settings` — requires `settings.view`; returns only allowlisted, non-secret Admin settings metadata
- `POST /api/admin/access/staff/:email/password` — requires `staff.manage` and CSRF; super-admin-only password provisioning
- `POST /api/admin/access/staff` — requires `staff.manage` and CSRF
- `POST /api/admin/access/roles/:roleKey` — requires `roles.manage` and CSRF; updates permissions for non-super-admin roles only.

The UI provides staff roster maintenance and password provisioning, editable permissions for admin/manager/staff/viewer roles, a protected read-only super-admin permission set, activity log viewing, safe system settings, read-only wallet overview, read-only analytics, and read-only payment gateway status. Role and staff password changes are written with their audit record in the same database transaction.

## Safety boundaries

- No financial write controls are introduced. Wallet balances, top-up queue, transactions, analytics and payment gateway status are read-only.
- Product/catalog mutations retain their existing APIs and now require the relevant server-checked role permission.
- No Store API or MongoDB business records are written.
- The last active super-admin cannot be disabled or demoted.
- The current super-admin cannot disable or demote their own account.
- Staff changes and role assignments are written with an audit record in the same database transaction.
- No environment variables are changed by this code commit; deployment configuration remains a separate controlled step.
