# Deployment checklist (Vercel client + Render server)

## Before you deploy
1. `node scripts/verify-imports.js`  → must print OK
2. `cd server && npm test` and `cd client && npm test` and `cd client && npm run build`
3. CI (`.github/workflows/ci.yml`) is green on the branch.

## Environment variables
Server (Render): see README → Environment Variables. New in the redesign:
- `GOOGLE_CLIENT_ID` (recruiter Google sign-in; same value as the client one)
- `PRICING_OVERRIDES_JSON`, `QUOTA_OVERRIDES_JSON` (optional)
- `GITHUB_TOKEN` is required for the collaboration signal (GitHub GraphQL needs auth)
Client (Vercel): `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, plus the existing `NEXT_PUBLIC_*` values.

## One-time external setup
- Google Cloud Console → OAuth client (Web) → Authorized JavaScript origins: your Vercel domain(s) and `http://localhost:3000`.
- Razorpay → enable International Payments before selling in USD/EUR/GBP.
- Vercel: the `/api/geo` route reads `x-vercel-ip-country` (works on Vercel by default).

## Deploy order
1. Deploy the **server** first (new routes/models are additive; old clients keep working).
2. Deploy the **client**.
3. Mongo indexes are created automatically on first start (`roastedBy + roastSource + createdAt`, `googleId` sparse).

## Smoke test (production)
Home roast → result (anatomy, badge, download) → /pricing shows your currency → GitHub login → /dashboard (AI allowance) → /leaderboard → /battle → /history/<user> → /universe/<user> → /about#methodology → recruiter signup → /recruiter search and a profile → offline (DevTools) → /offline page.

## Rollback
Client: promote the previous Vercel deployment. Server: redeploy the previous Render commit. Data changes are additive, so rolling back does not require a data migration.
