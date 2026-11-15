# Phase 1 — Admin Dashboard Progress

## Scope
Implement the approved Premium Dark interface (Black / Gold / Navy) for the existing Admin application while preserving the current authentication and product/catalog API contracts.

## Sub-phase status

| Sub-phase | Scope | Status |
| --- | --- | --- |
| 1.1 | Dashboard layout and navigation | Implemented; code checks passed |
| 1.2 | Desktop, tablet, and mobile responsive layout | Implemented; Preview deployed; authenticated visual browser QA still pending |
| 1.3 | Existing Products and Catalogs UI/API integration audit | Admin proxy contract tests pass; live Preview integration blocked by missing safe API credentials and isolated Preview data source |
| 1.4 | Login, session, CSRF, and error-state review | Existing auth model preserved; tests pass; Preview auth variables configured for Preview only; user confirmed successful Admin login |
| 1.5 | Preview QA and Phase 1 closeout | Build deployed successfully; API/data isolation and visual QA remain open; no production deployment |

## Changes on `feature/phase-1-admin-dashboard`
- Reworked the authenticated dashboard shell with a desktop sidebar, responsive top bar, mobile bottom navigation, and a mobile More drawer.
- Added a tablet navigation drawer and dedicated tablet breakpoint behavior.
- Added a dashboard welcome panel, truthful account/API status panels, and quick links to existing Products and Catalogs pages.
- Applied the approved dark, gold, and navy design tokens and responsive layout styles.
- Updated Login, authentication status, and error fallback accents to match the approved theme.
- Added a fail-closed Preview Store API origin policy: Preview deployments cannot silently fall back to the Production Store API; explicit origins must be HTTPS Vercel deployment hosts.
- Added safe-area spacing for mobile devices and compact-screen adjustments.

## Existing functionality intentionally preserved
- Existing allowlisted Admin login flow and session handling.
- Existing CSRF token flow and logout request.
- Existing Products and Catalogs page components and API clients.
- Existing API routes and production configuration.
- No destructive product operations, production database mutations, or production deployment.

## Verification evidence
- `pnpm check`: passed.
- `pnpm test`: 21 tests passed across 3 test files (admin auth, admin product proxy, and site tests), including Preview origin isolation checks.
- `pnpm build`: passed; Vite transformed 1,693 modules.
- Vercel Preview deployment for commit `024d8fa0ea645ffb05ff92890e8ceffc273ebbe2`: `READY`.
- Preview `/api/admin-auth/csrf` returned HTTP 200 after Preview-only auth environment targets were corrected.
- User confirmed the Admin login test completed successfully.
- API Preview alias `mental-gaming-api-git-work-phase2-admin-readonly-api-mycase.vercel.app` responds to the product portal GET route with HTTP 503: `Product service authentication is not configured`. No signed product request or data mutation was sent.
- Vercel environment metadata shows `MG_PRODUCT_API_SECRET` on the API project is Production-only; the Admin's `MG_PRODUCT_API_ORIGIN` is scoped to the separate `work/phase2-admin-ui` branch, not this Phase 1 branch.
- Source audit of API branch `work/phase2-admin-readonly-api` found that its HMAC allowlist still permits product POST/PATCH, catalog PATCH, and media POST. Therefore the branch name does not mean the product/catalog portal is read-only.
- API source connects through `MONGODB_URI`. The API Vercel project's visible environment metadata contains no `MONGODB_URI` entry, and no dedicated Preview database URI is configured. The API Preview must not be given a shared secret until a separate database exists.
- User approved creating a separate Preview database. The available connected tools do not provide MongoDB Atlas cluster/database provisioning, and the existing Supabase project is PostgreSQL (not a drop-in replacement for this API's MongoDB native-driver data layer). No incompatible database was substituted and no Production connection was changed.
- Created a separate API safety branch `feature/phase1-admin-preview-readonly-api` from `work/phase2-admin-readonly-api`. Its HMAC route allowlist now permits GET-only product/catalog reads and existing read-only portal routes; product creation/update, catalog update, and media upload are denied. Added unit tests for allowed read routes, rejected mutation routes, and query-parameter allowlists. The API branch has a successful Preview build for the initial read-only policy commit; later test commits triggered additional Preview deployments, with the latest commit deployment still queued at the last status check. The new API tests have not yet been executed in a repository build. No production deployment occurred.

## Blocking items before Phase 1 can be marked complete
1. Provision a genuinely isolated non-production MongoDB database/cluster and obtain its Preview-only connection URI. This must be done in the MongoDB Atlas account because no Atlas provisioning connector is available in this workspace. Do not reuse the Production database URI or production data connection.
2. Add the new Preview-only `MONGODB_URI` to the API Preview branch, pointing only to the isolated database. The API project currently has no visible `MONGODB_URI` environment variable.
3. Provide a dedicated Preview-only HMAC secret on both the matching Admin Preview and API Preview after the API branch and database isolation are verified. Do not copy or retarget the Production secret.
4. Align the Admin Preview branch with a matching deployment of `feature/phase1-admin-preview-readonly-api` and confirm the origin is not Production.
5. Complete authenticated browser QA at desktop, tablet, and mobile widths after the Preview runtime is safely configured. Product/catalog write-path QA remains deferred on this read-only branch.

## Next steps
- Keep all changes on the feature branch.
- Continue the Preview database provisioning handoff in MongoDB Atlas; do not substitute Supabase Postgres for the MongoDB data layer.
- Do not add Preview API secrets or enable Admin-to-API requests until Preview database isolation is proven.
- Keep the read-only API safety branch separate from the existing Phase 2 API branch; do not deploy or merge it until its database URI is configured and reviewed.
- Complete interactive browser QA and re-run the full verification workflow.
- Only after all five workflow gates pass, open the Phase 1 completion review. Do not merge or deploy to Production automatically.
