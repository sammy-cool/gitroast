// ============================================================
// GITROAST — Rate Limiter
// WHY: prevents one person from hammering our GitHub API
//      and burning through the rate limit for everyone
// WHY no package: express-rate-limit is fine but we can
//      build a clean one ourselves — zero dependency
// ============================================================

// WHY Map: fast O(1) lookup by IP address
// Structure: { ip: { count, resetTime } }
const requestCounts = new Map()

// ─── createRateLimiter factory ────────────────────────────
// WHY factory: create different limiters for different routes
//   roast route   → stricter  (GitHub API cost per call)
//   general routes → looser
function createRateLimiter({
    windowMs = 60 * 1000,   // WHY default 1 min window
    maxRequests = 10,          // WHY default 10 req/min
    message = 'Too many requests. Please slow down.',
} = {}) {

    // WHY: cleanup old entries every 5 minutes
    //      prevents Map growing forever in memory
    setInterval(() => {
        const now = Date.now()
        for (const [ip, data] of requestCounts.entries()) {
            if (data.resetTime < now) {
                requestCounts.delete(ip)
            }
        }
    }, 5 * 60 * 1000)

    // WHY: return Express middleware function
    return function rateLimiter(req, res, next) {
        // WHY x-forwarded-for: gets real IP behind proxies/load balancers
        const ip = req.headers['x-forwarded-for']?.split(',')[0]
            || req.socket.remoteAddress
            || 'unknown'
        const now = Date.now()
        const key = `${ip}:${req.path}`   // WHY path: separate limits per route

        const existing = requestCounts.get(key)

        // ── First request or window expired ──────────────────
        if (!existing || existing.resetTime < now) {
            requestCounts.set(key, {
                count: 1,
                resetTime: now + windowMs,
            })
            return next()
        }

        // ── Within window ─────────────────────────────────────
        existing.count++

        if (existing.count > maxRequests) {
            // WHY: tell client exactly when to retry
            const retryAfter = Math.ceil((existing.resetTime - now) / 1000)

            res.setHeader('Retry-After', retryAfter)
            res.setHeader('X-RateLimit-Limit', maxRequests)
            res.setHeader('X-RateLimit-Remaining', 0)

            return res.status(429).json({
                error: 'RATE_LIMIT_EXCEEDED',
                message,
                retryAfter, // WHY: frontend can show countdown timer
            })
        }

        // WHY: tell client how many requests remain
        res.setHeader('X-RateLimit-Limit', maxRequests)
        res.setHeader('X-RateLimit-Remaining', maxRequests - existing.count)

        next()
    }
}

// ─── Pre-built limiters for each use case ────────────────
// WHY export ready-made: routes import and use directly
//     no configuration needed at the route level

// Roast route: 5 roasts per minute per IP
// WHY strict: each roast = GitHub API calls (costs rate limit)
const roastLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: 'Too many roast requests. Give GitHub a breather — try again in a minute.',
})

// Auth route: 10 attempts per 15 minutes
// WHY: prevents OAuth flow abuse
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many auth attempts. Try again in 15 minutes.',
})

// General API: 60 requests per minute
const generalLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: 'Too many requests. Please slow down.',
})

module.exports = { roastLimiter, authLimiter, generalLimiter, createRateLimiter }