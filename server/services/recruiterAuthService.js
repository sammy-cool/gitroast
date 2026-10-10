const crypto = require("crypto");

// scrypt password hashing (built-in; no extra dependency).
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith("scrypt$")) return false;
  const [, salt, hash] = stored.split("$");
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

const PERSONAL_DOMAINS = new Set(["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me", "protonmail.com"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateSignup({ email, password }) {
  if (!EMAIL_RE.test(String(email || ""))) return "Enter a valid work email.";
  if (String(password || "").length < 10) return "Use at least 10 characters for your password.";
  return null;
}

function orgFromEmail(email) {
  const domain = String(email).split("@")[1] || "";
  if (!domain || PERSONAL_DOMAINS.has(domain.toLowerCase())) return "";
  const root = domain.split(".")[0];
  return root.charAt(0).toUpperCase() + root.slice(1);
}

// Verifies a Google Identity Services ID token through Google's tokeninfo endpoint.
async function verifyGoogleIdToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const err = new Error("Google sign-in is not configured.");
    err.statusCode = 503;
    throw err;
  }
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw Object.assign(new Error("Invalid Google credential."), { statusCode: 401 });
  const info = await res.json();
  if (info.aud !== clientId || String(info.email_verified) !== "true") {
    throw Object.assign(new Error("Google credential was rejected."), { statusCode: 401 });
  }
  return { googleId: info.sub, email: String(info.email).toLowerCase(), name: info.name || "", picture: info.picture || null };
}

module.exports = { hashPassword, verifyPassword, validateSignup, orgFromEmail, verifyGoogleIdToken };
