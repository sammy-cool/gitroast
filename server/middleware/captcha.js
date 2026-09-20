// ============================================================
// GITROAST — reCAPTCHA Verification Middleware
// ============================================================
// WHAT: Validates Google reCAPTCHA tokens for unauthenticated roasts & battles.
//       Supports both:
//       1. Google Cloud reCAPTCHA Enterprise Assessments API (projects.assessments)
//       2. Classic Google reCAPTCHA v3 siteverify API
// WHY:
//   - Unauthenticated requests consume GitHub API quota and Gemini LLM tokens.
//   - Stops headless bots and automated scrapers.
//   - Logged-in users bypass CAPTCHA because their identity is verified via GitHub OAuth.
//   - In dev/test, if keys are not configured, passes through gracefully.
//   - Fail-open philosophy: If Google API fails or times out, allows genuine users.
// ============================================================

const { logger } = require("../utils/logger");

async function verifyCaptcha(req, res, next) {
  // 1. Authenticated users bypass CAPTCHA completely (trust OAuth session)
  if (req.user) {
    return next();
  }

  const projectId = process.env.RECAPTCHA_PROJECT_ID;
  const apiKey = process.env.RECAPTCHA_API_KEY;
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const siteKey = process.env.RECAPTCHA_SITE_KEY || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  // 2. Defensive pass-through: if neither Enterprise nor Classic secret is configured, bypass gracefully
  if (!projectId && !secretKey && !apiKey) {
    return next();
  }

  const token = req.headers["x-captcha-token"];

  // 3. When secret/keys are configured, unauthenticated requests require token
  if (!token) {
    return res.status(403).json({
      error: "CAPTCHA_REQUIRED",
      message: "Human verification required. Please try again or log in with GitHub.",
    });
  }

  try {
    let isValid = false;
    let score = 1.0;
    let errorDetails = null;

    // PATH A: Google Cloud reCAPTCHA Enterprise Assessment API
    if (projectId) {
      const keyParam = apiKey || secretKey;
      const enterpriseUrl = keyParam
        ? `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/assessments?key=${encodeURIComponent(keyParam)}`
        : `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/assessments`;

      const requestBody = {
        event: {
          token,
          siteKey: siteKey || undefined,
        },
      };

      const googleRes = await fetch(enterpriseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(5000),
      });

      const data = await googleRes.json();

      if (data.tokenProperties) {
        isValid = data.tokenProperties.valid === true;
        score = data.riskAnalysis?.score ?? 1.0;
        errorDetails = data.tokenProperties.invalidReason;
      } else {
        logger.warn("Captcha", "reCAPTCHA Enterprise assessment returned unexpected response", { data });
        isValid = false;
        errorDetails = data.error?.message || "ASSESSMENT_ERROR";
      }
    } else {
      // PATH B: Classic Google reCAPTCHA v3 siteverify API
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
      isValid = data.success === true;
      score = data.score !== undefined ? data.score : 1.0;
      errorDetails = data["error-codes"];
    }

    // Score ranges from 0.0 (likely bot) to 1.0 (likely human). Standard threshold is 0.5.
    if (!isValid || score < 0.5) {
      logger.warn("Captcha", "Verification failed or bot score too low", {
        isValid,
        score,
        details: errorDetails,
      });
      return res.status(403).json({
        error: "CAPTCHA_FAILED",
        message: "Bot verification failed. Please log in with GitHub to roast without restrictions.",
      });
    }

    return next();
  } catch (err) {
    // 4. Fault tolerance: If Google API is unreachable or times out, fail open so users are not blocked
    logger.error("Captcha", "Google verification network error (failing open)", {
      message: err.message,
    });
    return next();
  }
}

module.exports = { verifyCaptcha };
