// ============================================================
// GITROAST — Rate Limiter Middleware
// ============================================================
// WHAT: In-memory rate limiting per IP + path.
//       Blocks abusive requests before they hit routes/DB/GitHub API.
//
// HOW it works:
//   Map key = "ip:path" → stores { count, resetTime }
//   Each request increments count for that key
//   If count > maxRequests within windowMs → 429 response
//   On window expiry → key deleted → count resets
//
// WHY in-memory (not Redis):
//   Zero dependency — fits the project's zero-dep principle
//   Fine for single-server deployment on Render
//   If scaling to multiple servers → switch to Redis later
//
// WHY cleanup interval runs ONCE (not per limiter):
//   OLD BUG: setInterval inside createRateLimiter()
//   3 limiters = 3 setIntervals all cleaning the SAME Map
//   Wasteful — creates 3 timers for identical work
//   FIX: single cleanup interval at module level
//        runs once, cleans the one shared Map ✅
// ============================================================

// ── Shared request store ──────────────────────────────────────
// WHY module-level Map:
//   All limiter instances share one store
//   key = "ip:path" → each route+IP combo tracked separately
//   e.g. "1.2.3.4:/torvalds" and "1.2.3.4:/linus" = different keys
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
  maxRequests = 10,
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

// WHY 5/min for roast:
//   Each roast = GitHub API call (rate limited by GitHub too)
//   5 roasts/min per IP is generous for legit users
//   Blocks scrapers that would exhaust GitHub API quota
const roastLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
  message:
    "Too many roast requests. Give GitHub a breather — try again in a minute.",
});

// WHY 10/15min for auth:
//   Auth = GitHub OAuth — brute force risk is low (OAuth not password)
//   But 10 attempts in 15 min is still generous for legit users
//   Stricter window (15min) to slow down any automated attacks
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: "Too many auth attempts. Try again in 15 minutes.",
});

// WHY 3/min for battle:
//   Battle = 2x GitHub API calls + AI verdict
//   Most expensive endpoint in the app
//   3 battles/min is enough for any legit user
//   Without this: one IP could trigger 120 GitHub API calls/min
const battleLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 3,
  message: "Too many battle requests. Wait a minute before challenging again.",
});

// WHY 60/min general:
//   Broad protection for all /api routes
//   Catches anything not covered by specific limiters
//   60 req/min = 1/sec — generous for normal browsing
const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: "Too many requests. Please slow down.",
});

module.exports = {
  roastLimiter,
  authLimiter,
  battleLimiter, // WHY exported: used in index.js for /api/battle route
  generalLimiter,
  createRateLimiter,
};
