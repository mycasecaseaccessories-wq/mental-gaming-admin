# Phase 1 — Admin Dashboard Progress

## Scope
Implement the approved Premium Dark Admin Dashboard (Black / Gold / Navy), preserve the existing authentication and Products/Catalogs contracts, and validate the integration on isolated Preview branches. No Production release is included in Phase 1 closeout.

## Sub-phase status

| Sub-phase | Scope | Status |
| --- | --- | --- |
| 1.1 | Dashboard layout and navigation | Implemented; Admin checks, tests, and build passed |
| 1.2 | Desktop, tablet, and mobile responsive layout | Implemented and deployed to Preview; authenticated visual QA at all breakpoints remains pending |
| 1.3 | Products/Catalogs integration and Preview API safety | Implemented; API route policy, MongoDB integration tests, bundle smoke tests, and dependency audit passed in CI |
| 1.4 | Login, session, CSRF, and error-state review | Existing auth model preserved; Preview CSRF returned HTTP 200; user confirmed successful Admin login |
| 1.5 | Preview QA and Phase 1 closeout | Admin/API Preview deployments READY; unauthenticated API guard and health endpoint verified; signed GET end-to-end runtime and browser QA remain pending |

## Admin branch
Repository: `mycasecaseaccessories-wq/mental-gaming-admin`
Branch: `feature/phase-1-admin-dashboard`
Latest commit: `b5f8131233ec9c15280d7102b6ee71857218149f`
Preview: https://mental-gaming-admin-c71dgh8qa-mycase.vercel.app — READY.
Draft PR: https://github.com/mycasecaseaccessories-wq/mental-gaming-admin/pull/3

Implemented:
- Premium dark dashboard shell with desktop sidebar and responsive top bar.
- Tablet navigation drawer.
- Mobile bottom navigation and More drawer.
- Dashboard welcome/status panels and links to existing Products and Catalogs pages.
- Dark, gold, and navy design tokens; responsive and safe-area spacing.
- Login, authentication status, and error fallback visual updates.
- Fail-closed Preview Store API origin policy; Preview cannot silently fall back to Production.
- Existing Products/Catalogs components and API clients retained.

Admin verification:
- `pnpm check` passed.
- `pnpm test` passed — 21 tests across 3 files.
- `pnpm build` passed.
- Preview Admin CSRF endpoint returned HTTP 200 after Preview auth environment targets were corrected.
- User confirmed successful Admin login.
- Responsive layout code is implemented; independent visual QA at desktop/tablet/mobile remains open.

## API Preview safety branch
Repository: `mycasecaseaccessories-wq/Mental-Gaming-Bot`
Branch: `feature/phase1-admin-preview-readonly-api`
Latest commit: `5cc34ebf1932d82418168e0b326f7852fbbe6230`
Preview: https://mental-gaming-81o8ekpvo-mycase.vercel.app — READY.
Stable Preview alias: `mental-gaming-api-git-feature-phase1-admin-previe-f29ad7-mycase.vercel.app`.
Draft PR: https://github.com/mycasecaseaccessories-wq/Mental-Gaming-Bot/pull/26

API safety behavior:
- HMAC authentication is required for Admin Portal API requests.
- Product and catalog collection reads and approved portal read-only endpoints are allowlisted.
- Product POST/PATCH, catalog mutation routes, media upload, unsupported routes, and unsupported query parameters are rejected.
- Replay protection uses MongoDB-backed nonce claims and fails closed when nonce persistence is unavailable.
- The Preview API origin is explicit; Admin Preview does not silently fall back to Production Store API.

## Preview environment isolation
- Admin `MG_PRODUCT_API_ORIGIN` points to the API Preview branch alias.
- Matching HMAC credentials are configured on the Admin and API Preview feature branches only. Secret values are not documented or exposed.
- API `MONGODB_URI` is configured for Preview only (global Preview target, not branch-restricted); it was previously set up by the user. No Production URI or Production target was changed.
- Admin Preview auth variables are configured for Preview; user confirmed successful login.
- Production environment variables and Production deployment were not changed.
- The API security tests and MongoDB integration tests use the isolated CI MongoDB service. No product/catalog mutation was made.

## Latest API CI verification
GitHub Actions run: https://github.com/mycasecaseaccessories-wq/Mental-Gaming-Bot/actions/runs/43697367869
Result: **success**.

Passed steps:
- Install dependencies (frozen lockfile)
- Formatting check
- Typecheck all TypeScript packages
- Bot tests
- API security tests
- API MongoDB integration tests
- Build all packages
- Build Vercel API serverless bundle
- Smoke test Vercel API bundle
- Production dependency audit

The dependency audit initially found vulnerable Mongoose versions in the Bot and Outline Bot workspaces. Both were upgraded to patched Mongoose `8.24.9`, the lockfile was updated, and the final production audit reported **No known vulnerabilities found**.

## Preview runtime checks
- Latest API Preview deployment for commit `5cc34ebf1932d82418168e0b326f7852fbbe6230` is Vercel `READY`.
- `/api/healthz` returned HTTP 200 with `{"status":"ok"}`.
- Unsigned GET requests to `/api/store/admin-portal/products?page=1` and `/api/store/admin-portal/catalogs` returned HTTP 401 Unauthorized, confirming the protected endpoints reject requests without HMAC credentials.
- A signed GET against the live Preview API has not yet been independently verified. CI has passed the route-policy, nonce-store, and MongoDB integration tests, but this does not replace the live signed-request check.
- Browser-based visual QA at desktop, tablet, and mobile sizes remains pending.

## Phase 1 closeout gates
1. Keep Admin and API on the isolated Preview branches until final verification.
2. Complete a signed GET-only Products and Catalogs request against the live API Preview and confirm it reads from the Preview MongoDB environment.
3. Complete authenticated visual QA at desktop, tablet, and mobile sizes.
4. Record final verification evidence and close Phase 1 Preview work.
5. Do not merge either Draft PR, deploy Production, or modify Production environment variables without explicit user approval.

## Safety boundary
- Production database, Production HMAC credentials, and Production deployment remain untouched.
- The separate MY CASE project remains untouched.
- No product/catalog writes, media uploads, or destructive operations were performed.
