<div align="center">

# GITROAST 🔥

### Get your GitHub brutally roasted. Share the pain.

[![Live](https://img.shields.io/badge/Live-gitroast-FF4500?style=for-the-badge)](https://gitroast-dev.vercel.app/)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-000?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge)](https://render.com)
[![MongoDB](https://img.shields.io/badge/DB-MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb)](https://mongodb.com)

> AI-powered GitHub profile roast generator — analyzes your repos, commits, and coding habits to deliver a brutally funny roast. Built with a custom scoring engine, 3-tier intensity system, Pro monetization with Razorpay, head-to-head battle mode, shareable certificate of shame, and dynamic OpenGraph card generation.

</div>

---

## 📌 Table of Contents

- [What Is GitRoast](#-what-is-gitroast)
- [Live Demo](#-live-demo)
- [GitHub Profile Badges](#️-embed-your-gitroast-badge-in-your-github-readme)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Scoring Engine](#-scoring-engine)
- [Intensity System](#-intensity-system)
- [Roast Battle](#-roast-battle)
- [Certificate of Shame](#-certificate-of-shame)
- [Monetization](#-monetization)
- [Environment Variables](#-environment-variables)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [API Reference](#-api-reference)
- [Architecture Decisions](#-architecture-decisions)
- [Author](#-author)

---

## 🔥 What Is GitRoast

GitRoast analyzes any public GitHub profile and generates a personalized comedy roast based on real developer data — commit quality, abandoned repos, language choices, README existence, stars, and descriptions.

Users can:

- **Get roasted for free** via the rule-based roast engine with tone banks
- **Upgrade to Pro** for personalized AI roasts via Google Gemini 2.5 Flash
- **Choose intensity**: Mild 🌶 / Savage 🔥 / Nuclear ☢️ (Pro)
- **Battle head-to-head** with another developer's GitHub profile
- **Download cards & certificates**: Shareable PNG roast cards and printable Certificates of GitHub Shame
- **React to roasts**: Community emoji reactions (😂 Relatable, 💀 Destroyed, 🔥 Savage) with IP-based deduplication
- **View live ticker & history**: Real-time recent roast marquee and score tracking over time
- **Compete on the Wall of Shame**: Public global leaderboard of the most roastable profiles

---

## 🌐 Live Demo

| Resource       | URL                                         |
| -------------- | ------------------------------------------- |
| Production App | https://gitroast-dev.vercel.app             |
| API Health     | https://gitroast-latest.onrender.com/health |
| Wall of Shame  | https://gitroast-dev.vercel.app/leaderboard |
| Battle Mode    | https://gitroast-dev.vercel.app/battle      |
| Pricing Plans  | https://gitroast-dev.vercel.app/pricing     |

---

## 🛡️ Embed Your GitRoast Badge in Your GitHub README

Developers can proudly display their fiery GitRoast score badge directly in their GitHub profile or repository `README.md`. The badge is dynamic, auto-updates with each roast, and links safely to your roast history!

### Style 1: 🔥 Fiery Card Style (Recommended)
An eye-catching 320×78px dark fiery card showing your GitHub avatar, roast score, and letter grade:

```markdown
[![GitRoast Score](https://gitroast.dev/api/badge/YOUR_USERNAME)](https://gitroast.dev/history/YOUR_USERNAME)
```

### Style 2: 🛡️ Shield / Pill Style
A clean, compact shields.io-compatible pill badge for minimalist READMEs:

```markdown
[![GitRoast Score](https://gitroast.dev/api/badge/YOUR_USERNAME?style=shield)](https://gitroast.dev/history/YOUR_USERNAME)
```

> **⚡ 1-Click Copy on Website**: Whenever you view your roast on GitRoast, click **"🛡️ Copy GitHub README Badge"** under your roast card to choose your style and copy the ready-to-paste snippet instantly!

---

## ✨ Features

### Core Capabilities
- **GitHub Profile Analysis** — fetches user profile, repositories, commit history, READMEs, and language distributions in parallel.
- **Custom Scoring Engine** — 1–99 score computed across 4 weighted penalties with letter grades (`A` to `F-`).
- **Rule-Based Roast Engine** — zero-API-cost comedy generator with intensity tone banks and language-specific stereotype packs (JavaScript, Python, Rust, Go, TypeScript, etc.).
- **AI Roast Engine (Pro)** — Google Gemini 2.5 Flash tuned with role-specific prompt templates, temperature scaling, and anti-cliché filters.
- **Roast History & Trends** — per-user score timeline with interactive SVG charts and month-over-month averages.
- **Wall of Shame Leaderboard** — aggregated MongoDB leaderboard highlighting the most roastable GitHub profiles globally.

### Viral & Engagement Differentiators
- **GitHub Wrapped 2025** — Spotify-Wrapped style annual retrospective analyzing commit seasonality, longest streaks, developer archetypes, and most abandoned repository.
- **Head-to-Head Roast Battle** — parallel profile analysis of two developers with comparative AI boxing announcer verdict.
- **Certificate of GitHub Shame** — downloadable vintage parchment-style certificate with embedded QR code rendered via HTML5 canvas.
- **Dynamic OpenGraph Image Generation** — Next.js Edge Runtime handlers (`/api/og` and `/api/og-battle`) generating real-time 1200×630 social preview PNGs for Twitter and LinkedIn.
- **Community Reactions** — interactive emoji reactions (`😂 Relatable`, `💀 Destroyed`, `🔥 Savage`) with optimistic UI and server-side rate deduplication.
- **Live Roast Ticker** — automated scrolling marquee of recently generated public roasts.
- **Paginated Wall of Shame** — server-side MongoDB `$facet` pagination providing responsive navigation across all roasted profiles.
- **Rate Limit & Quota Broadcast Banners** — live countdown timers and informative broadcast banners prompting GitHub authentication for dedicated 5,000 req/hr API limits.
- **Idempotent Requests** — client and server deduplication with `X-Idempotency-Key` headers to prevent double-charging or duplicate entries during React StrictMode.

### Monetization & Billing
- **Razorpay Integration** — INR payments supporting UPI, credit/debit cards, NetBanking, and mobile wallets.
- **HMAC SHA-256 Verification** — secure server-side cryptographic signature validation preventing payment tampering.
- **Pro Tier Benefits** — unlocks Google Gemini AI roasts, Nuclear intensity, watermark-free HD downloads, private repo analysis via OAuth, and unlimited daily roasts.

---

## 🛠 Tech Stack

| Layer         | Technology                                                            |
| ------------- | --------------------------------------------------------------------- |
| Frontend      | Next.js 16 (App Router), React 19, styled-jsx, `next/font`, `next/og` |
| Backend       | Node.js 20+, Express.js 5, Compression (Gzip/Brotli)                  |
| Database      | MongoDB Atlas, Mongoose 9                                             |
| Distributed Cache| Serverless Redis (Upstash REST API) with resilient in-memory fallback|
| AI Engine     | Google Gemini 2.5 Flash (REST & SSE Live Streaming)                   |
| Authentication| GitHub OAuth 2.0, JSON Web Tokens (JWT)                               |
| Bot Defense   | Google reCAPTCHA v3 & Enterprise Assessments (Fail-open)             |
| Email Dispatch| Resend REST API with in-process background retry queue                |
| Payments      | Razorpay Node SDK & Checkout.js (INR)                                 |
| Image Capture | `html2canvas`, Satori / Edge ImageResponse                            |
| Deployment    | Vercel (Frontend), Render Docker Container (Backend)                  |

---

## 📁 Project Structure

```
gitroast/
├── AGENTS.md                                # Repository rules & brand UX guidelines
├── README.md                                # Comprehensive documentation
├── shared/                                  # Cross-tier single source of truth
│   └── constants.js                         # Validation regexes, intensities, error codes
│
├── client/                                  # Next.js 16 App Router frontend
│   ├── package.json
│   ├── next.config.mjs
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── apple-touch-icon.png
│   │   ├── og-default.png                   # Fallback 1200×630 OG image
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   └── src/
│       ├── app/
│       │   ├── layout.jsx                   # Root layout — fonts, AuthProvider, error tracker
│       │   ├── globals.css                  # Design system tokens, utilities, animations
│       │   ├── page.jsx                     # Landing page — intensity selector, input, live feed
│       │   ├── not-found.jsx                # Branded 404 page
│       │   ├── error.jsx                    # Global React error boundary
│       │   ├── loading.jsx                  # Route transition loader
│       │   ├── roast/[username]/
│       │   │   ├── page.jsx                 # SSR shell + dynamic OG metadata
│       │   │   └── RoastPageClient.jsx      # Roast fetch, terminal animation, result card
│       │   ├── battle/
│       │   │   ├── page.jsx                 # Battle entry — dual username inputs
│       │   │   └── [...slug]/
│       │   │       ├── page.jsx             # SSR shell + battle OG metadata
│       │   │       └── BattlePageClient.jsx # Parallel fetch, arena animation, verdict
│       │   ├── history/[username]/
│       │   │   ├── page.jsx                 # User history SSR shell
│       │   │   └── HistoryPageClient.jsx    # Score chart, timeline, monthly comparison
│       │   ├── leaderboard/
│       │   │   └── page.jsx                 # Wall of Shame global table
│       │   ├── pricing/
│       │   │   └── page.jsx                 # Pricing tiers, FAQ, Squad waitlist
│       │   ├── contact/
│       │   │   └── page.jsx                 # Branded feedback & ticket submission portal
│       │   ├── auth/callback/
│       │   │   └── page.jsx                 # GitHub OAuth callback & token storage
│       │   └── api/
│       │       ├── badge/route.js           # Edge runtime SVG README badge
│       │       ├── og/route.js              # Edge runtime dynamic OG card for roasts
│       │       └── og-battle/route.js       # Edge runtime dynamic OG card for battles
│       ├── components/
│       │   ├── index.js                     # Centralized domain feature barrel
│       │   ├── AnalyzingScreen.jsx          # Terminal animation during profile inspection
│       │   ├── BattleCard.jsx               # Head-to-head battle score & roast display
│       │   ├── CommitShame.jsx              # Hall of shame commit message tags
│       │   ├── Footer.jsx                   # Fixed global footer
│       │   ├── GitHubLoginBtn.jsx           # OAuth button with profile avatar & loading pulse
│       │   ├── GitHubWrapped.jsx            # 2025 Year-in-Review Spotify-style report modal
│       │   ├── HistoryCard.jsx              # Individual historical roast item
│       │   ├── HydrationWrapper.jsx         # Client hydration lifecycle handler
│       │   ├── LeaderboardTable.jsx         # Ranked Wall of Shame table
│       │   ├── LiveRoastFeed.jsx            # Scrolling real-time recent roast marquee
│       │   ├── MonthlyComparison.jsx        # Month-over-month score change component
│       │   ├── Pagination.jsx               # Accessible, responsive pagination controls
│       │   ├── PaymentFlow.jsx              # Razorpay checkout modal logic
│       │   ├── PaymentModal.jsx             # Fullscreen portal modal for checkout
│       │   ├── PricingCard.jsx              # Reusable pricing tier card
│       │   ├── ProBadge.jsx                 # Reusable PRO ⚡ indicator
│       │   ├── ProModal.jsx                 # Upgrade prompt modal with plan switcher
│       │   ├── RateLimitBanner.jsx          # Live countdown rate-limit warning banner
│       │   ├── RoastCard.jsx                # Main roast result card (PNG capture target)
│       │   ├── RoastCertificate.jsx         # Certificate of GitHub Shame generator with QR
│       │   ├── RoastReactions.jsx           # Emoji reaction counter & buttons
│       │   ├── ScoreChart.jsx               # Pure SVG score-over-time trend chart
│       │   ├── ShareButtons.jsx             # Twitter share, link copy, PNG downloads
│       │   ├── StatsGrid.jsx                # 4-metric GitHub diagnostic grid
│       │   ├── ToastConfig.jsx              # Global brand toast color configuration
│       │   └── UsernameInput.jsx            # Validated GitHub username input form
│       ├── context/
│       │   └── AuthContext.jsx              # User session, JWT tokens, Pro status
│       ├── hooks/
│       │   └── useRoastHistory.js           # Roast history fetching & derived statistics
│       ├── services/
│       │   └── roastService.js              # Centralized backend API client (REST & SSE)
│       └── utils/
│           ├── constants.js                 # Frontend shared constants bridge
│           ├── clientErrorTracker.js        # Universal frontend error tracker
│           └── toastUtils.js                # Centralized toast helper methods
│
└── server/                                  # Express.js backend API
    ├── index.js                             # Express bootstrapping, compression, trust proxy, CORS
    ├── Dockerfile                           # Production container definition (node:20-alpine)
    ├── package.json
    ├── middleware/
    │   ├── auth.js                          # requireAuth, optionalAuth, requirePro
    │   ├── captcha.js                       # Google reCAPTCHA Enterprise & v3 dual engine
    │   ├── errorHandler.js                  # Central error mapper & headersSent guard
    │   └── rateLimiter.js                   # Distributed Upstash Redis rate limiting with memory fallback
    ├── models/
    │   ├── User.js                          # User accounts, OAuth tokens, preferences, daily limit
    │   ├── Roast.js                         # Roast snapshots, scores, grades, reactions, indexes
    │   ├── Battle.js                        # Head-to-head battle verdicts, scores, reactions
    │   ├── ContactMessage.js                # Contact tickets, category priorities, admin notes
    │   └── Payment.js                       # Razorpay order & payment records
    ├── routes/
    │   ├── auth.js                          # GitHub OAuth & /me endpoints
    │   ├── battle.js                        # Head-to-head battle & battle reaction endpoints
    │   ├── contact.js                       # Contact inquiry dispatch & ticket generation
    │   ├── history.js                       # History, leaderboard, search, shares, reactions
    │   ├── payment.js                       # Plan list, order creation, signature verify
    │   └── roast.js                         # Feed, stats, stream, and profile roast endpoints
    ├── services/
    │   ├── aiService.js                     # Google Gemini 2.5 Flash integration (Batch & SSE)
    │   ├── battleService.js                 # Dual profile analysis & battle generator
    │   ├── emailService.js                  # Resend API email notification service
    │   ├── githubService.js                 # GitHub REST API client & scoring heuristics
    │   ├── paymentService.js                # Razorpay order creator & HMAC verifier
    │   ├── queueService.js                  # Asynchronous task queue with retries & concurrency
    │   ├── redisService.js                  # Upstash Serverless Redis client & memory fallback
    │   ├── roastEngine.js                   # Rule-based roast generator & 110-rule packs
    │   └── tokenService.js                  # JWT creation & verification utilities
    └── utils/
        ├── constants.js                     # Backend shared constants bridge
        └── logger.js                        # Telemetry logger with auto-suppression & redaction
```

---

## ⚙️ How It Works

### Free User Flow
```
1. User enters GitHub username on homepage
2. Selects intensity: Mild 🌶 or Savage 🔥 (Nuclear is locked)
3. Frontend calls GET /api/roast/:username?intensity=savage with X-Idempotency-Key
4. Server fetches profile, repos, commits, and README via GitHub REST API
5. Scoring engine calculates 1–99 score and assigns letter grade (A to F-)
6. Rule-based roast engine picks matching opener, language punchline, and closer
7. Result is stored in MongoDB with reaction counters
8. RoastCard displays typing animation, diagnostic stats, and shame commits
9. User can share to Twitter/X, copy link, react, or download a watermarked PNG
```

### Pro User Flow
```
1. User connects GitHub account via OAuth (/api/auth/github)
2. Selects a Pro plan (Roaster ₹99 or Historian ₹199) via Razorpay popup
3. Server cryptographically verifies payment HMAC SHA-256 and sets user.isPro = true
4. Nuclear ☢️ intensity is unlocked (AI temperature 1.2, assassin persona)
5. Private repositories are analyzed using the user's delegated OAuth token
6. Google Gemini 2.5 Flash synthesizes a tailored 3-sentence comedy roast
7. User can download high-definition (2x scale) watermark-free roast cards & certificates
8. Unlimited roasts allowed daily with priority processing
```

### Battle Flow
```
1. User enters two usernames at /battle
2. Navigates to /battle/:user1/vs/:user2
3. Both GitHub profiles are fetched and analyzed in parallel
4. Scores and letter grades are evaluated (lower score = more roastable = winner of shame)
5. Google Gemini acts as an AI boxing announcer to deliver a comparative verdict
6. Dual-player BattleCard rendered with individual roasts, winner badge, and share tools
```

---

## 📊 Scoring Engine

Each profile starts with a base score of **100**, with penalty points deducted based on real GitHub metrics:

| Signal | Max Penalty | Formula & Logic |
| ------ | ----------- | --------------- |
| **Repo Abandonment** | -35 pts | `Math.round(abandonedPct * 0.35)` — repos with no pushes after day 1 |
| **Commit Quality** | -30 pts | `Math.round((100 - qualityScore) * 0.3)` — based on regex shame patterns (`fix`, `pls work`, `asdf`, `wip`, etc.) |
| **README Completeness** | -20 pts | -20 if no README in top starred repo; -12 if README is under 200 characters |
| **Missing Descriptions** | -15 pts | `Math.round((noDescription / totalOwn) * 15)` — repos created without descriptions |

The final score is clamped between **1 and 99**:
```js
score = Math.max(1, Math.min(99, score));
```

### Grade Classification

```
85 – 99  →  A    Respectable (Suspiciously competent)
70 – 84  →  B    Decent (Maintains a clean record)
55 – 69  →  C    Mediocre (Technically a developer)
40 – 54  →  D    Rough (Needs serious improvement)
25 – 39  →  F    Catastrophic (Certified disaster)
 1 – 24  →  F-   Unprecedented Disaster (Maximum roast potential)
```

---

## 🌶 Intensity System

| Intensity | Access | AI Temp | Comedian Persona | Example Style |
| --------- | ------ | ------- | ---------------- | ------------- |
| 🌶 **Mild** | Free / Pro | 0.7 | Witty Observational Friend | Gentle, self-aware; jokes that make you laugh with the audience. |
| 🔥 **Savage** | Free / Pro | 1.0 | Stand-Up Comedian | Brutal, specific punchlines with comedic timing. The default mode. |
| ☢️ **Nuclear** | **Pro Only** | 1.2 | Comedy Assassin | Scorched-earth devastation targeting commit history and abandoned repos. |

---

## ⚔️ Roast Battle

Head-to-head comparison between two GitHub profiles:

- **Endpoint**: `GET /api/battle/:user1/vs/:user2`
- **Rules**: Lower score indicates greater developer shame and wins the **Shame Crown** 💀.
- **AI Announcer**: Google Gemini provides a dramatic 2-sentence boxing match verdict comparing both contenders.

---

## 🎓 Certificate of Shame

Users can generate and download a formal, printable **Certificate of GitHub Shame** as a 2x PNG:
- Custom parchment aesthetic with decorative borders and official seals.
- Incorporates user handle, final score, letter grade, and official roast extract.
- Watermarked on free tier, unwatermarked for Pro subscribers.

---

## 💰 Monetization

GitRoast offers flexible INR pricing powered by Razorpay:

| Plan | Price | Billing | Features |
| ---- | ----- | ------- | -------- |
| **Free** | ₹0 | Forever | 1 roast/day, rule-based engine, watermarked cards & certificates |
| **🔥 Roaster** | ₹99 | Monthly | Real Gemini AI roasts, Nuclear ☢️ mode, HD watermark-free cards, private repo analysis, unlimited roasts, Pro badge |
| **📈 Historian** | ₹199 | Monthly | All Roaster features + monthly email reports, score trend tracking, roast streaks, priority AI generation |
| **⚔️ Squad** | — | Coming Soon | Organization-wide roasting, team leaderboards, All-vs-All battle tournaments |

### Payment Flow
1. User clicks upgrade on the Pricing page or Pro modal.
2. Client requests an order via `POST /api/payment/create-order` with `{ planId: "roaster" }`.
3. Server returns Razorpay order ID and public key.
4. Razorpay checkout modal handles UPI / card / NetBanking.
5. Client sends payment credentials to `POST /api/payment/verify`.
6. Server cryptographically verifies the HMAC SHA-256 signature, logs the transaction in MongoDB, and elevates `user.isPro = true`.

---

## 🔐 Environment Variables

### Backend Configuration (`server/.env`)

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/gitroast?retryWrites=true&w=majority
CLIENT_URL=https://gitroast-dev.vercel.app

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://gitroast-latest.onrender.com/api/auth/github/callback
GITHUB_TOKEN=optional_personal_access_token_for_higher_public_rate_limits

# Authentication
JWT_SECRET=your_super_strong_jwt_secret_key
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Distributed Cache & Rate Limiting (Upstash Serverless Redis)
UPSTASH_REDIS_REST_URL=https://your-upstash-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token_here

# Contact Email Dispatch (Resend REST API)
RESEND_API_KEY=re_your_resend_api_key
OWNER_EMAIL=priyanshu.alt191@gmail.com
EMAIL_FROM=GitRoast <onboarding@resend.dev>

# Bot Defense (Google reCAPTCHA v3 / Enterprise)
RECAPTCHA_SECRET_KEY=your_recaptcha_v3_secret_key

# Razorpay Payments
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
```

### Frontend Configuration (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://gitroast-latest.onrender.com
NEXT_PUBLIC_SITE_URL=https://gitroast-dev.vercel.app
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
```

---

## 💻 Local Development

### Prerequisites
- Node.js 20+
- MongoDB instance (Atlas or local `mongodb://localhost:27017/gitroast`)
- GitHub OAuth application
- Google Gemini API key

### 1. Backend Setup
```bash
cd server
npm install
cp .env.example .env   # Configure environment variables
npm run dev            # Starts nodemon on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
cp .env.local.example .env.local   # Configure frontend environment variables
npm run dev                        # Starts Next.js on http://localhost:3000
```

### 3. GitHub OAuth Setup for Localhost
1. Navigate to **GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App**.
2. Set **Homepage URL** to `http://localhost:3000`.
3. Set **Authorization callback URL** to `http://localhost:5000/api/auth/github/callback`.
4. Copy Client ID and Secret to `server/.env`.

---

## 🚀 Deployment

### Frontend (Vercel)
1. Import repository into Vercel and set the root directory to `client`.
2. Configure environment variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`, `NEXT_PUBLIC_GITHUB_CLIENT_ID`).
3. Deploy.

### Backend (Render Docker)
1. Create a new Web Service on Render and link the repository.
2. Select **Docker** environment with root directory set to `server`.
3. Set all required environment variables (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, etc.).
4. The container exposes port `5000` and validates health via `GET /health`.

---

## 📡 API Reference

### Roast Endpoints
```http
GET /api/roast/feed
→ { success: true, feed: [ { username, score, grade, intensity, createdAt } ] }

GET /api/roast/stats
→ { success: true, totalRoasts: number }

GET /api/roast/:username?intensity=savage
Headers:
  Authorization: Bearer <jwt> (optional)
  X-Idempotency-Key: <uuid> (recommended)
→ {
    success: true,
    data: {
      username, score, grade, roast, roastSource, intensity,
      stats: [...], shameCommits: [...], reactions: { relatable, destroyed, savage }
    }
  }

GET /api/roast/:username/stream?intensity=savage
Accept: text/event-stream
→ Server-Sent Events stream:
  event: metadata → { username, score, grade, stats, avatarUrl }
  event: chunk    → { text: "chunk..." }
  event: done     → { roastId, fullRoast, roastSource }

GET /api/roast/:username/wrapped?year=2025
Headers:
  Authorization: Bearer <jwt> (optional, provides 5,000 req/hr rate limit)
→ {
    success: true,
    wrapped: {
      username, year, totalCommits, archetype, archetypeEmoji, archetypeDesc,
      worstMonth: { month, count }, bestStreak, mostAbandonedRepo,
      monthlyCommits: [ { month, count } ], annualScore, annualRoast
    }
  }
```

### Battle Endpoints
```http
GET /api/battle/:user1/vs/:user2
→ {
    success: true,
    data: {
      user1, user2, score1, score2, grade1, grade2,
      winner, loser, roast1, roast2, battleRoast
    }
  }

POST /api/battle/:id/react
Body: { "type": "relatable" | "destroyed" | "savage" }
→ { success: true, reactions: { relatable, destroyed, savage } }
```

### Contact & Support Endpoints
```http
POST /api/contact
Body: { "category": "feedback"|"bug"|"pro"|"dispute"|"general", "name", "email", "message" }
→ { success: true, ticketId: "GR-XXXXXX", message: "Dispatched..." }
```

### Auth Endpoints
```http
GET  /api/auth/github          → Sets httpOnly oauth_state CSRF cookie and redirects to GitHub
GET  /api/auth/github/callback → Validates oauth_state, exchanges code for JWT, redirects to frontend
GET  /api/auth/me              → { success: true, user: { id, username, email, avatarUrl, isPro } }
POST /api/auth/logout          → { success: true, message: "Logged out." }
```

### Payment Endpoints
```http
GET  /api/payment/plans
→ { success: true, plans: [ { id, name, amount, currency } ] }

POST /api/payment/create-order
Headers: Authorization: Bearer <jwt>
Body: { "planId": "roaster" | "historian" }
→ { success: true, orderId, amount, currency, planName, planId, keyId }

POST /api/payment/verify
Headers: Authorization: Bearer <jwt>
Body: { "orderId", "paymentId", "signature", "planId" }
→ { success: true, message: "...", isPro: true }
```

### History & Leaderboard Endpoints
```http
GET  /api/history/leaderboard/worst?page=1&limit=10
→ {
    success: true,
    leaderboard: [ { _id: "username", bestScore: number, roastCount: number } ],
    pagination: { page: 1, limit: 10, total: 42, totalPages: 5, hasNext: true, hasPrev: false }
  }

GET  /api/history/leaderboard/search?q=:username&page=1&limit=10
→ {
    success: true,
    results: [ { _id: "username", bestScore: number, roastCount: number } ],
    pagination: { page: 1, limit: 10, total: 3, totalPages: 1, hasNext: false, hasPrev: false }
  }

GET  /api/history/:username?limit=10
→ { success: true, username, count, history: [ ...roastDocuments ] }

POST /api/history/:id/share
→ { success: true }

POST /api/history/:id/react
Body: { "type": "relatable" | "destroyed" | "savage" }
→ { success: true, reactions: { relatable, destroyed, savage } }
```

### OpenGraph Dynamic Image Generation (Frontend Edge)
```http
GET /api/og?username=:username
→ Returns dynamic 1200×630 PNG card with username, score, grade, and roast snippet

GET /api/og-battle?user1=:u1&user2=:u2
→ Returns dynamic 1200×630 PNG battle card with both avatars, scores, and winner arrow
```

---

## 🏗 Architecture Decisions

- **Edge Runtime Dynamic OpenGraph Cards (`/api/og`, `/api/og-battle`)**: Social sharing cards render dynamically on the edge using Next.js `ImageResponse` (Satori). Shared links on Twitter, WhatsApp, or Discord immediately display the user's score and roast snippet without pre-generating static assets.
- **Server-Side Deduplication & Idempotency**: React 19 / StrictMode double-mounts components in development, and impatient users re-click triggers. The `X-Idempotency-Key` header prevents duplicate MongoDB insertions.
- **In-Memory Tone Banks for Free Users**: Generates high-variety comedic content using rule banks and language packs with zero AI token expenditures, protecting project margins.
- **Razorpay Native INR Flow**: Avoids international currency conversion hurdles and supports India-first payment rails (UPI QR, Google Pay, PhonePe, Paytm).
- **Single-Source Plan Catalog**: All pricing parameters and plan definitions reside in `server/services/paymentService.js` and sync to the client via `GET /api/payment/plans`, eliminating hardcoded pricing discrepancies.

---

## 👨‍💻 Author

Built solo with passion and fire by **Priyanshu**.

<div align="center">

**[gitroast](https://gitroast-dev.vercel.app/)** · Made with 🔥 in India

</div>
