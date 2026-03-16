const { verifyToken, extractToken } = require('../services/tokenService')
const User = require('../models/User')

// ─── requireAuth ──────────────────────────────────────────
// WHY: protects routes that need a logged-in user
//      usage: router.get('/private', requireAuth, handler)
async function requireAuth(req, res, next) {
    const token = extractToken(req)

    if (!token) {
        return res.status(401).json({
            error: 'UNAUTHORIZED',
            message: 'Login required.',
        })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
        return res.status(401).json({
            error: 'TOKEN_INVALID',
            message: 'Session expired. Please login again.',
        })
    }

    // WHY: attach user to request so routes can use it
    //      req.user is now available in every protected route
    try {
        const user = await User.findById(decoded.userId)
        if (!user) {
            return res.status(401).json({
                error: 'USER_NOT_FOUND',
                message: 'Account not found.',
            })
        }
        req.user = user
        next()
    } catch {
        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: 'Authentication check failed.',
        })
    }
}

// ─── optionalAuth ─────────────────────────────────────────
// WHY: routes that work for BOTH free and Pro users
//      free users get basic roast
//      Pro users (logged in) get AI roast + private repos
async function optionalAuth(req, res, next) {
    const token = extractToken(req)
    req.user = null   // WHY: default to no user

    if (!token) return next()

    const decoded = verifyToken(token)
    if (!decoded) return next()

    try {
        const user = await User.findById(decoded.userId)
        if (user) req.user = user
    } catch {
        // WHY: silently fail — optional means app works without auth
    }

    next()
}

// ─── requirePro ───────────────────────────────────────────
// WHY: gates Pro-only features
//      always used AFTER requireAuth
function requirePro(req, res, next) {
    if (!req.user?.isPro) {
        return res.status(403).json({
            error: 'PRO_REQUIRED',
            message: 'This feature requires a Pro account.',
        })
    }
    next()
}

module.exports = { requireAuth, optionalAuth, requirePro }