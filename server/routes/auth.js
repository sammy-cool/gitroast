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
const { logger } = require("../utils/logger");

const rawClientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const CLIENT_URL = rawClientUrl.split(",")[0].trim().replace(/\/$/, "");

// ─── STEP 1: Redirect user to GitHub ─────────────────────
// WHY: user clicks "Connect GitHub" → hits this route
//      → we redirect them to GitHub's OAuth page with CSRF state token
// GET /api/auth/github
router.get("/github", (req, res) => {
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
router.get("/github/callback", async (req, res) => {
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
        // WHY: find primary verified email
        const primary = emails.find((e) => e.primary && e.verified);
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

// ─── POST /api/auth/logout ────────────────────────────────
// WHY: clears session — frontend removes token on its side
router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out." });
});

module.exports = router;
