# Redesign status

## Done
- Backend: shared vocabulary + normalisers, new personas, regional pricing ($5 / $9 default, env-overridable), recruiter auth (password + Google), recruiter API, talent evidence model v1.1, evidence board, score anatomy on roast responses.
- **AI-roast quota (new):** Free 3 / calendar month, Pro Roaster 30 / billing cycle, Historian 200 / billing cycle (fair use). When used up the roast falls back to the rules engine (no hard block); API returns `quota` with `remaining` and `resetsAt`. The existing 1-roast/day limit for free users stays as the abuse guard. Change limits with QUOTA_OVERRIDES_JSON.
- **Collaboration signal (new):** public PRs + reviews (last 12 months, via GitHub GraphQL, public repositories only) + breadth of other people's repos. Fewer than 3 events = "insufficient evidence", never a low score. Works for roasts made after this release (older roasts show "insufficient").
- Frontend: tokens + primitives, fonts, SiteHeader/Footer/MobileTabBar, toast system on the customizable-toast-notification package (^3.15.0), Home, Auth, Recruiter (6 screens), Roast result, Dashboard (shows AI allowance), Wall of Shame, Pricing, regional ProModal/PaymentFlow.

## Phase 2 (done)
Repo roast (+ AnalyzingScreen, RepoRoastCard), Battles (entry, loading, result card), History (+ chart, monthly comparison, cards), Universe entry, About (new #methodology and #privacy sections), Contact, 404 / error / loading / payment redirect, shared modal color fixes. Fixed a latent bug: RoastReactions used reactToRoast/reactToBattle without importing them.

## Still in the legacy dark scope (by design)
`/universe/[username]` (immersive WebGL page, has its own HUD) and any route not listed in `components/ThemeScope.jsx`. Restyle later if you want it in the light system.

## Known limits
- Quota is counted from saved AI roasts (source of truth); two simultaneous requests can exceed the limit by one. Repo-roast AI is still Pro-only and not counted.
- Package gaps vs design: mobile max 2 visible and queue cap 5 are not controllable; status icons not available.
- GITHUB_TOKEN (or the user's token) is required for the collaboration signal.
