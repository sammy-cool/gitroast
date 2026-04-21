<div align="center">

# GITROAST 🔥

### Get your GitHub brutally roasted. Share the pain.

[![Live](https://img.shields.io/badge/Live-gitroast-FF4500?style=for-the-badge)](https://gitroast-dev.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge)](https://render.com)
[![MongoDB](https://img.shields.io/badge/DB-MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)

> AI-powered GitHub profile roast generator — analyzes your repos, commits, and coding habits to deliver a brutally funny roast. Built with a custom scoring engine, 3-tier intensity system, Pro tier monetization, and a viral sharing architecture.

</div>

---

## 📌 Table of Contents

- [What Is GitRoast](#-what-is-gitroast)
- [Live Demo](#-live-demo)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Scoring Engine](#-scoring-engine)
- [Intensity System](#-intensity-system)
- [Roast Battle](#-roast-battle)
- [Monetization](#-monetization)
- [Environment Variables](#-environment-variables)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Architecture Decisions](#-architecture-decisions)

---

## 🔥 What Is GitRoast

GitRoast analyzes any public GitHub profile and generates a personalized comedy roast based on real data — commit quality, abandoned repos, language choices, README existence, stars, and more.

Users can:

- Get roasted for free (rule-based engine)
- Upgrade to Pro for AI-powered roasts via Google Gemini 2.5 Flash
- Choose intensity: Mild 🌶 / Savage 🔥 / Nuclear ☢️ (Pro)
- Battle a friend's GitHub head-to-head
- Download a shareable PNG roast card
- View roast history and score trends over time
- Compete on the public Wall of Shame leaderboard

---

## 🌐 Live Demo

| Resource       | URL                                         |
| -------------- | ------------------------------------------- |
| Production App | https://gitroast-dev.vercel.app             |
| API Health     | https://gitroast-latest.onrender.com/health |
| Wall of Shame  | https://gitroast-dev.vercel.app/leaderboard |
| Battle Mode    | https://gitroast-dev.vercel.app/battle      |

---

## ✨ Features

### Core

- **GitHub Profile Analysis** — fetches repos, commits, languages, README, stars via GitHub API
- **Custom Scoring Engine** — 0–100 score across 8+ signals, letter grade (A–F)
- **Rule-Based Roast Engine** — intensity-aware tone banks (no AI cost for free users)
- **AI Roast Engine** — Google Gemini 2.5 Flash with intensity-tuned prompts (Pro only)
- **Roast History** — per-user history with SVG score chart and monthly comparison
- **Public Leaderboard** — Wall of Shame — most roasted profiles ranked globally

### Differentiators

- **3-Tier Intensity** — Mild / Savage / Nuclear changes AI temperature + comedian persona
- **Roast Battle** — head-to-head GitHub comparison with AI battle verdict
- **PNG Download** — html2canvas card capture; HD watermark-free for Pro
- **Twitter/X Share** — pre-filled tweet with roast snippet + link
- **Idempotency** — server-side deduplication via `X-Idempotency-Key` header

### Monetization

- **Razorpay** — INR payments supporting UPI, cards, netbanking, wallets
- **HMAC SHA256** — webhook signature verification
- **Pro Tier** — AI roasts, private repos, Nuclear intensity, HD card, unlimited roasts

---

## 🛠 Tech Stack

| Layer         | Technology                                   |
| ------------- | -------------------------------------------- |
| Frontend      | Next.js 16 App Router, styled-jsx, next/font |
| Backend       | Express.js, Node.js                          |
| Database      | MongoDB Atlas, Mongoose                      |
| AI            | Google Gemini 2.5 Flash                      |
| Auth          | GitHub OAuth, JWT                            |
| Payments      | Razorpay (INR)                               |
| Image Capture | html2canvas                                  |
| Deployment    | Vercel (frontend), Render Docker (backend)   |
| Domain        | Hostinger (registrar only)                   |

---

## 📁 Project Structure

```
gitroast/
├── client/                          # Next.js 16 App Router
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.jsx           # Root layout — fonts, auth, hydration, footer
│   │   │   ├── globals.css          # Design system — CSS variables, animations
│   │   │   ├── page.jsx             # Landing page — intensity selector, social proof
│   │   │   ├── not-found.jsx        # Branded 404
│   │   │   ├── error.jsx            # Global error boundary
│   │   │   ├── loading.jsx          # Route transition loader
│   │   │   ├── roast/[username]/
│   │   │   │   ├── page.jsx         # SSR + generateMetadata
│   │   │   │   └── RoastPageClient.jsx  # Fetch + analyzing screen + result
│   │   │   ├── battle/
│   │   │   │   ├── page.jsx         # Battle entry — two username inputs
│   │   │   │   └── [...slug]/
│   │   │   │       ├── page.jsx     # SSR + OG metadata per battle
│   │   │   │       └── BattlePageClient.jsx  # Battle fetch + animation + result
│   │   │   ├── history/[username]/
│   │   │   │   ├── page.jsx
│   │   │   │   └── HistoryPageClient.jsx
│   │   │   ├── leaderboard/
│   │   │   │   └── page.jsx
│   │   │   ├── pricing/
│   │   │   │   └── page.jsx
│   │   │   ├── payment/
│   │   │   │   └── page.jsx         # Redirects to /pricing (Razorpay uses popup)
│   │   │   └── auth/callback/
│   │   │       └── page.jsx         # GitHub OAuth callback handler
│   │   ├── components/
│   │   │   ├── HydrationWrapper.jsx # Global hydration loader — covers all pages
│   │   │   ├── ToastConfig.jsx      # Brand toast colors — global config
│   │   │   ├── Footer.jsx           # Fixed bottom footer
│   │   │   ├── GitHubLoginBtn.jsx   # Auth button with pulse placeholder
│   │   │   ├── UsernameInput.jsx    # Landing page input
│   │   │   ├── AnalyzingScreen.jsx  # Terminal animation during roast fetch
│   │   │   ├── RoastCard.jsx        # Main roast result card (captured for PNG)
│   │   │   ├── ShareButtons.jsx     # Share link, tweet, copy text, download PNG
│   │   │   ├── BattleCard.jsx       # Head-to-head battle result
│   │   │   ├── ProModal.jsx         # Upgrade modal — ₹199/₹499/₹999
│   │   │   ├── PricingCard.jsx      # Pricing page card
│   │   │   ├── PaymentFlow.jsx      # Razorpay SDK popup handler
│   │   │   ├── StatsGrid.jsx        # GitHub stats grid on roast card
│   │   │   ├── CommitShame.jsx      # Worst commit messages display
│   │   │   ├── HistoryCard.jsx      # Single roast history item
│   │   │   ├── LeaderboardTable.jsx # Wall of Shame table (native <a> rows)
│   │   │   ├── ScoreChart.jsx       # Pure SVG score over time chart
│   │   │   └── MonthlyComparison.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # GitHub OAuth state, isPro, getToken
│   │   ├── hooks/
│   │   │   └── useRoastHistory.js
│   │   └── services/
│   │       └── roastService.js      # API calls — getRoast, getBattleRoast, trackShare
│   └── public/
│       ├── og-default.png           # 1200×630 OG image for social sharing
│       ├── favicon.ico
│       ├── apple-touch-icon.png
│       ├── robots.txt
│       └── sitemap.xml
│
└── server/                          # Express.js API
    ├── index.js                     # App entry — CORS, middleware, route registration
    ├── Dockerfile                   # node:20-alpine, health check, CMD node index.js
    ├── .dockerignore
    ├── routes/
    │   ├── roast.js                 # GET /stats (above /:username), GET /:username
    │   ├── battle.js                # GET /:user1/vs/:user2
    │   ├── auth.js                  # GitHub OAuth — /github, /github/callback
    │   ├── history.js               # GET /:username, POST /:id/share
    │   └── payment.js               # POST /create-order, POST /verify
    ├── services/
    │   ├── githubService.js         # GitHub REST API — profile, repos, commits
    │   ├── roastEngine.js           # Rule-based roast — intensity-aware tone banks
    │   ├── aiService.js             # Gemini 2.5 Flash — intensity-tuned prompts
    │   ├── battleService.js         # runBattle — parallel fetch + AI verdict
    │   ├── paymentService.js        # Razorpay order create + HMAC verify
    │   └── tokenService.js          # JWT sign + verify
    ├── models/
    │   ├── User.js                  # isPro, githubAccessToken, canRoastToday()
    │   ├── Roast.js                 # score, grade, intensity, roastText, source
    │   └── Payment.js               # Razorpay order + payment tracking
    └── middleware/
        ├── auth.js                  # requireAuth, optionalAuth, requirePro
        ├── rateLimiter.js           # Per-route rate limiting
        └── errorHandler.js          # Global error handler
```

---

## ⚙️ How It Works

### Free User Flow

```
1. User enters GitHub username on landing page
2. Picks intensity: Mild / Savage (Nuclear blocked)
3. POST /api/roast/:username?intensity=savage
4. Server fetches GitHub profile via GitHub REST API
5. Custom scoring engine calculates 0-100 score
6. Rule-based roast engine generates comedy roast
7. Result saved to MongoDB with idempotency key
8. RoastCard displayed — share link, tweet, copy text, download PNG
```

### Pro User Flow

```
Same as above except:
  - GitHub private repos accessible via OAuth token
  - Google Gemini 2.5 Flash generates the roast
  - Nuclear intensity available (temperature 1.2)
  - HD PNG download (2x scale, no watermark)
  - Unlimited roasts per day
```

### Battle Flow

```
1. User enters two GitHub usernames at /battle
2. Navigates to /battle/user1/vs/user2
3. Both profiles fetched in parallel
4. Each gets a savage rule-based roast
5. Scores compared — lower score = more roastable = winner of shame
6. Gemini generates a head-to-head battle verdict
7. BattleCard shown with both scores, individual roasts, and AI verdict
8. Shareable URL + pre-filled tweet
```

---

## 📊 Scoring Engine

Each GitHub profile is scored 0–100 across 8 signals:

| Signal                         | Weight | Logic                                    |
| ------------------------------ | ------ | ---------------------------------------- |
| Repo abandonment rate          | High   | % repos with only 1 commit               |
| Commit message quality         | High   | NLP patterns — "fix", "pls work", "asdf" |
| README completeness            | Medium | Missing / empty / has content            |
| Language diversity             | Medium | Using only one language for 5+ years     |
| Star count vs repo count ratio | Medium | Many repos, zero stars                   |
| Account age vs output          | Medium | Years on GitHub, total commits           |
| Fork ratio                     | Low    | All forks, zero original work            |
| Profile completeness           | Low    | Bio, avatar, location                    |

Score → Grade mapping:

```
90-100 → A   Respectable (hard to roast)
75-89  → B   Decent
60-74  → C   Mediocre
45-59  → D   Rough
0-44   → F   Catastrophic (maximum roast potential)
```

---

## 🌶 Intensity System

Three intensity levels change the entire roast experience:

| Intensity  | Who          | AI Temp | Persona           | Example Opener                                                                                          |
| ---------- | ------------ | ------- | ----------------- | ------------------------------------------------------------------------------------------------------- |
| 🌶 Mild    | Free         | 0.7     | Witty friend      | "Not every developer ships, and this profile has made peace with that."                                 |
| 🔥 Savage  | Free         | 1.0     | Stand-up comedian | "If giving up were a language, this GitHub would be running in production."                             |
| ☢️ Nuclear | **Pro only** | 1.2     | Comedy assassin   | "This GitHub is not a portfolio — it is forensic evidence of a developer who never finished a thought." |

Nuclear is locked behind Pro as a conversion driver — users who see it blocked are more likely to upgrade.

---

## ⚔️ Roast Battle

Two developers. One roast. Zero survivors.

```
URL: /battle/username1/vs/username2

Response:
{
  user1, user2,
  score1, score2,
  grade1, grade2,
  winner,          // lower score = more roastable = winner of shame
  roast1, roast2,  // individual savage roasts
  battleRoast      // AI-generated comparative verdict
}
```

Battle verdicts use Gemini as a "boxing announcer comedian" — 2 sentences comparing both developers directly before declaring the winner.

---

## 💰 Monetization

Three plans, all in INR via Razorpay:

| Plan         | Price   | Features                                        |
| ------------ | ------- | ----------------------------------------------- |
| Free         | ₹0      | 1 roast/day, rule engine, watermarked card      |
| Pro One-Time | ₹199    | AI roast, Nuclear intensity, HD card, unlimited |
| Pro Monthly  | ₹499    | All Pro features, monthly billing               |
| Teams        | ₹999/mo | Everything, team roasting                       |

Payment flow:

```
1. User clicks upgrade → Razorpay popup opens
2. Pays via UPI / card / netbanking / wallet
3. Razorpay sends payment details to frontend
4. Frontend POSTs to /api/payment/verify
5. Server verifies HMAC SHA256 signature
6. isPro = true saved to MongoDB User
7. AuthContext refreshes — UI unlocks Pro features
```

---

## 🔐 Environment Variables

### `server/.env`

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
GITHUB_CALLBACK_URL=https://your-backend.onrender.com/api/auth/github/callback
JWT_SECRET=your_strong_random_string
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_gemini_key
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=your_secret
PRO_ONE_TIME_PRICE=19900
PRO_MONTHLY_PRICE=49900
TEAMS_MONTHLY_PRICE=99900
CLIENT_URL=https://gitroast-dev.vercel.app
```

### `client/.env.local`

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
NEXT_PUBLIC_SITE_URL=https://gitroast-dev.vercel.app
```

---

## 💻 Local Development

### Prerequisites

- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- GitHub OAuth App
- Google Gemini API key
- Razorpay account (test keys)

### Backend

```bash
cd server
npm install
cp .env.example .env   # fill in your values
npm run dev            # nodemon index.js
```

Server runs at `http://localhost:5000`

### Frontend

```bash
cd client
npm install
cp .env.local.example .env.local   # fill in your values
npm run dev
```

App runs at `http://localhost:3000`

### GitHub OAuth Setup

1. Go to GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy Client ID and Client Secret to `server/.env`

---

## 🚀 Deployment

### Frontend → Vercel

```bash
# Push client/ to GitHub
# Connect repo on vercel.com
# Set root directory: client/
# Add all NEXT_PUBLIC_ env variables
# Deploy
```

### Backend → Render (Docker)

```bash
# Connect same GitHub repo on render.com
# Set root directory: server/
# Environment: Docker
# Add all server env variables
# Deploy
```

The `server/Dockerfile` uses `node:20-alpine` with a health check at `GET /health`.

### Post-Deployment Checklist

```
□ Update GITHUB_CALLBACK_URL to Render URL
□ Update CLIENT_URL to Vercel/custom domain URL
□ Update NEXT_PUBLIC_API_URL to Render URL
□ Whitelist 0.0.0.0/0 in MongoDB Atlas Network Access
□ Switch Razorpay keys from test to live
□ Verify health endpoint: GET /health
□ Test full roast flow end to end
□ Test payment flow with live keys
```

---

## 📡 API Reference

### Roast

```
GET /api/roast/stats
→ { totalRoasts: number }

GET /api/roast/:username?intensity=savage
Headers: Authorization: Bearer <jwt> (optional)
         X-Idempotency-Key: <uuid> (recommended)
→ { success: true, data: { username, score, grade, roast, roastSource, intensity, stats, ... } }
```

### Battle

```
GET /api/battle/:user1/vs/:user2
→ { success: true, data: { user1, user2, score1, score2, winner, roast1, roast2, battleRoast } }
```

### Auth

```
GET /api/auth/github             → redirects to GitHub OAuth
GET /api/auth/github/callback    → handles OAuth callback, returns JWT
GET /api/auth/me                 → { user: { username, isPro, avatarUrl } }
```

### Payment

```
POST /api/payment/create-order   → { orderId, amount, currency }
POST /api/payment/verify         → verifies HMAC, sets isPro = true
GET  /api/payment/history        → user's payment history
```

### History

```
GET  /api/history/:username      → { roasts: [], stats: { total, best, worst, avg } }
POST /api/history/:id/share      → increments share count
```

---

## 🏗 Architecture Decisions

**Why Next.js App Router over Pages Router**
SSR per-roast metadata for Twitter/OG cards. `generateMetadata` per `[username]` route means every shared link shows the correct roast preview — impossible with client-only rendering.

**Why Razorpay over PayPal**
PayPal sandbox doesn't support UPI and rejects Indian test cards. Razorpay supports INR natively, UPI works in sandbox, no currency mismatch issues.

**Why styled-jsx over Tailwind**
Component-scoped CSS with zero className conflicts, no purging issues, and full CSS power including animations and pseudo-selectors — without a build step dependency.

**Why rule-based engine for free users**
Zero API cost. Every free roast would otherwise consume Gemini tokens. Rule engine with intensity-aware tone banks produces genuinely funny output while keeping the product economically sustainable.

**Why idempotency keys**
React StrictMode mounts components twice in development. Without server-side idempotency, every roast would create two MongoDB documents. The `X-Idempotency-Key` header ensures the second identical request returns the cached result.

**Why `cancelled` boolean over `fetchStarted` ref**
`fetchStarted.current = true` permanently blocks the second StrictMode mount from fetching — causing the analyzing screen to freeze at 100% forever. `cancelled` only prevents `setState` on unmounted components, allowing the second mount to fetch cleanly.

**Why native `<a>` over Next.js `<Link>` in LeaderboardTable**
styled-jsx scopes CSS by adding a data attribute to native HTML elements directly. React components like `<Link>` receive the scope via `className` prop but the rendered `<a>` tag doesn't inherit the data attribute — breaking styled-jsx CSS selectors.

**Why Docker on Render over native Node**
Exact Node 20 environment guaranteed across local and production. Health check endpoint lets Render know when the container is ready before routing traffic. Graceful SIGTERM handling via `CMD ["node", "index.js"]` instead of `npm start`.

---

## 👨‍💻 Author

Built solo by **Priyanshu**

> "This is not a portfolio. It is a detailed public record of every time enthusiasm lasted one weekend."
> — GitRoast, probably about this README

---

<div align="center">

**[gitroast](https://gitroast-dev.vercel.app/)** · Made with 🔥 in India

</div>
