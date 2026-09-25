const express = require("express");
const router = express.Router();
const { analyzeProfile, analyzeWrapped } = require("../services/githubService");
const { analyzeRepository } = require("../services/repoRoastService");
const { generateRoast } = require("../services/roastEngine");
const {
  generateAIRoast,
  generateAIRoastStream,
  generateAIRedemptionPlan,
  GEMINI_MODEL,
} = require("../services/aiService");
const { optionalAuth, requirePro } = require("../middleware/auth");
const { verifyCaptcha } = require("../middleware/captcha");
const Roast = require("../models/Roast");
const User = require("../models/User");
const { logger } = require("../utils/logger");

// ─── Idempotency store ────────────────────────────────────
const processedKeys = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of processedKeys.entries()) {
    if (now - val.time > 60000) processedKeys.delete(key);
  }
}, 60000).unref();

// WHY /feed above /stats and /:username: specific route must come before dynamic
// WHAT: Returns last 10 public roasts for live feed on homepage
// WHY limit 10: enough to show activity, not overwhelming
// WHY select specific fields: don't expose full roast data publicly
//     only username, score, grade, intensity, createdAt needed for feed
router.get("/feed", async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=30");
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
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  try {
    const count = await Roast.estimatedDocumentCount();
    return res.status(200).json({ success: true, totalRoasts: count });
  } catch {
    return res.status(200).json({ success: true, totalRoasts: 0 });
  }
});

// ─── GET /api/roast/:username/wrapped ─────────────────────
// WHY: Feature #4 — Spotify-Wrapped style year in review
router.get("/:username/wrapped", optionalAuth, verifyCaptcha, async (req, res) => {
  const { username } = req.params;
  const year = parseInt(req.query.year, 10) || 2025;

  if (!username || username.length > 39 || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
      message: "Invalid GitHub username format.",
    });
  }

  try {
    const githubToken = req.user?.githubAccessToken || null;
    const authUsername = req.user?.username || null;
    const isPro = req.user?.isPro || false;
    const wrapped = await analyzeWrapped(
      username,
      year,
      githubToken,
      authUsername,
      isPro,
    );
    return res.status(200).json({ success: true, wrapped });
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
      });
    }
    logger.error("Wrapped", `Error for ${username}`, { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Failed to generate Wrapped report.",
    });
  }
});

// ─── GET /api/roast/repo/:owner/:repo ─────────────────────
// WHY: Pillar 3 — Repo-level deep roast (torvalds/linux or facebook/react)
//      Specific route MUST precede dynamic /:username route
router.get("/repo/:owner/:repo", optionalAuth, verifyCaptcha, async (req, res) => {
  const { owner, repo } = req.params;
  const isPro = req.user?.isPro || false;
  const rawIntensity = req.query.intensity || "savage";
  const intensity = ["mild", "savage", "nuclear"].includes(rawIntensity)
    ? rawIntensity
    : "savage";

  if (intensity === "nuclear" && !isPro) {
    return res.status(403).json({
      error: "PRO_REQUIRED",
      message: "Nuclear intensity is exclusively for GitRoast Pro members. Upgrade to unlock maximum destruction.",
    });
  }

  // ── Quota Enforcement for Free Authenticated Users ───────────
  // WHAT: Enforces daily 1-roast limit for free authenticated accounts on repository roasts.
  // WHY: Prevents free users from bypassing daily limits by targeting /repo/:owner/:repo directly.
  // WHERE & WHEN TO USE: In all compute/AI-intensive roast generation endpoints.
  // USE CASES: Preventing automated quota bypass on repository inspections.
  // WHEN NOT TO USE: Do not apply to Pro users (isPro === true) who have unlimited burns.
  if (req.user && !isPro) {
    const canRoast = req.user.canRoastToday();
    if (!canRoast) {
      return res.status(429).json({
        error: "DAILY_LIMIT_REACHED",
        message: "Free users get 1 roast per day. Go Pro for unlimited! ⚡",
      });
    }
  }

  if (!owner || !repo || owner.length > 39 || repo.length > 100) {
    return res.status(400).json({
      error: "INVALID_REPO",
      message: "Invalid repository owner or name.",
    });
  }

  try {
    const userToken = req.user?.githubAccessToken || null;
    const repoAnalysis = await analyzeRepository(owner, repo, userToken, isPro, intensity);

    if (req.user) {
      // ── Atomic User Counters Update ──────────────────────────────
      // WHAT: Uses MongoDB atomic operators ($inc, $set) to update roast stats.
      // WHY: Prevents ParallelSaveError race conditions when multiple concurrent
      //      requests hit the server, ensuring quotas are strictly enforced.
      // WHERE & WHEN TO USE: Whenever updating usage counters or balances.
      // USE CASES: Enforcing daily rate limits and tracking roast counts.
      // WHEN NOT TO USE: When document-level schema pre-save hooks are mandatory.
      req.user.roastCount += 1;
      req.user.lastRoastDate = new Date();
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { roastCount: 1 },
        $set: { lastRoastDate: req.user.lastRoastDate },
      }).catch((e) =>
        logger.error("RepoRoast", "User atomic update failed", { message: e.message })
      );
    }

    return res.status(200).json({ success: true, data: repoAnalysis });
  } catch (err) {
    if (err.message === "REPO_NOT_FOUND" || err.code === "REPO_NOT_FOUND") {
      return res.status(404).json({
        error: "REPO_NOT_FOUND",
        message: `Repository "${owner}/${repo}" was not found or is private.`,
      });
    }
    if (err.message === "RATE_LIMIT_EXCEEDED" || err.code === "RATE_LIMIT_EXCEEDED") {
      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        message: "GitHub rate limit hit. Try again in 60 seconds.",
      });
    }
    logger.error("RepoRoast", `Failed for ${owner}/${repo}`, { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Failed to analyze repository.",
    });
  }
});

