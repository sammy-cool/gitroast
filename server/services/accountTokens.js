/**
 * One-time account tokens (email verification, password reset).
 *  - the raw token only ever lives in the emailed link
 *  - the database stores a SHA-256 hash, so a leaked database cannot be used to take over accounts
 *  - tokens expire and are single-use (callers clear them after use)
 */
const crypto = require("crypto");

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_MS = 60 * 1000; // minimum gap between emails per account

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function generateToken(ttlMs, now = Date.now()) {
  const token = crypto.randomBytes(32).toString("base64url");
  return { token, tokenHash: hashToken(token), expiresAt: new Date(now + ttlMs) };
}

const isExpired = (date, now = Date.now()) => !date || new Date(date).getTime() <= now;

/** Seconds until another email may be sent, or 0 when allowed. */
function cooldownRemaining(lastSentAt, now = Date.now(), cooldownMs = RESEND_COOLDOWN_MS) {
  if (!lastSentAt) return 0;
  const left = new Date(lastSentAt).getTime() + cooldownMs - now;
  return left > 0 ? Math.ceil(left / 1000) : 0;
}

// Tokens are base64url; anything else is rejected before touching the database.
const isWellFormedToken = (t) => typeof t === "string" && /^[A-Za-z0-9_-]{40,64}$/.test(t);

/** True when a JWT was issued before the account's last password change. */
function sessionPredatesPasswordChange(user, decoded) {
  if (!user?.passwordChangedAt || !decoded?.iat) return false;
  return decoded.iat < Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
}

module.exports = {
  VERIFY_TTL_MS,
  RESET_TTL_MS,
  RESEND_COOLDOWN_MS,
  hashToken,
  generateToken,
  isExpired,
  cooldownRemaining,
  isWellFormedToken,
  sessionPredatesPasswordChange,
};
