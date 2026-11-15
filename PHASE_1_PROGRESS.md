# Phase 1 — Admin Dashboard Progress

## Scope
Implement the approved Premium Dark interface (Black / Gold / Navy) for the existing Admin application while preserving current authentication and product/catalog API contracts. All work remains on feature branches and Preview deployments only.

## Sub-phase status

| Sub-phase | Scope | Status |
| --- | --- | --- |
| 1.1 | Dashboard layout and navigation | Implemented; code checks passed |
| 1.2 | Desktop, tablet, and mobile responsive layout | Implemented and deployed to Preview; authenticated visual QA at all breakpoints remains pending |
| 1.3 | Existing Products and Catalogs UI/API integration audit | UI/API clients preserved; Preview HMAC configured on both branches; live data integration blocked by missing isolated MongoDB Preview URI |
| 1.4 | Login, session, CSRF, and error-state review | Existing auth model preserved; tests passed; Preview auth configured; user confirmed successful Admin login |
| 1.5 | Preview QA and Phase 1 closeout | Both latest Preview deployments are READY; database-backed integration, runtime read-only checks, browser QA, and final closeout remain open |

## Admin branch
Branch: `feature/phase-1-admin-dashboard`
Latest deployed commit: `483e502f418bb8c35ccce0e5e4219777df19c870`
Latest Preview deployment: `mental-gaming-admin-lnu1xz40c-mycase.vercel.app` — READY.

Implemented:
- Premium dark dashboard shell with desktop sidebar and responsive top bar.
- Tablet navigation drawer.
- Mobile bottom navigation and More drawer.
- Dashboard welcome/status panels and links to existing Products and Catalogs pages.
- Dark, gold, and navy design tokens; responsive and safe-area spacing.
- Login, authentication status, and error fallback visual updates.
- Fail-closed Preview Store API origin policy; Preview cannot silently fall back to Production.
- Existing Products/Catalogs components and API clients retained.

## API Preview safety branch
Repository: `mycasecaseaccessories-wq/Mental-Gaming-Bot`
Branch: `feature/phase1-admin-preview-readonly-api`
Latest commit: `b3ed7ea24275a9c0060ff8b96dee535d125aafe0`
Latest Preview deployment: `mental-gaming-4d7z677yl-mycase.vercel.app` — READY.
Branch alias: `mental-gaming-api-git-feature-phase1-admin-previe-f29ad7-mycase.vercel.app`.

The API HMAC route policy is restricted to approved GET-only product/catalog reads and allowlisted read-only portal routes. Product POST/PATCH, catalog mutations, media upload, other unsupported routes, and unsupported query parameters are rejected by the policy. Unit tests were added for these allow/deny cases. The latest deployment's Vercel build is READY; the API unit test command has not yet been independently executed in this workflow.

## Preview environment isolation
- A newly generated HMAC secret is configured as sensitive, Preview-only environment variables on both matching feature branches. The values are not displayed or copied into documentation.
- Admin `MG_PRODUCT_API_ORIGIN` is configured for the matching read-only API Preview branch alias.
- API Preview environment metadata currently shows only the Preview-branch `MG_PRODUCT_API_SECRET`; it does not show a `MONGODB_URI` variable.
- The Admin Preview branch has its own Preview-only auth configuration. User confirmed successful Admin login.
- Production environment variables and Production deployment were not changed.
- No signed product request or database write has been sent.

## Verification evidence
- Admin: `pnpm check` passed.
- Admin: `pnpm test` passed — 21 tests across 3 files, including Preview origin isolation.
- Admin: `pnpm build` passed; Vite transformed 1,693 modules.
- Admin Preview auth CSRF endpoint returned HTTP 200 after Preview-only auth environment targets were corrected.
- User confirmed the Admin login test completed successfully.
- Latest Admin and API Preview deployments both report Vercel state `READY`.
- API Preview branch now has a dedicated GET-only HMAC route policy and route allow/deny tests. The test script includes the new test file; test execution remains unverified.
- The API source uses MongoDB native driver and requires `MONGODB_URI`. The API Preview branch currently has no visible `MONGODB_URI` environment variable. No isolated Preview database connection has been verified.
- No Production database, Production HMAC secret, or MY CASE project was changed.

## Blocking items before Phase 1 can be marked complete
1. Provision a separate non-production MongoDB Atlas database/cluster and obtain its connection URI. This workspace has no MongoDB Atlas provisioning connector. Do not reuse Production URI or Production data.
2. Add that URI as `MONGODB_URI` to the API Preview environment for `feature/phase1-admin-preview-readonly-api` only.
3. Verify safe API database connectivity and signed GET-only Product/Catalog requests against Preview. Do not send POST/PATCH/DELETE or other writes.
4. Complete authenticated visual browser QA on desktop, tablet, and mobile.
5. Run final Admin/API test and build checks, then update the closeout evidence.

## Next steps
- Continue on the two feature branches and Preview deployments only.
- Wait for the isolated MongoDB Preview URI before attempting database-backed integration.
- Keep Preview API origin bound to the read-only API Preview alias; never fall back to Production.
- Do not merge, open a production release, or deploy to Production without explicit user approval.
- Do not modify the separate MY CASE project.
