const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const User = require("../models/User");
const Roast = require("../models/Roast");
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

router.get("/github", authLimiter, (req, res) => {
  const state = crypto.randomBytes(16).toString("hex");

  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: "read:user user:email repo",
    state,
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params}`;
  res.redirect(githubAuthUrl);
});

router.get("/github/callback", authLimiter, async (req, res) => {
  const { code, error, state } = req.query;
  const savedState = req.cookies?.oauth_state;

  res.clearCookie("oauth_state");

  if (!state || !savedState || state !== savedState) {
    logger.warn("Auth", "OAuth CSRF state mismatch or missing", {
      hasQueryState: Boolean(state),
      hasSavedState: Boolean(savedState),
    });
    return res.redirect(`${CLIENT_URL}/auth/callback?auth_error=csrf_detected`);
  }

  if (error || !code) {
    return res.redirect(`${CLIENT_URL}/auth/callback?auth_error=access_denied`);
  }

  try {
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

    const profileRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitRoast-App",
      },
    });
    const profile = await profileRes.json();

    if (!profileRes.ok || !profile || !profile.id || !profile.login) {
      logger.error("Auth", "Invalid or missing GitHub profile payload", {
        status: profileRes.status,
        profile,
      });
      return res.redirect(`${CLIENT_URL}/auth/callback?auth_error=profile_failed`);
    }

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
        const primary = Array.isArray(emails)
          ? emails.find((e) => e.primary && e.verified)
          : null;
        email = primary?.email || null;
      } catch {
      }
    }

    const user = await User.findOneAndUpdate(
      { githubId: String(profile.id) },
      {
        $set: {
          username: profile.login,
          email: email,
          avatarUrl: profile.avatar_url,
          githubAccessToken: accessToken,
        },
        $setOnInsert: {
          isPro: false,
          roastCount: 0,
        },
      },
      { upsert: true, returnDocument: "after", runValidators: true },
    );

    const jwt = createToken({
      userId: user._id,
      githubId: user.githubId,
      username: user.username,
    });

    res.redirect(`${CLIENT_URL}/auth/callback?token=${jwt}`);
  } catch (err) {
    logger.error("Auth", "Callback error", { message: err.message });
    res.redirect(`${CLIENT_URL}/auth/callback?auth_error=server_error`);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    user: req.user.toSafeObject(),
  });
});

router.patch("/preferences", requireAuth, async (req, res) => {
  try {
    const { defaultIntensity, defaultPersona, cardTheme, hideFromLeaderboard } = req.body || {};

    const updates = {};
    const { ALL_INTENSITY_VALUES, ALL_PERSONA_VALUES, normalizeIntensity, normalizePersona } = require("../utils/constants");

    if (defaultIntensity && ALL_INTENSITY_VALUES.includes(String(defaultIntensity).toLowerCase())) {
      if (normalizeIntensity(defaultIntensity) === "nuclear" && !req.user.isPro) {
        return res.status(403).json({
          error: "PRO_REQUIRED",
          message: "Nuclear intensity preference is reserved for Pro members.",
        });
      }
      updates["customPreferences.defaultIntensity"] = normalizeIntensity(defaultIntensity);
    }
    if (defaultPersona && ALL_PERSONA_VALUES.includes(String(defaultPersona).toLowerCase())) {
      updates["customPreferences.defaultPersona"] = normalizePersona(defaultPersona);
    }
    if (typeof cardTheme === "string" && cardTheme.trim()) {
      updates["customPreferences.cardTheme"] = cardTheme.trim().slice(0, 30);
    }
    if (typeof hideFromLeaderboard === "boolean") {
      updates["customPreferences.hideFromLeaderboard"] = hideFromLeaderboard;
      const safeUsername = (req.user.username || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      await Roast.updateMany(
        { username: new RegExp(`^${safeUsername}$`, "i") },
        { $set: { isPrivate: hideFromLeaderboard } }
      ).catch((err) => logger.warn("Auth", "Failed updating past roasts privacy", { error: err.message }));
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

router.post("/logout", (req, res) => {
  res.json({ success: true, message: "Logged out." });
});


// ── Recruiter workspace auth (Google or work email) ──────────────
const {
  hashPassword,
  verifyPassword,
  validateSignup,
  orgFromEmail,
  verifyGoogleIdToken,
} = require("../services/recruiterAuthService");

function recruiterSession(user) {
  return { success: true, token: createToken({ userId: user._id.toString() }), user: user.toSafeObject() };
}

router.post("/recruiter/signup", authLimiter, async (req, res) => {
  const { email, password, acceptResponsibleUse } = req.body || {};
  const problem = validateSignup({ email, password });
  if (problem) return res.status(400).json({ error: "INVALID_INPUT", message: problem });
  if (acceptResponsibleUse !== true) {
    return res.status(400).json({ error: "CONSENT_REQUIRED", message: "Please agree to the responsible-use terms." });
  }
  try {
    const normalized = String(email).toLowerCase().trim();
    if (await User.findOne({ email: normalized, role: "recruiter" }).select("_id")) {
      return res.status(409).json({ error: "DUPLICATE_ENTRY", message: "A workspace already exists for this email. Sign in instead." });
    }
    const id = crypto.randomUUID();
    const user = await User.create({
      githubId: `recruiter:${id}`,
      username: normalized.split("@")[0].slice(0, 39),
      email: normalized,
      role: "recruiter",
      authProvider: "password",
      passwordHash: hashPassword(password),
      recruiter: { organization: orgFromEmail(normalized), acceptedResponsibleUseAt: new Date() },
    });
    return res.status(201).json(recruiterSession(user));
  } catch (err) {
    logger.error("Auth", "recruiter signup failed", { message: err.message });
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not create the workspace." });
  }
});

router.post("/recruiter/login", authLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  try {
    const user = await User.findOne({ email: String(email || "").toLowerCase().trim(), role: "recruiter" }).select("+passwordHash");
    if (!user || !verifyPassword(String(password || ""), user.passwordHash)) {
      return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Email or password is incorrect." });
    }
    return res.json(recruiterSession(user));
  } catch (err) {
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not sign in." });
  }
});

router.post("/recruiter/google", authLimiter, async (req, res) => {
  const { credential, acceptResponsibleUse } = req.body || {};
  if (!credential) return res.status(400).json({ error: "INVALID_INPUT", message: "Missing Google credential." });
  try {
    const g = await verifyGoogleIdToken(credential);
    let user = await User.findOne({ role: "recruiter", $or: [{ googleId: g.googleId }, { email: g.email }] });
    if (!user) {
      if (acceptResponsibleUse !== true) {
        return res.status(400).json({ error: "CONSENT_REQUIRED", message: "Please agree to the responsible-use terms." });
      }
      user = await User.create({
        githubId: `recruiter:${crypto.randomUUID()}`,
        username: g.email.split("@")[0].slice(0, 39),
        email: g.email,
        avatarUrl: g.picture,
        role: "recruiter",
        authProvider: "google",
        googleId: g.googleId,
        recruiter: { organization: orgFromEmail(g.email), acceptedResponsibleUseAt: new Date() },
      });
    } else if (!user.googleId) {
      user.googleId = g.googleId;
      await user.save();
    }
    return res.json(recruiterSession(user));
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: "GOOGLE_AUTH_FAILED", message: err.message || "Google sign-in failed." });
  }
});

module.exports = router;

