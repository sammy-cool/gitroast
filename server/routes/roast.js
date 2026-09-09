const express = require("express");
const router = express.Router();
const { analyzeProfile } = require("../services/githubService");
const { generateRoast } = require("../services/roastEngine");
const { generateAIRoast } = require("../services/aiService");
const { optionalAuth, requirePro } = require("../middleware/auth");
const Roast = require("../models/Roast");
const { logger } = require("../utils/logger");

// ─── Idempotency store ────────────────────────────────────
const processedKeys = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of processedKeys.entries()) {
    if (now - val.time > 60000) processedKeys.delete(key);
  }
}, 60000);

// WHY /feed above /stats and /:username: specific route must come before dynamic
// WHAT: Returns last 10 public roasts for live feed on homepage
// WHY limit 10: enough to show activity, not overwhelming
// WHY select specific fields: don't expose full roast data publicly
//     only username, score, grade, intensity, createdAt needed for feed
router.get("/feed", async (req, res) => {
  try {
    const feed = await Roast.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select("username score grade intensity createdAt")
      .lean();

    return res.status(200).json({ success: true, feed });
  } catch (err) {
    return res.status(200).json({ success: true, feed: [] });
  }
});

// ─── GET /api/roast/stats ─────────────────────────────────
// WHY: MUST be before /:username — specific routes first
router.get("/stats", async (req, res) => {
  try {
    const count = await Roast.countDocuments();
    return res.status(200).json({ success: true, totalRoasts: count });
  } catch {
    return res.status(200).json({ success: true, totalRoasts: 0 });
  }
});

// ─── GET /api/roast/:username ─────────────────────────────
router.get("/:username", optionalAuth, async (req, res) => {
  const { username } = req.params;
  const isPro = req.user?.isPro || false;
  const idempotencyKey = req.headers["x-idempotency-key"];

  // WHY: read intensity from query param
  //      validate it — only allow known values
  //      default to 'savage' if missing or invalid
  const rawIntensity = req.query.intensity || "savage";
  const intensity = ["mild", "savage", "nuclear"].includes(rawIntensity)
    ? rawIntensity
    : "savage";

  // WHY: Nuclear requires Pro
  //      free users who somehow bypass frontend check are caught here
  if (intensity === "nuclear" && !isPro) {
    return res.status(403).json({
      error: "PRO_REQUIRED",
      message:
        "☢️ Nuclear intensity requires Pro. Upgrade to unlock maximum roast.",
    });
  }

  // ── Idempotency check ─────────────────────────────────
  if (idempotencyKey && processedKeys.has(idempotencyKey)) {
    return res.status(200).json(processedKeys.get(idempotencyKey).response);
  }

  // ── Input validation ──────────────────────────────────
  if (!username || username.length > 39 || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
      message: "Invalid GitHub username format.",
    });
  }

  // ── Free user daily limit ─────────────────────────────
  if (req.user && !isPro) {
    const canRoast = req.user.canRoastToday();
    if (!canRoast) {
      return res.status(429).json({
        error: "DAILY_LIMIT_REACHED",
        message: "Free users get 1 roast per day. Go Pro for unlimited! ⚡",
      });
    }
  }

  try {
    const githubToken = isPro ? req.user?.githubAccessToken : null;
    const data = await analyzeProfile(username, githubToken);

    // ── Generate roast with intensity ────────────────────
    let roast = null;
    let roastSource = "rules";

    if (isPro) {
      // WHY: AI roast for Pro — pass intensity to tune the prompt
      roast = await generateAIRoast(data, intensity);
      if (roast) {
        roastSource = "ai";
      } else {
        roast = generateRoast(data, intensity);
      }
    } else {
      // WHY: rule engine for free — pass intensity for tone variation
      roast = generateRoast(data, intensity);
    }

    if (!roast || roast.trim().length === 0) {
      roast = `@${username}'s GitHub exists. That's the nicest thing the data supports.`;
    }

    data.roast = roast;
    data.roastSource = roastSource;
    data.intensity = intensity; // WHY: frontend can show intensity badge

    // ── Save to MongoDB ───────────────────────────────────
    try {
      const savedRoast = await Roast.create({
        username,
        roastedBy: req.user?._id || null,
        score: data.score,
        grade: data.grade,
        roastText: roast,
        roastSource,
        intensity, // WHY: track which intensity was used
        githubSnapshot: {
          totalRepos: data.totalRepos,
          joinYear: data.joinYear,
          followers: data.followers || 0,
          topLanguage: data._raw?.topLanguage || "",
          abandonedCount: data.repoAnalysis?.abandonedCount || 0,
          commitQuality: data.commitAnalysis?.qualityScore || 0,
          totalStars: data._raw?.totalStars || 0,
          hasReadme: data.readme?.exists || false,
        },
        stats: data.stats,
        shameCommits: data.shameCommits,
        isPro,
      });
      data.roastId = savedRoast._id;
      data.reactions = savedRoast.reactions || {
        relatable: 0,
        destroyed: 0,
        savage: 0,
      };
    } catch (dbErr) {
      logger.error("Roast", "DB save failed", { message: dbErr.message });
    }

    if (req.user) {
      req.user.roastCount += 1;
      req.user.lastRoastDate = new Date();
      await req.user
        .save()
        .catch((e) =>
          logger.error("Roast", "User save failed", { message: e.message }),
        );
    }

    const responseData = { success: true, data };

    if (idempotencyKey) {
      processedKeys.set(idempotencyKey, {
        response: responseData,
        time: Date.now(),
      });
    }

    return res.status(200).json(responseData);
  } catch (err) {
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
        message: `GitHub user "@${username}" does not exist.`,
      });
    }
    if (err.message === "RATE_LIMIT_EXCEEDED") {
      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        message: "GitHub rate limit hit. Try again in 60 seconds.",
        retryAfter: 60,
      });
    }
    logger.error("Roast", `Error for ${username}`, { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    });
  }
});

module.exports = router;
