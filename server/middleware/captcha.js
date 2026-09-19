// ============================================================
// GITROAST — reCAPTCHA v3 Verification Middleware
// ============================================================
// WHAT: Validates Google reCAPTCHA v3 tokens for unauthenticated roasts & battles.
// WHY:
//   - Unauthenticated requests consume GitHub API quota and Gemini LLM tokens.
//   - Stops headless bots and automated scrapers.
//   - Logged-in users bypass CAPTCHA because their identity is verified via GitHub OAuth.
//   - In dev/test, if RECAPTCHA_SECRET_KEY is not configured, passes through gracefully.
// ============================================================

const { logger } = require("../utils/logger");

async function verifyCaptcha(req, res, next) {
  // 1. Authenticated users bypass CAPTCHA completely (trust OAuth session)
  if (req.user) {
    return next();
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // 2. Defensive pass-through: if secret key is not configured, bypass gracefully
  if (!secretKey) {
    return next();
  }

  const token = req.headers["x-captcha-token"];

  // 3. When secret is configured, unauthenticated requests require token
  if (!token) {
    return res.status(403).json({
      error: "CAPTCHA_REQUIRED",
      message: "Human verification required. Please try again or log in with GitHub.",
    });
  }

  try {
    const googleRes = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
      signal: AbortSignal.timeout(5000), // 5s timeout prevents blocking user on slow third-party responses
    });

    const data = await googleRes.json();

    // Score ranges from 0.0 (likely bot) to 1.0 (likely human). Standard threshold is 0.5.
    if (!data.success || (data.score !== undefined && data.score < 0.5)) {
      logger.warn("Captcha", "Verification failed or bot score too low", {
        success: data.success,
        score: data.score,
        errors: data["error-codes"],
      });
      return res.status(403).json({
        error: "CAPTCHA_FAILED",
        message: "Bot verification failed. Please log in with GitHub to roast without restrictions.",
      });
    }

    return next();
  } catch (err) {
    // 4. Fault tolerance: If Google API is unreachable or times out, fail open so users are not blocked
    logger.error("Captcha", "Google siteverify network error (failing open)", {
      message: err.message,
    });
    return next();
  }
}

module.exports = { verifyCaptcha };