// ─── GET /api/roast/:username/stream ───────────────────────
// ── WHAT: Server-Sent Events (SSE) streaming endpoint for live roast generation.
// ── WHY: Eliminates perceived 4-6s latency by streaming roast chunks token-by-token.
// ── WHERE & WHEN TO USE: Invoked when the client requests real-time roast generation.
// ── USE CASES: Live typewriter typing powered by Gemini 2.5 Flash.
// ── WHEN NOT TO USE: When generating offline static OG badges or PDF exports.
router.get("/:username/stream", optionalAuth, verifyCaptcha, async (req, res) => {
  const { username } = req.params;
  const isPro = req.user?.isPro || false;
  const rawIntensity = req.query.intensity || "savage";
  const intensity = ["mild", "savage", "nuclear"].includes(rawIntensity) ? rawIntensity : "savage";

  if (intensity === "nuclear" && !isPro) {
    return res.status(403).json({
      error: "PRO_REQUIRED",
      message: "☢️ Nuclear intensity requires Pro.",
    });
  }

  if (!username || username.length > 39 || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
      message: "Invalid GitHub username format.",
    });
  }

  // ── Pre-Stream Validation & Quota Enforcement ──────────────
  // ── WHAT: ────────────────────────────────────────────────────
  // 1. Enforces Free user daily quota before initiating SSE connection.
  // 2. Pre-fetches and analyzes GitHub profile before sending HTTP 200 SSE headers.
  // 3. Updates authenticated user roastCount and lastRoastDate upon successful burn.
  //
  // ── WHY: ─────────────────────────────────────────────────────
  // • Calling analyzeProfile before setting text/event-stream headers allows the server
  //   to cleanly return standard HTTP status codes (400, 404, 429) rather than flushing
  //   an SSE stream that immediately reports an error event.
  // • Without canRoastToday() check, authenticated free users could bypass daily limits
  //   by targeting the /stream endpoint directly.
  // • Tracking roastCount maintains audit parity with standard /:username endpoint.
  //
  // ── WHERE & WHEN TO USE: ─────────────────────────────────────
  // In all streaming or chunked Express endpoints that consume external API quotas or LLMs.
  //
  // ── USE CASES: ───────────────────────────────────────────────
  // Real-time typewriter roast generation with reliable status codes and rate limiting.
  //
  // ── WHEN NOT TO USE: ─────────────────────────────────────────
  // Do not use for long-running batch jobs or bidirectional WebSocket pipelines.
  if (req.user && !isPro) {
    const canRoast = req.user.canRoastToday();
    if (!canRoast) {
      return res.status(429).json({
        error: "DAILY_LIMIT_REACHED",
        message: "Free users get 1 roast per day. Go Pro for unlimited! ⚡",
      });
    }
  }

  let data;
  try {
    const githubToken = req.user?.githubAccessToken || null;
    const authUsername = req.user?.username || null;
    data = await analyzeProfile(username, githubToken, authUsername, isPro);
  } catch (err) {
    if (err.message === "ORGANIZATION_NOT_SUPPORTED" || err.code === "ORGANIZATION_NOT_SUPPORTED") {
      return res.status(400).json({
        error: "ORGANIZATION_NOT_SUPPORTED",
        message: "GitRoast only roasts individual developers, not organizations.",
      });
    }
    if (err.message === "USER_NOT_FOUND" || err.code === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
        message: "GitHub user not found. Check the username and try again.",
      });
    }
    if (err.message === "RATE_LIMIT_EXCEEDED" || err.code === "RATE_LIMIT_EXCEEDED") {
      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        message: "GitHub API rate limit exceeded. Log in with GitHub for a dedicated quota!",
      });
    }
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: err.message || "Failed to analyze profile.",
    });
  }

  // Set SSE Streaming Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  try {
    // 1. Emit metadata event
    res.write(
      `event: metadata\ndata: ${JSON.stringify({
        username: data.username,
        score: data.score,
        grade: data.grade,
        joinYear: data.joinYear,
        totalRepos: data.totalRepos,
        stats: data.stats,
        shameCommits: data.shameCommits,
        bioContrast: data.bioContrast,
        avatarUrl: data.avatarUrl,
        isPro,
      })}\n\n`
    );

    let fullRoast = "";
    let roastSource = "rules";

    if (isPro && process.env.GEMINI_API_KEY) {
      roastSource = "ai";
      for await (const chunk of generateAIRoastStream(data, intensity)) {
        fullRoast += chunk;
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    }

    // Fallback if AI yielded nothing or Free tier
    if (!fullRoast) {
      fullRoast = generateRoast(data, intensity);
      roastSource = "rules";
      res.write(`event: chunk\ndata: ${JSON.stringify({ text: fullRoast })}\n\n`);
    }

    // ── AI Redemption Plan ─────────────────────────────────────
    // WHAT: Generates 3 humorous, high-impact career/code tips for the user.
    // WHY: Provides positive redemption value turning roast into an actionable improvement roadmap.
    // WHERE & WHEN TO USE: Attached to Pro user roasts or fallback rules.
    // USE CASES: Displayed in RoastCard as "Architect Redemption Plan".
    // WHEN NOT TO USE: Never fail the roast if AI tips fail (fail-open pattern).
    let redemptionPlan = [];
    if (isPro) {
      try {
        redemptionPlan = await generateAIRedemptionPlan(data);
      } catch (e) {
        logger.warn("RoastStream", "Failed to generate redemption plan", { message: e.message });
      }
    }

    // 2. Persist to MongoDB
    // ── Full-Schema SSE Stream Persistence ───────────────────────
    // ── WHAT: ────────────────────────────────────────────────────
    // Persists the finalized streaming roast document to MongoDB with complete metadata:
    // attribution (roastedBy), language tags, telemetry model, snapshot, redemptionPlan, and Pro flag.
    //
    // ── WHY: ─────────────────────────────────────────────────────
    // Guarantees 100% schema parity between the SSE streaming route and standard atomic REST route.
    // Prevents missing snapshots or null attribution in profile history and badge endpoints.
    //
    // ── WHERE & WHEN TO USE: ─────────────────────────────────────
    // In stream conclusion handlers right before emitting the terminal event.
    //
    // ── USE CASES: ───────────────────────────────────────────────
    // Completed Gemini 2.5 Flash token streams saving to MongoDB.
    //
    // ── WHEN NOT TO USE: ─────────────────────────────────────────
    // Do not call before stream yields complete text (prevents partial document saves).
    const newRoast = await Roast.create({
      username: data.username,
      roastedBy: req.user?._id || null,
      score: data.score,
      grade: data.grade,
      roastText: fullRoast,
      intensity,
      roastSource,
      avatarUrl: data.avatarUrl || `https://avatars.githubusercontent.com/${data.username}?s=120`,
      topLanguage: data._raw?.topLanguage || data.topLanguage || "",
      aiModel: roastSource === "ai" ? GEMINI_MODEL : "rules-engine",
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
      bioContrast: data.bioContrast || {},
      redemptionPlan,
      isPro,
    });

    if (req.user) {
      // ── Atomic User Counters Update ──────────────────────────────
      // WHAT: Uses MongoDB atomic operators ($inc, $set) to update roast stats.
      // WHY: Prevents ParallelSaveError race conditions when multiple concurrent
      //      requests hit the server, ensuring quotas are strictly enforced.
      // WHERE & WHEN TO USE: Whenever updating usage counters or balances.
      // USE CASES: Enforcing daily rate limits and tracking roast counts.
      // WHEN NOT TO USE: When document-level schema pre-save hooks are mandatory.
      req.user.roastCount += 1;
      req.user.lastRoastDate = new Date();
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { roastCount: 1 },
        $set: { lastRoastDate: req.user.lastRoastDate },
      }).catch((e) =>
        logger.error("RoastStream", "User atomic update failed", { message: e.message }),
      );
    }

    // 3. Emit done event
    res.write(
      `event: done\ndata: ${JSON.stringify({
        roastId: newRoast._id,
        fullRoast,
        roastSource,
        redemptionPlan,
      })}\n\n`
    );
    res.end();
  } catch (err) {
    logger.error("RoastStream", `Stream failed for ${username}`, { message: err.message });
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message || "Roast failed" })}\n\n`);
    res.end();
  }
});

// ─── GET /api/roast/:username ─────────────────────────────
router.get("/:username", optionalAuth, verifyCaptcha, async (req, res) => {
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
    const githubToken = req.user?.githubAccessToken || null;
    const authUsername = req.user?.username || null;
    const data = await analyzeProfile(username, githubToken, authUsername, isPro);

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

    // ── AI Redemption Plan ─────────────────────────────────────
    // WHAT: Generates 3 humorous, high-impact career/code tips for the user.
    // WHY: Delivers immediate engineering value turning a critical roast into an improvement plan.
    // WHERE & WHEN TO USE: Attached to Pro user roasts or fallback rules.
    // USE CASES: Displayed in RoastCard as "Architect Redemption Plan".
    // WHEN NOT TO USE: Never fail the roast if AI tips fail (fail-open pattern).
    let redemptionPlan = [];
    if (isPro) {
      try {
        redemptionPlan = await generateAIRedemptionPlan(data);
      } catch (e) {
        logger.warn("Roast", "Failed to generate redemption plan", { message: e.message });
      }
    }
    data.redemptionPlan = redemptionPlan;

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
        avatarUrl: data.avatarUrl || `https://avatars.githubusercontent.com/${username}?s=120`,
        topLanguage: data._raw?.topLanguage || data.topLanguage || "",
        aiModel: roastSource === "ai" ? GEMINI_MODEL : "rules-engine",
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
        bioContrast: data.bioContrast || {},
        redemptionPlan,
        isPro,
      });
      data.roastId = savedRoast._id;
      data.avatarUrl = savedRoast.avatarUrl;
      data.reactions = savedRoast.reactions || {
        relatable: 0,
        destroyed: 0,
        savage: 0,
      };
    } catch (dbErr) {
      logger.error("Roast", "DB save failed", { message: dbErr.message });
    }

    if (req.user) {
      // ── Atomic User Counters Update ──────────────────────────────
      // WHAT: Uses MongoDB atomic operators ($inc, $set) to update roast stats.
      // WHY: Prevents ParallelSaveError race conditions when multiple concurrent
      //      requests hit the server, ensuring quotas are strictly enforced.
      // WHERE & WHEN TO USE: Whenever updating usage counters or balances.
      // USE CASES: Enforcing daily rate limits and tracking roast counts.
      // WHEN NOT TO USE: When document-level schema pre-save hooks are mandatory.
      req.user.roastCount += 1;
      req.user.lastRoastDate = new Date();
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { roastCount: 1 },
        $set: { lastRoastDate: req.user.lastRoastDate },
      }).catch((e) =>
        logger.error("Roast", "User atomic update failed", { message: e.message }),
      );
    }

    const responseData = { success: true, data };

    if (idempotencyKey) {
      // WHY cap: prevents unbounded memory growth from rapid unique requests
      if (processedKeys.size >= 1000) {
        // Evict oldest entries when capacity reached
        const firstKey = processedKeys.keys().next().value;
        processedKeys.delete(firstKey);
      }
      processedKeys.set(idempotencyKey, {
        response: responseData,
        time: Date.now(),
      });
    }

    return res.status(200).json(responseData);
  } catch (err) {
    if (err.message === "ORGANIZATION_NOT_SUPPORTED" || err.code === "ORGANIZATION_NOT_SUPPORTED") {
      return res.status(400).json({
        error: "ORGANIZATION_NOT_SUPPORTED",
        message: `@${username} is an Organization, not an individual developer. GitRoast only roasts humans (for now)!`,
      });
    }
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
