const express = require("express");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const { createToken } = require("../services/tokenService");
const Recruiter = require("../models/Recruiter");
const { requireRecruiterAuth } = require("../middleware/auth");
const { logger } = require("../utils/logger");

const router = express.Router();

const rawClientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const CLIENT_URL = rawClientUrl.split(",")[0].trim().replace(/\/$/, "");

// ── POST /register ───────────────────────────────────────────
// ── WHAT: Registers a new recruiter with email/password.
// ── WHY: Provides an alternative to Google OAuth for enterprise users.
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, company } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await Recruiter.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const recruiter = await Recruiter.create({
      email,
      password: hashedPassword,
      name,
      company,
    });

    const token = createToken({ userId: recruiter._id, role: "recruiter" });
    res.status(201).json({ token, recruiter: recruiter.toSafeObject() });
  } catch (err) {
    logger.error("RecruiterAuth", "Registration error", { message: err.message });
    res.status(500).json({ error: "Server error during registration" });
  }
});

// ── POST /login ──────────────────────────────────────────────
// ── WHAT: Authenticates a recruiter using email and password.
// ── WHY: Standard login flow for users not using OAuth.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const recruiter = await Recruiter.findOne({ email: email.toLowerCase() });
    if (!recruiter || !recruiter.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await recruiter.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken({ userId: recruiter._id, role: "recruiter" });
    res.json({ token, recruiter: recruiter.toSafeObject() });
  } catch (err) {
    logger.error("RecruiterAuth", "Login error", { message: err.message });
    res.status(500).json({ error: "Server error during login" });
  }
});

// ── GET /google ──────────────────────────────────────────────
// ── WHAT: Initiates the Google OAuth flow by redirecting to Google's consent screen.
// ── WHY: Enterprise users prefer single sign-on (SSO) via corporate Google Workspace.
// ── WHERE & WHEN TO USE: Triggered when user clicks 'Sign in with Google' on recruiter portal.
// ── USE CASES: Corporate recruiters accessing Candidate X-Ray via Google OAuth.
// ── WHEN NOT TO USE: Never emit raw JSON from this endpoint; must always redirect.
router.get("/google", (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) {
    logger.warn("RecruiterAuth", "Google OAuth requested but GOOGLE_CLIENT_ID is not configured");
    return res.redirect(`${CLIENT_URL}/recruiter/login?auth_error=oauth_unconfigured`);
  }
  // WHY: Google requires an exact match for redirect URIs. We read from env to support Render vs Localhost.
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/recruiter-auth/google/callback`;
  const scope = "email profile";
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${encodeURIComponent(scope)}`;
  res.redirect(authUrl);
});

// ── GET /google/callback ─────────────────────────────────────
// ── WHAT: Handles the Google OAuth callback, exchanges code for tokens, and upserts user.
// ── WHY: Completes the OAuth flow, linking a Google account to a Recruiter profile.
// ── WHERE & WHEN TO USE: Invoked automatically by Google's OAuth consent redirect.
// ── USE CASES: Finalizing recruiter authentication and issuing signed JWT.
// ── WHEN NOT TO USE: Do not send raw HTML; always redirect back to client SPA.
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) {
    logger.warn("RecruiterAuth", "Google OAuth callback received without code");
    return res.redirect(`${CLIENT_URL}/recruiter/login?auth_error=access_denied`);
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get("host")}/api/recruiter-auth/google/callback`;

  try {
    const tokenResponse = await axios.post("https://oauth2.googleapis.com/token", {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userResponse.data;

    let recruiter = await Recruiter.findOne({
      $or: [{ googleId: profile.id }, { email: profile.email.toLowerCase() }],
    });

    if (!recruiter) {
      recruiter = await Recruiter.create({
        googleId: profile.id,
        email: profile.email.toLowerCase(),
        name: profile.name || "Recruiter",
        avatarUrl: profile.picture,
      });
    } else if (!recruiter.googleId) {
      recruiter.googleId = profile.id;
      if (!recruiter.avatarUrl) recruiter.avatarUrl = profile.picture;
      await recruiter.save();
    }

    const token = createToken({ userId: recruiter._id, role: "recruiter" });

    res.redirect(`${CLIENT_URL}/recruiter/callback?token=${token}`);
  } catch (err) {
    logger.error("RecruiterAuth", "Google OAuth callback error", { message: err.message });
    res.redirect(`${CLIENT_URL}/recruiter/login?auth_error=oauth_failed`);
  }
});

// ── GET /me ──────────────────────────────────────────────────
// ── WHAT: Retrieves the currently authenticated Recruiter's profile.
// ── WHY: Allows the frontend client to restore session state upon initial load.
router.get("/me", requireRecruiterAuth, (req, res) => {
  res.json({ recruiter: req.recruiter.toSafeObject() });
});

module.exports = router;
