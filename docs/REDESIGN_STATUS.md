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

Intentionally not done: status icons in toasts (the toast package has none), persona nickname per leaderboard row (not generated yet), MOMENTUM metric on the repository highlight (needs commit counts per repo; we show forks and last push instead).

## Phase 5 (done)
- Universe 3D page (`/universe/[username]`) restyled: HUD, inspector, ticker, loading and error states use the design tokens; emoji removed; reduced motion starts with orbit paused and planets frozen ("Motion off" is now a speed option); mobile layout moves the inspector to a bottom sheet. The WebGL scene itself is unchanged.
- Repository highlight card on the result page (best own, non-fork repo; quote is deterministic and built only from public facts) and History comparison (trend bars from your public roast history). New roasts only for the highlight; the comparison works for existing history.

## Phase 6 — hardening (done)
- Removed the temporary legacy dark scope (ThemeScope, three legacy Google fonts, legacy tokens): every route is on the design system, pages load fewer fonts.
- Brand: new `public/icon.svg` (ember square + flame), manifest colours/description aligned, robots.txt now blocks /auth, /recruiter, /offline and /api/.
- Shared GitHub input parsing (`utils/githubTarget.js`, tested) used by Home and Battles; invalid handles are rejected on the client before any request.
- Tests: client suite is 47/47 (updated the PWA manifest test to the new brand colours; added tests for target parsing, reset-time formatting, toast options, vocab sync). Server: updated the Roast default test (persona is now staff_engineer, intensity crispy) and added coverage that every persona the UI can send has a config and an offline fallback. Run `npm test` in server/ on your machine (it needs MongoDB drivers installed).

## Known limits
- Quota is counted from saved AI roasts (source of truth); two simultaneous requests can exceed the limit by one. Repo-roast AI is still Pro-only and not counted.
- Package gaps vs design: mobile max 2 visible and queue cap 5 are not controllable; status icons not available.
- GITHUB_TOKEN (or the user's token) is required for the collaboration signal.
