// ============================================================
// GITROAST — Rate Limiter Middleware
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// In-memory sliding-window rate limiting engine per IP and route scope.
// Inspects request frequency, tracks usage in a memory Map, injects RFC 7231
// `Retry-After` and `X-RateLimit-*` headers, and terminates abuse with HTTP 429.
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Upstream Protection: Protects upstream GitHub REST API quotas and Google Gemini AI tokens
//    from malicious or automated script flooding.
// 2. Resource Conservation: Halts expensive MongoDB aggregation pipelines and full collection
//    scans before they consume Node.js CPU cycles.
// 3. Zero-Dependency Simplicity: Operates purely in-memory using JavaScript native Maps,
//    eliminating Redis infrastructure overhead on single-instance Render hosting.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// • Mount at the router level in `server/index.js` or route controllers (`roast.js`, `battle.js`, `auth.js`).
// • Mount BEFORE route handlers and expensive upstream network/database dispatches.
// • Mount AFTER security headers and CORS to ensure 429 error responses still carry
//   valid CORS headers for browser clients.
//
// ── USE CASES: ───────────────────────────────────────────────
// • Throttling anonymous roast attempts (`roastLimiter`: 20/min).
// • Throttling OAuth brute-force or rapid credential exchanges (`authLimiter`: 25/15min).
// • Throttling developer battles requiring 2x GitHub API fetches (`battleLimiter`: 18/min).
// • General application-wide DoS shield (`generalLimiter`: 75/min).
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// • DO NOT use on high-frequency internal keep-alive or Docker health check endpoints (`/health`).
// • DO NOT use on static asset delivery or passive image streaming.
// • DO NOT rely on in-memory rate limiting across horizontally scaled multi-container clusters;
//   distributed production clusters requires a centralized Redis token bucket.
// ============================================================

const redisService = require("../services/redisService");

// ── Shared request store ──────────────────────────────────────
// WHY module-level Map:
//   All limiter instances share one store when running single-instance
//   key = "ip:path" → each route+IP combo tracked separately
//   When Upstash Redis is configured, operations automatically sync across containers
const requestCounts = new Map();

// WHY single cleanup interval (module level, not per limiter):
//   Runs every 5 minutes — removes expired entries
//   Prevents Map from growing unbounded under load
//   One interval handles all limiters ✅
setInterval(
  () => {
    const now = Date.now();
    for (const [key, data] of requestCounts.entries()) {
      if (data.resetTime < now) {
        requestCounts.delete(key);
      }
    }
    // Defensive capacity guard against memory exhaustion from spoofed IP floods
    if (requestCounts.size >= 50000) {
      requestCounts.clear();
    }
  },
  5 * 60 * 1000,
).unref();

// ── Factory function ──────────────────────────────────────────
// WHAT: Creates a configured rate limiter middleware
// WHY factory pattern:
//   Each route needs different limits
//   roastLimiter: 5/min (expensive — GitHub API call per request)
//   authLimiter:  10/15min (security — brute force protection)
//   battleLimiter: 3/min (most expensive — 2x GitHub API + AI)
//   generalLimiter: 60/min (broad protection for all /api routes)
function createRateLimiter({
  windowMs = 60 * 1000,
  maxRequests = 25,
  message = "Too many requests. Please slow down.",
} = {}) {
  return function rateLimiter(req, res, next) {
    // WHY x-forwarded-for:
    //   Render (and most cloud hosts) sit behind a load balancer
    //   req.socket.remoteAddress = proxy IP (same for all users)
    //   x-forwarded-for = actual client IP (what we want)
    //   split(',')[0] = take first IP if multiple proxies in chain
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown";

    const now = Date.now();

    // WHY route scope normalization:
    //   1. /api/roast/:username -> normalized to /api/roast/profile so changing usernames doesn't bypass limit
    //   2. /api/roast/feed & /api/roast/stats keep dedicated keys so ticker polling doesn't drain roast quota
    //   3. /api/battle/:user1/vs/:user2 -> normalized to /api/battle so changing challenger names doesn't bypass limit
    let routeScope = req.baseUrl || req.path;
    if (req.baseUrl === "/api/roast") {
      if (req.path === "/feed" || req.path === "/stats") {
        routeScope = `/api/roast${req.path}`;
      } else {
        routeScope = "/api/roast/profile";
      }
    } else if (req.baseUrl === "/api/battle") {
      routeScope = "/api/battle";
    }

    const key = `${ip}:${routeScope}`;

    // ── Distributed Redis Branch ──────────────────────────────
    // When Upstash Redis is active, track counters in cloud cache
    if (redisService.isConfigured) {
      const ttlSeconds = Math.ceil(windowMs / 1000);
      redisService
        .incrWithTtl(key, ttlSeconds)
        .then(({ count, ttl }) => {
          if (count > maxRequests) {
            res.setHeader("Retry-After", ttl);
            res.setHeader("X-RateLimit-Limit", maxRequests);
            res.setHeader("X-RateLimit-Remaining", 0);
            return res.status(429).json({
              error: "RATE_LIMIT_EXCEEDED",
              message,
              retryAfter: ttl,
            });
          }
          res.setHeader("X-RateLimit-Limit", maxRequests);
          res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - count));
          next();
        })
        .catch(() => {
          // Fail-open: network error on Redis must never block legitimate traffic
          next();
        });
      return;
    }

    const existing = requestCounts.get(key);

    // WHY check resetTime:
    //   If window expired → treat as new window, reset count
    //   Don't carry over old counts into new window
    if (!existing || existing.resetTime < now) {
      requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      // WHY set remaining header on first request too:
      //   Clients can see their limit from the very first call
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", maxRequests - 1);
      return next();
    }

    existing.count++;

    if (existing.count > maxRequests) {
      // WHY retryAfter in seconds (not ms):
      //   HTTP Retry-After header standard = seconds
      //   Frontend reads this and shows exact countdown
      const retryAfter = Math.ceil((existing.resetTime - now) / 1000);

      // WHY standard headers:
      //   Retry-After: RFC 7231 standard — browsers/clients understand it
      //   X-RateLimit-*: de facto standard used by GitHub, Twitter etc.
      res.setHeader("Retry-After", retryAfter);
      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", 0);

      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        message,
        // WHY retryAfter in response body too:
        //   Headers can be stripped by proxies/CDNs
        //   Body is always delivered — frontend reads this
        retryAfter,
      });
    }

    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader("X-RateLimit-Remaining", maxRequests - existing.count);
    next();
  };
}

// ── Limiter instances ─────────────────────────────────────────

// WHY 20/min for roast (upgraded from 5):
//   Provides comfortable headroom for legitimate users while blocking scrapers
const roastLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,
  message:
    "Too many roast requests. Give GitHub a breather — try again in a minute.",
});

// WHY 25/15min for auth (upgraded from 10):
//   Allows seamless re-authentication and OAuth testing
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 25,
  message: "Too many auth attempts. Try again in 15 minutes.",
});

// WHY 18/min for battle (upgraded from 3):
//   Battle = 2x GitHub API calls + AI verdict — 18 battles/min provides ample headroom
const battleLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 18,
  message: "Too many battle requests. Wait a minute before challenging again.",
});

// WHY 75/min general (upgraded from 60):
//   Broad protection for all /api routes
const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 75,
  message: "Too many requests. Please slow down.",
});

module.exports = {
  roastLimiter,
  authLimiter,
  battleLimiter, // WHY exported: used in index.js for /api/battle route
  generalLimiter,
  createRateLimiter,
};
