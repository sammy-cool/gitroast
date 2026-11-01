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
const {
  VERIFY_TTL_MS,
  RESET_TTL_MS,
  hashToken,
  generateToken,
  isExpired,
  cooldownRemaining,
  isWellFormedToken,
} = require("../services/accountTokens");
const { appBaseUrl, verificationEmail, resetEmail, sendEmail } = require("../services/transactionalEmail");
const { requireRecruiter } = require("../middleware/auth");
const TalentSave = require("../models/TalentSave");
const Shortlist = require("../models/Shortlist");

// Creates a fresh verification token on the user (does not save) and returns the emailed link.
function issueVerification(user) {
  const t = generateToken(VERIFY_TTL_MS);
  user.emailVerification = { tokenHash: t.tokenHash, expiresAt: t.expiresAt, sentAt: new Date() };
  return `${appBaseUrl()}/auth/verify?token=${t.token}`;
}

// Fire-and-forget: a slow or failing mail provider must never block or fail an API response.
function sendInBackground(to, message) {
  sendEmail({ to, ...message }).catch(() => {});
}

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
      emailVerified: false,
      recruiter: { organization: orgFromEmail(normalized), acceptedResponsibleUseAt: new Date() },
    });
    const link = issueVerification(user);
    await user.save();
    sendInBackground(normalized, verificationEmail({ link }));
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
        emailVerified: true, // Google only issues tokens for verified addresses (checked in verifyGoogleIdToken)
        recruiter: { organization: orgFromEmail(g.email), acceptedResponsibleUseAt: new Date() },
      });
    } else if (!user.googleId || !user.emailVerified) {
      user.googleId = user.googleId || g.googleId;
      user.emailVerified = true;
      await user.save();
    }
    return res.json(recruiterSession(user));
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: "GOOGLE_AUTH_FAILED", message: err.message || "Google sign-in failed." });
  }
});


// ── Recruiter account lifecycle: verify email, reset password, delete account ──
const GENERIC_FORGOT = { success: true, message: "If an account exists for that email, a reset link is on its way." };

router.post("/recruiter/verify", authLimiter, async (req, res) => {
  const { token } = req.body || {};
  if (!isWellFormedToken(token)) return res.status(400).json({ error: "INVALID_TOKEN", message: "This link is invalid or has expired." });
  try {
    const user = await User.findOne({ role: "recruiter", "emailVerification.tokenHash": hashToken(token) }).select("+emailVerification.tokenHash");
    if (!user || isExpired(user.emailVerification?.expiresAt)) {
      return res.status(400).json({ error: "INVALID_TOKEN", message: "This link is invalid or has expired." });
    }
    user.emailVerified = true;
    user.emailVerification = { tokenHash: null, expiresAt: null, sentAt: user.emailVerification.sentAt };
    await user.save();
    return res.json({ success: true, verified: true });
  } catch (err) {
    logger.error("Auth", "email verification failed", { message: err.message });
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not verify the email." });
  }
});

router.post("/recruiter/verify/resend", authLimiter, requireAuth, requireRecruiter, async (req, res) => {
  const user = req.user;
  if (user.emailVerified) return res.json({ success: true, alreadyVerified: true });
  const wait = cooldownRemaining(user.emailVerification?.sentAt);
  if (wait > 0) {
    return res.status(429).json({ error: "COOLDOWN", message: `Please wait ${wait}s before requesting another email.`, retryAfter: wait });
  }
  try {
    const link = issueVerification(user);
    await user.save();
    sendInBackground(user.email, verificationEmail({ link }));
    return res.json({ success: true, sent: true });
  } catch (err) {
    logger.error("Auth", "resend verification failed", { message: err.message });
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not send the email." });
  }
});

router.post("/recruiter/forgot", authLimiter, async (req, res) => {
  const email = String(req.body?.email || "").toLowerCase().trim();
  // Same response whether or not the account exists: no account enumeration.
  if (!email || email.length > 254) return res.json(GENERIC_FORGOT);
  try {
    const user = await User.findOne({ email, role: "recruiter", authProvider: "password" });
    if (user && cooldownRemaining(user.passwordReset?.requestedAt) === 0) {
      const t = generateToken(RESET_TTL_MS);
      user.passwordReset = { tokenHash: t.tokenHash, expiresAt: t.expiresAt, requestedAt: new Date() };
      await user.save();
      sendInBackground(user.email, resetEmail({ link: `${appBaseUrl()}/auth/reset?token=${t.token}` }));
    }
  } catch (err) {
    logger.error("Auth", "forgot password failed", { message: err.message });
  }
  return res.json(GENERIC_FORGOT);
});

router.post("/recruiter/reset", authLimiter, async (req, res) => {
  const { token, password } = req.body || {};
  if (!isWellFormedToken(token)) return res.status(400).json({ error: "INVALID_TOKEN", message: "This link is invalid or has expired." });
  const problem = validateSignup({ email: "x@x.co", password });
  if (problem && /password/i.test(problem)) return res.status(400).json({ error: "INVALID_INPUT", message: problem });
  try {
    const user = await User.findOne({ role: "recruiter", "passwordReset.tokenHash": hashToken(token) }).select("+passwordReset.tokenHash");
    if (!user || isExpired(user.passwordReset?.expiresAt)) {
      return res.status(400).json({ error: "INVALID_TOKEN", message: "This link is invalid or has expired." });
    }
    user.passwordHash = hashPassword(password);
    user.passwordChangedAt = new Date(); // signs out every existing session
    user.emailVerified = true; // controlling the mailbox proves the address
    user.passwordReset = { tokenHash: null, expiresAt: null, requestedAt: user.passwordReset.requestedAt };
    await user.save();
    return res.json({ success: true });
  } catch (err) {
    logger.error("Auth", "password reset failed", { message: err.message });
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not reset the password." });
  }
});

router.delete("/recruiter/account", authLimiter, requireAuth, requireRecruiter, async (req, res) => {
  const { confirm, password, credential } = req.body || {};
  if (confirm !== "DELETE") return res.status(400).json({ error: "CONFIRMATION_REQUIRED", message: "Type DELETE to confirm." });
  try {
    const user = await User.findById(req.user._id).select("+passwordHash");
    if (user.authProvider === "password") {
      if (!verifyPassword(String(password || ""), user.passwordHash)) {
        return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Password is incorrect." });
      }
    } else {
      const g = await verifyGoogleIdToken(String(credential || "")).catch(() => null);
      if (!g || g.googleId !== user.googleId) {
        return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Confirm with Google to delete this account." });
      }
    }
    await Promise.all([TalentSave.deleteMany({ recruiterId: user._id }), Shortlist.deleteMany({ recruiterId: user._id })]);
    await User.deleteOne({ _id: user._id });
    return res.json({ success: true });
  } catch (err) {
    logger.error("Auth", "account deletion failed", { message: err.message });
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not delete the account." });
  }
});

module.exports = router;

