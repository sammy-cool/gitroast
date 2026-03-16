const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

// ─── Create JWT ───────────────────────────────────────────
// WHY: called after successful GitHub OAuth login
//      payload = what we embed in the token
function createToken(payload) {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES })
}

// ─── Verify JWT ───────────────────────────────────────────
// WHY: called on every protected route to check token is valid
function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET)
    } catch {
        // WHY: return null instead of throwing
        //      lets caller decide what to do
        return null
    }
}

// ─── Extract token from request ──────────────────────────
// WHY: token can come from Authorization header or cookie
//      we support both for flexibility
function extractToken(req) {
    // Check Authorization: Bearer <token>
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1]
    }

    // Check cookie (httpOnly cookie set by server)
    if (req.cookies && req.cookies.gitroast_token) {
        return req.cookies.gitroast_token
    }

    return null
}

module.exports = { createToken, verifyToken, extractToken }