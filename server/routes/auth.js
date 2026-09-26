const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");
const {
  createToken,
  extractToken,
  verifyToken,
} = require("../services/tokenService");
const { requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { logger } = require("../utils/logger");

const rawClientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const CLIENT_URL = rawClientUrl.split(",")[0].trim().replace(/\/$/, "");

// ─── STEP 1: Redirect user to GitHub ─────────────────────
// WHY: user clicks "Connect GitHub" → hits this route
//      → we redirect them to GitHub's OAuth page with CSRF state token
// GET /api/auth/github
router.get("/github", authLimiter, (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");

  // WHY httpOnly + sameSite: prevents client-side JS access & cross-site tampering
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000, // 10 minutes
  });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    // WHY scope:
    //   'read:user' = profile info (name, avatar, email)
    //   'repo'      = private repos (Pro feature)
    //   we request both upfront so user only approves once
    scope: "read:user user:email repo",
    state,
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params}`;
  res.redirect(githubAuthUrl);
});

// ─── STEP 2: GitHub redirects back with a code ───────────
// WHY: after user approves, GitHub calls this URL with ?code=xxx&state=yyy
//      we exchange that code for an access token after validating state
// GET /api/auth/github/callback
router.get("/github/callback", authLimiter, async (req, res) => {
  const { code, error, state } = req.query;
  const savedState = req.cookies?.oauth_state;

  // Clear cookie immediately
  res.clearCookie("oauth_state");

  // WHY state check: prevents Login CSRF attacks per RFC 6749 Section 10.12
  if (!state || !savedState || state !== savedState) {
    logger.warn("Auth", "OAuth CSRF state mismatch or missing", {
      hasQueryState: Boolean(state),
      hasSavedState: Boolean(savedState),
    });
    return res.redirect(`${CLIENT_URL}/auth/callback?auth_error=csrf_detected`);
  }

  // WHY: user denied permission on GitHub
  if (error || !code) {
    return res.redirect(`${CLIENT_URL}/auth/callback?auth_error=access_denied`);
  }

  try {
    // Exchange code for access token
    // WHY: code is single-use + short-lived (10 min)
    // we must exchange it for a real token immediately
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      logger.error("Auth", "Token exchange failed", { data: tokenData });
      return res.redirect(`${CLIENT_URL}/auth/callback?auth_error=token_failed`);
    }

    const accessToken = tokenData.access_token;

    // ── Fetch GitHub profile with the token ────────────
    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitRoast-App",
      },
    });
    const profile = await profileRes.json();

    // ── Safe GitHub Profile Payload Validation ──────────────────
    // ── WHAT: ────────────────────────────────────────────────────
    // Validates that the GitHub API returned a successful HTTP status and
    // a valid profile payload containing both an id and a username (login).
    // ── WHY: ─────────────────────────────────────────────────────
    // If GitHub returns an error payload (e.g. rate limit, bad credentials),
    // profile.id would be undefined, causing String(profile.id) to evaluate to
    // "undefined". An upsert would then overwrite existing records for githubId "undefined",
    // corrupting user accounts and security boundaries.
    // ── WHERE & WHEN TO USE: ─────────────────────────────────────
    // Immediately after receiving the user profile response from GitHub OAuth.
    // ── USE CASES: ───────────────────────────────────────────────
    // User OAuth authorization callback.
    // ── WHEN NOT TO USE: ─────────────────────────────────────────
    // Internal user lookups with already-validated database IDs.
    if (!profileRes.ok || !profile || !profile.id || !profile.login) {
      logger.error("Auth", "Invalid or missing GitHub profile payload", {
        status: profileRes.status,
        profile,
      });
      return res.redirect(`${CLIENT_URL}/auth/callback?auth_error=profile_failed`);
    }

    // ── Fetch email (may be private) ───────────────────
    let email = profile.email;
    if (!email) {
      try {
        const emailRes = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "GitRoast-App",
          },
        });
        const emails = await emailRes.json();
        // ── Safe Email Array Validation ─────────────────────────────
        // ── WHAT: ────────────────────────────────────────────────────
        // Verifies that the GitHub /user/emails response is an array before invoking .find().
        //
        // ── WHY: ─────────────────────────────────────────────────────
        // Prevents TypeError if GitHub returns an API error payload ({ message: "..." })
        // or rate limit notice rather than the expected array of email objects.
        //
        // ── WHERE & WHEN TO USE: ─────────────────────────────────────
        // In external API consumers expecting array responses.
        //
        // ── USE CASES: ───────────────────────────────────────────────
        // Ingesting user profile contact info during OAuth callback.
        //
        // ── WHEN NOT TO USE: ─────────────────────────────────────────
        // Do not use when the payload is guaranteed an array by strict schema validators.
        const primary = Array.isArray(emails)
          ? emails.find((e) => e.primary && e.verified)
          : null;
        email = primary?.email || null;
      } catch {
        // WHY: email is optional — never block login for it
      }
    }

    // ── Upsert user in MongoDB ─────────────────────────
    // WHY findOneAndUpdate with upsert:
    //   - existing user → update their token + info
    //   - new user      → create their record
    //   one operation handles both cases
    const user = await User.findOneAndUpdate(
      { githubId: String(profile.id) },
      {
        $set: {
          username: profile.login,
          email: email,
          avatarUrl: profile.avatar_url,
          // WHY: always update access token on login
          //      token can expire or be revoked — refresh it
          githubAccessToken: accessToken,
        },
        // WHY $setOnInsert: only set these on first creation
        //     don't overwrite isPro if they're already Pro
        $setOnInsert: {
          isPro: false,
          roastCount: 0,
        },
      },
      // WHY returnDocument: 'after' instead of new: true:
      //     Mongoose deprecated new: true in recent versions
      //     returnDocument: 'after' = same behaviour
      //     returns the document AFTER the update is applied
      //     'before' would return the original pre-update doc
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    // WHY: JWT only stores userId for lookup
    //      isPro is NOT stored in JWT — always read fresh from DB
    //      this fixes the stale isPro issue completely
    const jwt = createToken({
      userId: user._id,
      githubId: user.githubId,
      username: user.username,
      // WHY isPro NOT included: reading from DB in middleware
      //     is the only source of truth for Pro status
    });

    // WHY: redirect to frontend with token in URL param
    //      frontend grabs it, stores in memory/localStorage
    //      then immediately cleans the URL
    res.redirect(`${CLIENT_URL}/auth/callback?token=${jwt}`);
  } catch (err) {
    logger.error("Auth", "Callback error", { message: err.message });
    res.redirect(`${CLIENT_URL}/auth/callback?auth_error=server_error`);
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────
// WHY: frontend calls this on page load to restore session
//      if valid token exists → returns user profile
router.get("/me", requireAuth, (req, res) => {
  // WHY toSafeObject: never expose githubAccessToken to frontend
  res.json({
    success: true,
    user: req.user.toSafeObject(),
  });
});

// ─── PATCH /api/auth/preferences ──────────────────────────
/**
 * WHAT: Updates the authenticated user's customization preferences (persona, intensity, theme, leaderboard privacy).
 * WHY: Empowers users to configure their experience and opt into "Ghost Mode" (Wall of Shame leaderboard opt-out).
 * WHERE & WHEN TO USE: In /dashboard user settings panel or landing page persona preference save.
 * USE CASES: User sets default persona to 'hinglish', or toggles 'hideFromLeaderboard' to true.
 * WHEN NOT TO USE: Unauthenticated calls (enforced by requireAuth middleware).
 */
router.patch("/preferences", requireAuth, async (req, res) => {
  try {
    const { defaultIntensity, defaultPersona, cardTheme, hideFromLeaderboard } = req.body || {};

    const updates = {};
    const VALID_INTENSITIES = new Set(["mild", "savage", "nuclear"]);
    const VALID_PERSONAS = new Set(["classic", "hinglish", "techbro", "ramsay", "shakespearean"]);

    if (defaultIntensity && VALID_INTENSITIES.has(defaultIntensity)) {
      updates["customPreferences.defaultIntensity"] = defaultIntensity;
    }
    if (defaultPersona && VALID_PERSONAS.has(defaultPersona)) {
      updates["customPreferences.defaultPersona"] = defaultPersona;
    }
    if (typeof cardTheme === "string" && cardTheme.trim()) {
      updates["customPreferences.cardTheme"] = cardTheme.trim().slice(0, 30);
    }
    if (typeof hideFromLeaderboard === "boolean") {
      updates["customPreferences.hideFromLeaderboard"] = hideFromLeaderboard;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "INVALID_PREFERENCES", message: "No valid preferences provided." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Preferences updated successfully.",
      user: updatedUser.toSafeObject(),
    });
  } catch (err) {
    logger.error("Auth", "Preferences update failed", { message: err.message });
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to update preferences." });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────
// WHY: clears session — frontend removes token on its side
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out." });
});

module.exports = router;

