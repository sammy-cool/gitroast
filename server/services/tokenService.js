// ============================================================
// GITROAST — Token Service (JWT Management)
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Cryptographic token management module responsible for generating,
// validating, and extracting JSON Web Tokens (JWTs) for authenticated sessions.
//
// ── WHY: ─────────────────────────────────────────────────────
// Stateless authentication allows GitRoast to scale horizontally across
// multiple containers without sharing an in-memory session database.
// The cryptographic signature guarantees the token cannot be forged or tampered with.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// • After successful OAuth callbacks in `server/routes/auth.js` (generate token).
// • In `server/middleware/auth.js` during request dispatch (validate token).
// • When checking user session validity on `/api/auth/me`.
//
// ── USE CASES: ───────────────────────────────────────────────
// • Issuing 7-day session passes for authenticated developers.
// • Authorizing access to dedicated 5,000 req/hr GitHub rate limit tiers.
// • Unlocking Pro features (e.g. AI-powered roasts, private repo access).
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// • NEVER store sensitive secrets (passwords, raw GitHub tokens) inside the JWT payload.
//   JWT payloads are only Base64Url-encoded and can be read by anyone in browser DevTools.
// • NEVER store mutable permissions (e.g. `isPro: true`) inside the token, because
//   revoking Pro privileges would require invalidating the entire token before its 7-day expiry.
// ============================================================

const jwt = require("jsonwebtoken");

const SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "test" ? "gitroast-dev-fallback-secret-key-32chars" : "");
const EXPIRES = process.env.JWT_EXPIRES_IN || "7d";

// ── createToken ───────────────────────────────────────────────
// ── WHAT: Signs a JSON payload into a secure HMAC-SHA256 JWT string.
// ── WHY: Enables stateless, tamper-proof user session tokens.
// ── WHERE & WHEN TO USE: In OAuth callback after validating GitHub credentials.
// ── USE CASES: Emitting user identity (`userId`, `username`, `githubId`).
// ── WHEN NOT TO USE: When transmitting high-risk authorization secrets or API keys.
function createToken(payload) {
  if (!SECRET) {
    throw new Error("JWT_SECRET environment variable is missing.");
  }
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

// ── verifyToken ───────────────────────────────────────────────
// ── WHAT: Verifies the cryptographic signature and expiration of a JWT.
// ── WHY: Ensures the incoming request was minted by this server and hasn't expired.
// ── WHERE & WHEN TO USE: In `auth.js` middleware before routing to protected controllers.
// ── USE CASES: Validating Bearer headers and authentication cookies.
// ── WHEN NOT TO USE: Do not rely solely on verifyToken to check current Pro status;
//    always query the database (`User.findById`) for live subscription state.
function verifyToken(token) {
  if (!token || !SECRET) return null;
  try {
    return jwt.verify(token, SECRET);
  } catch {
    // WHY return null instead of throwing:
    // Lets the calling middleware decide whether to reject (requireAuth)
    // or gracefully degrade to anonymous user (optionalAuth).
    return null;
  }
}

// ── extractToken ──────────────────────────────────────────────
// ── WHAT: Extracts raw JWT token string from HTTP request headers or cookies.
// ── WHY: Provides protocol flexibility supporting both SPA Bearer headers and HTTP cookies.
// ── WHERE & WHEN TO USE: At the entry point of authentication middleware.
// ── USE CASES:
//    1. Authorization: Bearer <token> (used by React/Next.js frontend fetch calls).
//    2. Cookie: gitroast_token=<token> (used for server-side page navigation).
// ── WHEN NOT TO USE: When authenticating third-party webhook signatures (use HMAC verification).
function extractToken(req) {
  if (!req) return null;

  // 1. Check Authorization: Bearer <token>
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1]?.trim() || null;
  }

  // 2. Check Cookie: gitroast_token
  if (req.cookies && req.cookies.gitroast_token) {
    return req.cookies.gitroast_token;
  }

  return null;
}

module.exports = { createToken, verifyToken, extractToken };