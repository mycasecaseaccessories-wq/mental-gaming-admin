# Phase 2 — Preview Acceptance Checklist

This checklist is for a controlled **Preview-only** verification. It is not authorization to merge or deploy to Production.

## Preview environment

Configure these variables on the Admin A Vercel Preview environment only. Do not place secrets in the browser or GitHub:

- `MG_ADMIN_EMAIL`
- `MG_ADMIN_PASSWORD`
- `MG_ADMIN_SESSION_SECRET`
- `MG_PRODUCT_API_ORIGIN` — the matching Store API Preview origin
- `MG_PRODUCT_API_SECRET` — must match the Store API Preview secret
- `MG_ADMIN_SUPABASE_URL=https://ikkleniqmhfvdlwvwnbe.supabase.co`
- `MG_ADMIN_SUPABASE_SERVICE_ROLE_KEY` — service-role secret for the separate Admin Supabase project only

Do not use the MY CASE Supabase project. Never set the Admin Supabase service key in a Vite/client-prefixed variable. Keep Production values unchanged.

## Authentication and access

- [ ] Confirm the existing configured owner Email/Password login still works.
- [ ] As the owner, create a staff account with a unique email and one of `admin`, `manager`, `staff`, or `viewer`.
- [ ] Set a staff password of at least 12 characters.
- [ ] Confirm staff can sign in from the same login page.
- [ ] Confirm an incorrect password returns the generic login error.
- [ ] Confirm suspended staff cannot sign in.
- [ ] Confirm repeated staff login failures are rate-limited.
- [ ] Confirm a staff role change is reflected on the next API request.
- [ ] Confirm disabling a staff account invalidates its next protected request.
- [ ] Confirm `staff.manage` and `roles.manage` cannot be granted to non-super-admin roles.
- [ ] Confirm the configured owner remains protected from demotion or self-disable.

## Modules

- [ ] Dashboard summary loads and displays its live/unavailable state accurately.
- [ ] Orders and Customers lists load with filters/search and pagination.
- [ ] Products and Catalogs workflows still work for permitted roles.
- [ ] Wallet, Transactions and Pending Top-ups are read-only.
- [ ] Analytics period filters work and show Myanmar timezone.
- [ ] Analytics labels revenue/refund summaries as operational data, not audited profit.
- [ ] Payment Gateway status is read-only; missing configuration is labelled as a default rather than confirmed Online.
- [ ] Safe System Settings show only the allowlisted metadata.
- [ ] Staff, Roles and Activity Logs are visible only to roles with the corresponding permissions.
- [ ] Direct navigation to every protected route respects the same permissions as the sidebar.

## Safety and rollback

- [ ] No approve/reject top-up, wallet credit/debit, refund or order mutation controls are exposed.
- [ ] No MY CASE project or production customer/wallet/order/transaction data was modified.
- [ ] No Production environment variables were changed.
- [ ] No PR is merged and no Production deployment is triggered as part of this checklist.

If a check fails, keep the Preview isolated, fix the issue on the draft branch, and rerun CI before considering a release.