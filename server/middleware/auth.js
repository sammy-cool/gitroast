// ============================================================
// GITROAST — Authentication Middleware Pipeline
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Express middleware layer that inspects incoming requests for JWT tokens,
// verifies identity against MongoDB `User` documents, and regulates access
// based on user login state and Pro subscription status.
//
// ── WHY: ─────────────────────────────────────────────────────
// Enforces security boundaries and tiered feature access:
// • Anonymous visitors: Rate-limited, public repos only, basic rule roast.
// • Authenticated users: Dedicated 5,000 req/hr GitHub rate limit quota, CAPTCHA bypass.
// • Pro subscribers: Gemini AI roasts, private repo analysis, unwatermarked high-res exports.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// • Use `requireAuth`: Routes requiring strict user authentication (e.g. `/api/auth/me`, `/api/payment/orders`).
// • Use `optionalAuth`: Hybrid endpoints serving both guests and logged-in users (e.g. `/api/roast/:username`, `/api/battle/:user1/vs/:user2`).
// • Use `requirePro`: Sub-routes restricted exclusively to paying Pro tier customers.
//
// ── USE CASES: ───────────────────────────────────────────────
// • Passing `req.user.githubAccessToken` to GitHub API calls to avoid 60 req/hr Render IP rate limits.
// • Enabling daily roast limit tracking via `req.user.canRoastToday()`.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// • DO NOT use `requireAuth` on public telemetry or webhook endpoints (`/health`, `/api/history/leaderboard/*`, Razorpay webhooks).
// • DO NOT use `requirePro` as a standalone middleware; it must always run AFTER `requireAuth` or `optionalAuth` has populated `req.user`.
// ============================================================

const { verifyToken, extractToken } = require("../services/tokenService");
const User = require("../models/User");

// ── requireAuth ───────────────────────────────────────────────
// ── WHAT: Enforces mandatory login; halts request pipeline with 401 if unauthenticated.
// ── WHY: Protects private account data, order creation, and user settings.
// ── WHERE & WHEN TO USE: On private endpoints where guest access makes no sense.
// ── USE CASES: Fetching `/api/auth/me`, creating Razorpay payment orders.
// ── WHEN NOT TO USE: On landing page feeds, leaderboard, public history, or shared roasts.
async function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Login required to access this resource.",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({
      error: "TOKEN_INVALID",
      message: "Session expired or invalid. Please login again.",
    });
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: "USER_NOT_FOUND",
        message: "Account associated with this token was not found.",
      });
    }
    // Attach fresh user document to request pipeline
    req.user = user;
    next();
  } catch {
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Authentication validation check failed.",
    });
  }
}

// ── optionalAuth ──────────────────────────────────────────────
// ── WHAT: Softly checks for user authentication; attaches `req.user` if token is valid,
//          but gracefully continues as anonymous guest (`req.user = null`) if absent.
// ── WHY: Allows a single endpoint to provide tiered responses without duplicating route handlers.
// ── WHERE & WHEN TO USE: On core product endpoints (roasting, battles, history).
// ── USE CASES:
//    • Guest requests `/api/roast/torvalds` → gets standard rule roast + CAPTCHA verification.
//    • Pro user requests `/api/roast/torvalds` → gets Gemini AI roast + bypasses CAPTCHA + 5,000 req/hr quota.
// ── WHEN NOT TO USE: When an endpoint strictly requires authenticated user ownership (e.g. `/api/auth/me`).
async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  req.user = null; // Default to anonymous guest

  if (!token) return next();

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) return next();

  try {
    const user = await User.findById(decoded.userId);
    if (user) req.user = user;
  } catch {
    // WHY silently fail: optional authentication must never break guest browsing
  }

  next();
}

// ── requirePro ────────────────────────────────────────────────
// ── WHAT: Verifies that the authenticated user possesses an active Pro subscription.
// ── WHY: Enforces the monetization paywall for premium computing resources.
// ── WHERE & WHEN TO USE: After `requireAuth` on premium-only features.
// ── USE CASES: High-resolution unwatermarked card downloads, private repository roasting.
// ── WHEN NOT TO USE: On public roasts or features intended as free growth hooks.
function requirePro(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Please log in before accessing Pro features.",
    });
  }

  if (!req.user.isPro) {
    return res.status(403).json({
      error: "PRO_REQUIRED",
      message: "This feature requires an active GitRoast Pro account.",
    });
  }

  next();
}

module.exports = { requireAuth, optionalAuth, requirePro };