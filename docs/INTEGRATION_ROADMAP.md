# Mental Gaming Admin — Integration Roadmap & Audit

Audit baseline: source archives supplied on 2026-11-01, plus GitHub repository metadata and README/package inspection. This document records source-level findings only; it does not claim a live production deployment or live database state was verified.

## Architecture decisions (preserve)

- Admin A (`mental-gaming-admin`) is the single main web admin.
- Keep the current dedicated Email + Password login. Do not replace it with Supabase Auth as part of this phase.
- Telegram Login is a future additional login method; it must resolve to the same server-side staff identity and permission checks.
- MongoDB in the existing Store API remains the source of truth for customers, wallets, deposits/top-ups, orders, transactions, products and operational bot data.
- The new Supabase project `mental-gaming-admin` is for admin-side identities/profiles, roles, permissions, audit events, settings, notifications and announcements only.
- Do not dual-write the same business entity to MongoDB and Supabase. Do not migrate or mutate financial/order data in this integration project.
- Do not touch the separate MY CASE Supabase project.

## Current source-level status

| Area | Observed in supplied source | Status |
|---|---|---|
| Admin authentication | Email/password, scrypt verification, timing-safe comparison, signed session cookie, CSRF and cross-site checks, login rate limit | Existing; preserve and regression-test |
| Admin product/catalog UI | Product CRUD proxy, catalog/subcatalog views, image upload | Existing |
| Admin dashboard | Dashboard route exists, but orders/users data are not connected | Partial |
| Orders, users, wallet, transactions | Not integrated into Admin A UI | Not started |
| Payment/top-up verification | Not integrated into Admin A UI | Not started |
| Staff, roles, permissions, audit | Supabase private schema and role/permission seeds exist; no Admin UI/auth integration | Backend foundation only |
| Store API | HMAC-protected admin-portal product/catalog/media endpoints; MongoDB-backed | Existing; replay protection hardened in PR #24 |
| Telegram customer auth | Telegram Login Widget / WebApp init-data verification in customer storefront/API | Existing for customers; not yet Admin Login |
| Legacy storefront admin | Admin routes/pages exist in Store monorepo and use Telegram auth + admin auth | Keep until Admin A parity is tested |
| Deployment | Admin A, Storefront and API preview deployments reached READY; API preview emitted `skip-api-build`; API bundle was separately compiled in an isolated sandbox | Preview only; API runtime/build configuration still needs verification |

## Phase 1 implementation snapshot — 2026-11-02

### Admin-side Supabase foundation

The separate Tokyo project `mental-gaming-admin` (`ikkleniqmhfvdlwvwnbe`) is active. Its `private` schema contains:

- `staff_profiles`
- `admin_roles`
- `admin_permissions`
- `role_permissions`
- `user_roles`
- `admin_activity_logs`
- `system_settings`
- `admin_notifications`
- `admin_announcements`

The roles `super_admin`, `admin`, `manager`, `staff` and `viewer` and the initial permission matrix are seeded. RLS is enabled on all nine tables; direct client roles have no schema/table access and the service role is the intended server-side access path.

Supabase Auth has **not** been integrated into Admin A. Keep the existing Email + Password login; do not create users manually or replace the current login as part of Phase 1.

### Store API security baseline

Draft PR #24 consolidates the Phase 1 API security work:

- MongoDB-backed atomic nonce claims replace the process-local HMAC replay Map.
- Replays return HTTP 409; unavailable nonce storage fails closed with HTTP 503.
- MongoDB connection initialization caches the in-flight promise.
- Four API tests cover concurrent duplicate claims, unexpired replay rejection, expired nonce reuse and storage failure.
- Production dependency audit now reports no known vulnerabilities.

GitHub Actions run #127 passed frozen-lockfile install, formatting, TypeScript typecheck, bot tests, API security tests (4/4), full workspace build and production dependency audit. The VPS deployment job was skipped; no production deployment occurred.

### Admin A preview isolation

The Admin A product proxy previously had a hard-coded Storefront production origin. Draft PR #1 now adds `MG_PRODUCT_API_ORIGIN` and fails closed when the origin is not explicitly configured outside Vercel Production. Production retains the existing Storefront default; Preview and local development require an explicit API origin.

No Vercel environment variable was changed. Before using Admin A Preview for product/catalog testing, set its Preview-only `MG_PRODUCT_API_ORIGIN` to the matching Store API preview branch alias and verify that the HMAC secret matches. Until then, the preview product proxy returns HTTP 503 instead of silently writing to production. The latest isolated Node 24 check passed frozen-lockfile install, TypeScript check, all 25 Vitest tests and the Vite production build. The configured origin is accepted only as an HTTPS origin URL (no credentials, path, query or fragment).

### Preview verification limits

The Admin A preview deployment reached READY for the Admin roadmap branch. Storefront and API preview deployments also reached READY for the consolidated security branch. The API project's Vercel build emitted `skip-api-build`, so READY does not prove that Vercel compiled or executed the API bundle. The serverless bundle is now compiled by GitHub CI run #131 and passed. A safe API runtime smoke test and review of the API project's Vercel build/ignore configuration remain open.

### Phase 1 status — source audit and security baseline complete

<badge label="Complete" color="success" />

The source-level integration audit and code-level security baseline are complete in draft PRs #1, #22 and #24.

