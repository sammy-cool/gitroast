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
// ── WHAT: Initiates the Google OAuth flow.
// ── WHY: Enterprise users often prefer single sign-on (SSO) via Google Workspace.
router.get("/google", (req, res) => {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  if (!GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: "Google OAuth not configured." });
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
router.get("/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code provided.");

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
    res.redirect(`${CLIENT_URL}/recruiter/login?error=oauth_failed`);
  }
});

// ── GET /me ──────────────────────────────────────────────────
// ── WHAT: Retrieves the currently authenticated Recruiter's profile.
// ── WHY: Allows the frontend client to restore session state upon initial load.
router.get("/me", requireRecruiterAuth, (req, res) => {
  res.json({ recruiter: req.recruiter.toSafeObject() });
});

module.exports = router;
