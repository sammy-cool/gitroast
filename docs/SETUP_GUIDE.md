# GitRoast redesign — setup guide (Windows 10, step by step)

Files you received (all in the download list):
1. `gitroast-redesign-phase1-files.zip`  — every new/changed file, already in the right folders (client/…, server/…, shared/…, docs/…)
2. `DELETE-these-files.txt`              — 7 old files to delete
3. `gitroast-redesign-phase1.patch`      — same changes as one git patch (alternative to the zip)
4. `SETUP_GUIDE.md` (this), `DESIGN_SYSTEM.md`, `REDESIGN_STATUS.md`

## A. Apply (use EITHER 1 OR 2)
### Option 1 — zip (simplest)
1. Close the dev servers. Make a backup branch: `git checkout -b backup/before-redesign && git checkout -`
2. Make a new branch: `git checkout -b feat/redesign-phase1`
3. Unzip `gitroast-redesign-phase1-files.zip` INTO your repo root (the folder that contains `client/`, `server/`, `shared/`). Choose "Replace the files in the destination".
4. Delete the 7 files listed in `DELETE-these-files.txt` (paths are relative to repo root).
5. If you edited any of these files yourself since exporting the repo (e.g. your $5/$9 price edit in `server/services/paymentService.js`), re-check them with `git diff` — the zip overwrites them. Prices are now set by default to $5 / $9 and can be changed via env (see C).

### Option 2 — patch
```
git checkout -b feat/redesign-phase1
git apply --whitespace=nowarn gitroast-redesign-phase1.patch
```
If it reports conflicts, use Option 1.

## B. Install and run
```
cd client && npm install        # installs customizable-toast-notification ^3.15.0 (all 3.x updates, lockfile pins exact)
cd ../server && npm install
```
Run server (`npm run dev` in server/) and client (`npm run dev` in client/).

Checks to run (each should pass):
```
cd client && npm run build
cd client && node --test src/utils/__tests__/toastOptions.test.js src/utils/__tests__/vocabSync.test.js src/utils/__tests__/toastPackageContract.test.js
cd server && npm test
```
If anything fails, paste the first error here and I will fix it.

## C. Environment variables
Server `.env`:  GOOGLE_CLIENT_ID=…   (optional) PRICING_OVERRIDES_JSON={"USD":{"roaster":500,"historian":900}}   (amounts in cents/paise)   (optional) QUOTA_OVERRIDES_JSON={"free":3,"roaster":30,"historian":200}
Server needs GITHUB_TOKEN (already used) for the collaboration signal (GraphQL).
Client `.env.local`: NEXT_PUBLIC_GOOGLE_CLIENT_ID=… (same value as server)

Google: Cloud Console → APIs & Services → Credentials → OAuth client ID (Web) → add your Vercel domain + http://localhost:3000 to "Authorized JavaScript origins". No redirect URI needed (Google Identity button).
Razorpay: enable International Payments in the dashboard before non-INR checkout.

## D. Manual smoke test (5 minutes)
Also: log in with GitHub, roast 4 profiles over time — the first 3 are AI roasts, after that it falls back to rules and shows an "AI roasts used up" toast (free users are also limited to 1 roast/day).

Home → roast a user → result page → Add badge / Download card → /pricing (prices show in your currency) → /auth?role=recruiter (sign up with email) → /recruiter (search shows only people already roasted) → /dashboard (GitHub login) → /leaderboard.
