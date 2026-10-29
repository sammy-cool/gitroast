# Redesign status

## Done
- Backend: shared vocabulary + normalisers, new personas, regional pricing ($5 / $9 default, env-overridable), recruiter auth (password + Google), recruiter API, talent evidence model v1.1, evidence board, score anatomy on roast responses.
- **AI-roast quota (new):** Free 3 / calendar month, Pro Roaster 30 / billing cycle, Historian 200 / billing cycle (fair use). When used up the roast falls back to the rules engine (no hard block); API returns `quota` with `remaining` and `resetsAt`. The existing 1-roast/day limit for free users stays as the abuse guard. Change limits with QUOTA_OVERRIDES_JSON.
- **Collaboration signal (new):** public PRs + reviews (last 12 months, via GitHub GraphQL, public repositories only) + breadth of other people's repos. Fewer than 3 events = "insufficient evidence", never a low score. Works for roasts made after this release (older roasts show "insufficient").
- Frontend: tokens + primitives, fonts, SiteHeader/Footer/MobileTabBar, toast system on the customizable-toast-notification package (^3.15.0), Home, Auth, Recruiter (6 screens), Roast result, Dashboard (shows AI allowance), Wall of Shame, Pricing, regional ProModal/PaymentFlow.

## Phase 2 (done)
Repo roast (+ AnalyzingScreen, RepoRoastCard), Battles (entry, loading, result card), History (+ chart, monthly comparison, cards), Universe entry, About (new #methodology and #privacy sections), Contact, 404 / error / loading / payment redirect, shared modal color fixes. Fixed a latent bug: RoastReactions used reactToRoast/reactToBattle without importing them.

## Phase 3 (done)
- PWA / offline: service worker v2 (static cache-first, pages network-first with offline fallback, API never cached), `/offline` page showing the last saved roast, offline / back-online toasts, install prompt "with restraint" (only after a finished roast, at most once per 14 days, never when installed).
- Toast moments wired: Signed in, Session expired (auto-detected on a 401), You hit today's limit (with real reset time). Server daily-limit message corrected (it still promised "unlimited" Pro) and now returns `resetsAt` (next UTC midnight).
- Sign-in callback page restyled.

## Design audit pass (done)
Compared every Figma screen with the implementation and closed the gaps: roast result now shows the four evidence signals as metric cards; dashboard has the score-trend chart; recruiter profile has Notable public projects, Collaboration indicators and Growth signals (needs roasts made after this release for projects/collaboration); recruiter table becomes cards on mobile; Wall of Shame shows "Updated … ago"; home "System pulse" shows ingestion and scoring version. Also fixed: the stream route did not save collab data in the roast snapshot.

Toast status icons are now wired through the package's `icon` option (3.17+). Persona nicknames on the Wall of Shame and the MOMENTUM metric on the repository highlight are now implemented (nickname from the strongest public signal; momentum = commits in the last 13 weeks vs the prior 13, shown only when GitHub has the data).

## Phase 5 (done)
- Universe 3D page (`/universe/[username]`) restyled: HUD, inspector, ticker, loading and error states use the design tokens; emoji removed; reduced motion starts with orbit paused and planets frozen ("Motion off" is now a speed option); mobile layout moves the inspector to a bottom sheet. The WebGL scene itself is unchanged.
- Repository highlight card on the result page (best own, non-fork repo; quote is deterministic and built only from public facts) and History comparison (trend bars from your public roast history). New roasts only for the highlight; the comparison works for existing history.

## Phase 6 — hardening (done)
- Removed the temporary legacy dark scope (ThemeScope, three legacy Google fonts, legacy tokens): every route is on the design system, pages load fewer fonts.
- Brand: new `public/icon.svg` (ember square + flame), manifest colours/description aligned, robots.txt now blocks /auth, /recruiter, /offline and /api/.
- Shared GitHub input parsing (`utils/githubTarget.js`, tested) used by Home and Battles; invalid handles are rejected on the client before any request.
- Tests: client suite is 47/47 (updated the PWA manifest test to the new brand colours; added tests for target parsing, reset-time formatting, toast options, vocab sync). Server: updated the Roast default test (persona is now staff_engineer, intensity crispy) and added coverage that every persona the UI can send has a config and an offline fallback. Run `npm test` in server/ on your machine (it needs MongoDB drivers installed).

## Phase 7 — ship-readiness (done)
CI workflow (`.github/workflows/ci.yml`: import check, server tests, client tests, client build), README updated (intensity/persona vocabulary, regional pricing, AI quota, new env vars, new API endpoints, design system), `docs/DEPLOYMENT.md` (env, external setup, deploy order, smoke test, rollback), unused imports removed from changed files.

## Phase 10 — full audit (done)
Method: automated scans over every client and server file (legacy colours, emoji in UI copy, stale claims, undefined names, unused imports, hooks order, accessibility hygiene, contrast ratios), then manual fixes in every flagged file.
Fixed:
- **Security/privacy:** JSON-LD is now serialised safely (route params could break out of the script tag, 12 pages); Ghost Mode profiles no longer appear in the home "Live from the grill" feed or "Roast of the day"; recruiter profile lookup is exact-match; password length capped (128) before scrypt; `getHistory` escapes its regex.
- **Stale or wrong content:** Wrapped was hard-coded to 2025 (now current/last year, client and server, with a sync test); "unlimited roasts per day" claims removed from the Pro modal and checkout; SEO titles and descriptions moved to the new voice; About/README badge text updated.
- **Brand surfaces:** README badge (card + shield) redesigned and rendered/checked; social share images (`/api/og`, `/api/og-battle`) recoloured; Wrapped and Certificate recoloured and emoji removed; hydration loader redesigned; new favicon, apple-touch icon, PWA 192/512 + maskable icons and default share image (`og-default.png`) generated from the brand mark; manifest lists PNG icons (needed for install prompts).
- **Accessibility:** AA contrast (ink-2, ink-3, ember text, ember behind white text); focus outlines stay visible on dark surfaces; Pro, Checkout and Wrapped dialogs now have dialog semantics, Escape, focus trap and focus return (nested dialogs close one at a time); `global-error.jsx` added.
- **Cleanup:** four dead components removed (LeaderboardTable, CompanyLeaderboardTable, Pagination, GitHubLoginBtn); sitemap no longer lists the sign-in-gated dashboard; iOS status bar style matches the light theme.
Not verifiable here (needs a browser): the OG image routes' rendering, Wrapped/Certificate visuals, and modal focus behaviour. The toast theme cleanup is planned in `docs/TOAST_THEME_PLAN.md`.

## Phase 11 — gap closing (done)
Recruiter workspace now has the three Figma controls that were missing: **Evidence window** (6 / 12 / 24 months / any; server-side), **More filters · N** (language, minimum fit; badge shows how many are active) and **Explain ranking** (role weights and the "sparse evidence is excluded" rule). Server messages no longer carry emoji.

## Open items that need a decision (not built on purpose)
1. Recruiter accounts: no password reset, no email verification, no account deletion. Needed before real recruiters sign up.
2. Legal pages: no Privacy Policy, Terms or Refund/Cancellation page (Razorpay activation and Google OAuth consent screen ask for them). Footer "Privacy" currently points to the About page section.
3. Shortlists: "shared this week" in the design needs a sharing feature (invite a colleague in the same organization).
4. Recruiter approval: anyone can create a recruiter workspace today; decide between open, email-domain check, or manual approval.
5. No integration tests for the new API routes (need a Mongo test database, e.g. mongodb-memory-server).

## Known limits
- Quota is counted from saved AI roasts (source of truth); two simultaneous requests can exceed the limit by one. Repo-roast AI is still Pro-only and not counted.
- Toast package (>= 3.17): max visible (3 desktop / 2 mobile), queue cap (5), top-center, reduced motion and pause-on-hover are set through `setConfig`; status icons through `icon`.
- GITHUB_TOKEN (or the user's token) is required for the collaboration signal.