- [x] Map Admin A proxies to Store API HMAC portal routes and document the current feature-parity matrix.
- [x] Document MongoDB business-data ownership and the no-dual-write boundary with the separate Supabase admin project.
- [x] Trace Telegram customer login and legacy Telegram admin authentication at source level.
- [x] Review Admin A session/CSRF, HMAC signing, replay protection, rate limits, CORS and secret handling.
- [x] Replace the process-local HMAC nonce Map with atomic MongoDB-backed claims; unit and cross-client MongoDB integration tests pass in CI run #142.
- [x] Clear the production dependency audit; run #142 reports no known vulnerabilities.
- [x] Add Admin A Preview isolation: Preview/local require an explicit HTTPS Store API origin and fail closed with HTTP 503 otherwise.
- [x] Map legacy financial write-path risks and document the transaction/idempotency requirements; no financial write behavior was changed.

### Environment-level gates before production (Phase 5)

- [ ] Review the API Vercel project's `skip-api-build` configuration and verify a protected-preview runtime smoke test. The serverless bundle and production-mode `/api/healthz` smoke test pass in CI run #142, but that does not prove the Vercel API project executes the bundle.
- [ ] Configure the Admin A Preview-only `MG_PRODUCT_API_ORIGIN` to the matching Store API preview alias and verify HMAC secret equality without exposing values. No Vercel environment variables have been changed; Preview currently fails closed.
- [ ] Run order/payment/top-up/wallet/notification flows against isolated test data. No production customer, wallet, order or transaction data has been used.
- [ ] Preserve MY CASE project and production data; no production deployment or financial-data migration is authorized by these draft PRs.

## Phase 1 — System Integration Audit (source/CI baseline complete)

### Required work
1. Map Admin A `/api/admin/*` proxies to Store API `/api/store/admin-portal/*` routes.
2. Verify Store API connection and MongoDB model ownership for users, wallets, deposits, orders, transactions, products and payment methods.
3. Trace storefront Telegram login → API middleware → user identity.
4. Review Admin session, CSRF, HMAC signing, nonce replay protection, rate limits, CORS and secret handling.
5. Trace order creation, payment submission, manual verification, wallet credit and notifications end-to-end.
6. Add contract/integration tests before changing financial workflows.

### Completed security follow-up
The in-memory nonce Map has been replaced in draft PR #24 by atomic MongoDB-backed nonce claims with expired-record replacement and fail-closed behavior. Four unit tests and two isolated MongoDB cross-client integration tests pass in CI run #142. Production dependency audit is clean. Admin A Preview no longer falls back to the production Store API origin when `VERCEL_ENV` is not production.

## Phase 2 — Admin UI/UX and back-office modules

Build into the existing Admin A app, not a second admin product:
- Dashboard: live order/user/wallet/top-up KPIs with explicit loading/error/empty states.
- Product/category: preserve current product and catalog workflows.
- Orders: searchable, paginated list; detail; safe status transitions with audit trail.
- Payment verification: pending queue, proof/details, reviewer identity, approve/reject with idempotency and audit record.
- Users/wallet: read-only visibility first; any balance adjustment must require explicit permission, reason, confirmation and immutable audit log.
- Staff/roles: use the Supabase private schema; least-privilege permissions.
- Responsive desktop/mobile layouts and accessible loading/error states.

## Phase 3 — Customer storefront

The customer storefront already contains home/shop, product detail, checkout/orders, wallet/top-up, profile/settings, address book, FAQ, reviews, referrals/rewards, check-in, spin wheel, support and notifications in the supplied source.

Work should focus on end-to-end validation and targeted UX fixes, not an unnecessary rewrite:
- Homepage/shop and product details
- Cart/checkout and order confirmation
- Order tracking
- Wallet/top-up journey
- Mobile navigation, forms and checkout
- Error/retry states and API contract tests

## Phase 4 — Telegram Bot Integration

- Customer order/payment notifications
- Admin notifications for new orders and pending payment reviews
- Manual payment verification workflow
- Auto unit credit only after authoritative successful verification
- Order status updates
- Idempotency keys and duplicate-event protection
- Notification retries/dead-letter handling and delivery logs

Telegram must not become a second source of truth for balances or orders. Bot actions must call the authoritative Store API.

## Phase 5 — Production Testing and release gates

- Security: authorization matrix, IDOR/BOLA, CSRF, HMAC signature/timestamp/nonce, rate limits, secret leakage, audit integrity.
- API: contract tests, pagination, validation, idempotency, failure/retry.
- Mobile: iOS/Android viewport and real-device flows.
- Payments: pending → verified/rejected → wallet/order effect; duplicate callback/retry; failure rollback.
- Deployment: Vercel project/domain/build/env-name audit; health checks; smoke tests; rollback plan.
- Production rollout only after owner approval and verified backups.

## Safe implementation order

1. Finish source/API mapping and deployment access verification.
2. Add Admin A staff identity/role/permission enforcement while retaining Email + Password.
3. Connect read-only dashboard data and orders/users views.
4. Add payment review actions with idempotency + audit.
5. Add Telegram admin notifications and then future Telegram Admin Login.
6. Complete storefront regression and production release checks.

## Explicit non-goals until separately approved

- No production database migration or deletion.
- No wallet/balance/order mutation during audit.
- No disabling legacy storefront admin before Admin A feature parity.
- No repository visibility changes.
- No Vercel production deployment or environment-secret changes without deployment access and explicit release approval.
