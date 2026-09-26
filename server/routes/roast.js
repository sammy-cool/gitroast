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
const redisService = require("../services/redisService");
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
  // ── Wrapped Year Boundary Clamping ──────────────────────────
  // ── WHAT: ────────────────────────────────────────────────────
  // Clamps requested Wrapped year within GitHub operational era (2008 to current year).
  // Defaults to 2025 if missing, non-numeric, or outside valid range.
  // ── WHY: ─────────────────────────────────────────────────────
  // Prevents malformed ISO date queries (e.g. negative or future years) from being dispatched to GitHub API.
  // ── WHERE & WHEN TO USE: ─────────────────────────────────────
  // Wrapped annual review endpoints.
  // ── USE CASES: ───────────────────────────────────────────────
  // Parsing ?year= query parameters.
  // ── WHEN NOT TO USE: ─────────────────────────────────────────
  // Timestamp queries expecting precise epoch milliseconds.
  const currentYear = new Date().getFullYear();
  const rawYear = parseInt(req.query.year, 10);
  const year = isNaN(rawYear) || rawYear < 2008 || rawYear > currentYear ? 2025 : rawYear;

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

  /* 
    ── WHAT: ────────────────────────────────────────────────────────
    Input validation for GitHub repository owner and name parameters.
    
    ── WHY: ─────────────────────────────────────────────────────────
    Validates parameter format before inspecting user quota or invoking
    downstream GitHub API calls, immediately rejecting malformed inputs with 400.
    
    ── WHERE & WHEN TO USE: ─────────────────────────────────────────
    At the beginning of repository roast controllers.
    
    ── USE CASES: ───────────────────────────────────────────────────
    Rejecting path traversal characters, spaces, or excessive length handles.
    
    ── WHEN NOT TO USE: ─────────────────────────────────────────────
    Do not use for general search queries with arbitrary punctuation.
  */
  const validOwner = /^[a-zA-Z0-9-]+$/.test(owner || "");
  const validRepo = /^[a-zA-Z0-9._-]+$/.test(repo || "");
  if (!owner || !repo || owner.length > 39 || repo.length > 100 || !validOwner || !validRepo) {
    return res.status(400).json({
      error: "INVALID_REPO",
      message: "Invalid repository owner or name.",
    });
  }

  // ── Idempotency check (Distributed Redis + In-Memory Fallback) ──
  // ── WHAT: ────────────────────────────────────────────────────
  // Checks cloud Redis and in-memory store for previously analyzed repo results.
  // ── WHY: ─────────────────────────────────────────────────────
  // Repository analysis consumes multiple GitHub API calls and Gemini review tokens.
  // Checking idempotency BEFORE quota prevents duplicate clicks and React StrictMode
  // mounts from prematurely triggering 429 DAILY_LIMIT_REACHED errors on cached runs.
  // ── WHERE & WHEN TO USE: ─────────────────────────────────────
  // Start of repository inspection pipeline prior to quota verification.
  // ── USE CASES: ───────────────────────────────────────────────
  // Double-clicks on repository roast submit, browser page refreshes.
  // ── WHEN NOT TO USE: ─────────────────────────────────────────
  // When user requests an explicit fresh re-roast without an idempotency header.
  const idempotencyKey = req.headers["x-idempotency-key"];
  if (idempotencyKey) {
    if (processedKeys.has(idempotencyKey)) {
      return res.status(200).json(processedKeys.get(idempotencyKey).response);
    }
    if (redisService.isConfigured) {
      const cached = await redisService.get(`idemp:${idempotencyKey}`).catch(() => null);
      if (cached) {
        return res.status(200).json(cached);
      }
    }
  }

  // ── Quota Enforcement for Free Authenticated Users ───────────
  // WHAT: Enforces daily 1-roast limit for free authenticated accounts on repository roasts.
  // WHY: Prevents free users from bypassing daily limits by targeting /repo/:owner/:repo directly.
  // WHERE & WHEN TO USE: In all compute/AI-intensive roast generation endpoints after idempotency check.
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
        $inc: { roastCount: 1, "stats.totalRoasts": 1 },
        $set: { lastRoastDate: req.user.lastRoastDate },
      }).catch((e) =>
        logger.error("RepoRoast", "User atomic update failed", { message: e.message })
      );
    }

    const responseData = { success: true, data: repoAnalysis };

    if (idempotencyKey) {
      if (processedKeys.size >= 1000) {
        const firstKey = processedKeys.keys().next().value;
        processedKeys.delete(firstKey);
      }
      processedKeys.set(idempotencyKey, {
        response: responseData,
        time: Date.now(),
      });
      if (redisService.isConfigured) {
        redisService.set(`idemp:${idempotencyKey}`, responseData, 60).catch(() => {});
      }
    }

    return res.status(200).json(responseData);
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

  const VALID_PERSONAS = new Set(["classic", "hinglish", "techbro", "ramsay", "shakespearean"]);
  const rawPersona = (req.query.persona || "").toLowerCase().trim();
  const persona = VALID_PERSONAS.has(rawPersona) ? rawPersona : (req.user?.customPreferences?.defaultPersona || "classic");

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
    let clientAborted = false;
    req.on("close", () => {
      clientAborted = true;
    });

    if (isPro && process.env.GEMINI_API_KEY) {
      roastSource = "ai";
      for await (const chunk of generateAIRoastStream(data, intensity, persona)) {
        if (clientAborted || res.writableEnded || res.destroyed) break;
        fullRoast += chunk;
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    }

    // Fallback if AI yielded nothing or Free tier
    if (!fullRoast && !clientAborted && !res.writableEnded && !res.destroyed) {
      fullRoast = generateRoast(data, intensity, persona);
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
    /* 
      ── WHAT: ────────────────────────────────────────────────────────
      Client disconnect guard for SSE stream persistence.
      
      ── WHY: ─────────────────────────────────────────────────────────
      If the client disconnects prematurely or the stream was aborted,
      fullRoast will be empty or incomplete. Skipping save prevents corrupting
      the user's profile history and avoids wrongfully docking daily roast quota.
      
      ── WHERE & WHEN TO USE: ─────────────────────────────────────────
      Immediately prior to database persistence in SSE streaming endpoints.
      
      ── USE CASES: ───────────────────────────────────────────────────
      Handling user navigation away from an in-flight AI roast generation.
      
      ── WHEN NOT TO USE: ─────────────────────────────────────────────
      Background detached workers that must run to completion.
    */
    if (clientAborted || !fullRoast || fullRoast.trim().length < 20) {
      logger.warn("RoastStream", `Stream aborted or incomplete for ${data.username} — skipping save`);
      return;
    }

    const newRoast = await Roast.create({
      username: data.username,
      roastedBy: req.user?._id || null,
      score: data.score,
      grade: data.grade,
      roastText: fullRoast,
      intensity,
      persona,
      isPrivate: Boolean(req.user?.customPreferences?.hideFromLeaderboard),
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
        $inc: { roastCount: 1, "stats.totalRoasts": 1 },
        $set: { lastRoastDate: req.user.lastRoastDate },
      }).catch((e) =>
        logger.error("RoastStream", "User atomic update failed", { message: e.message }),
      );
    }

    // 3. Emit done event
    if (!res.writableEnded && !res.destroyed) {
      res.write(
        `event: done\ndata: ${JSON.stringify({
          roastId: newRoast._id,
          fullRoast,
          roastSource,
          redemptionPlan,
        })}\n\n`
      );
      res.end();
    }
  } catch (err) {
    logger.error("RoastStream", `Stream failed for ${username}`, { message: err.message });
    if (!res.writableEnded && !res.destroyed) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message || "Roast failed" })}\n\n`);
      res.end();
    }
  }
});

// ─── GET /api/roast/rate-limit-status ─────────────────────────
/* 
  ── WHAT: ────────────────────────────────────────────────────────
  Endpoint returning caller rate limit quota, authenticated state, and Pro privileges.
  
  ── WHY: ─────────────────────────────────────────────────────────
  1. Prevents the dynamic route trap where requests to /rate-limit-status
     match router.get("/:username"), burning GitHub API quota on user "rate-limit-status".
  2. Centralizes rate limit and subscription quota inspection for frontend banners.
  
  ── WHERE & WHEN TO USE: ─────────────────────────────────────────
  Must be mounted strictly before router.get("/:username") in routes/roast.js.
  
  ── USE CASES: ───────────────────────────────────────────────────
  Landing page rate-limit countdown banners, profile quota status chips.
  
  ── WHEN NOT TO USE: ─────────────────────────────────────────────
  Do not use to bypass backend rate limiter middleware checks.
*/
router.get("/rate-limit-status", optionalAuth, async (req, res) => {
  res.setHeader("Cache-Control", "no-store, private");

  const isPro = req.user?.isPro || false;
  const isAuthenticated = Boolean(req.user);
  let canRoast = true;
  let remainingToday = isPro ? Infinity : 1;

  if (isAuthenticated && !isPro) {
    canRoast = req.user.canRoastToday();
    remainingToday = canRoast ? 1 : 0;
  }

  return res.status(200).json({
    success: true,
    authenticated: isAuthenticated,
    isPro,
    canRoast,
    remainingToday: isPro ? "unlimited" : remainingToday,
    plan: req.user?.proPlan || (isPro ? "roaster" : "free"),
    resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
  });
});

// ─── GET /api/roast/:username ─────────────────────────────
router.get("/:username", optionalAuth, verifyCaptcha, async (req, res) => {
  const { username } = req.params;

  // ── Input validation ──────────────────────────────────
  // ── WHAT: ────────────────────────────────────────────────────
  // Validates username format against GitHub RFC specifications (max 39 chars, alphanumeric + hyphens).
  // ── WHY: ─────────────────────────────────────────────────────
  // Fail-fast validation prevents executing intensity checks, idempotency lookups,
  // or hitting downstream APIs with malformed requests.
  // ── WHERE & WHEN TO USE: ─────────────────────────────────────
  // First step in any endpoint accepting user-provided URL route parameters.
  // ── USE CASES: ───────────────────────────────────────────────
  // Sanitizing direct route access or automated scanner requests.
  // ── WHEN NOT TO USE: ─────────────────────────────────────────
  // Do not use if routing by internal ObjectIds or email identifiers.
  if (!username || username.length > 39 || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
      message: "Invalid GitHub username format.",
    });
  }

  const isPro = req.user?.isPro || false;
  const idempotencyKey = req.headers["x-idempotency-key"];

  // WHY: read intensity from query param
  //      validate it — only allow known values
  //      default to 'savage' if missing or invalid
  const rawIntensity = req.query.intensity || "savage";
  const intensity = ["mild", "savage", "nuclear"].includes(rawIntensity)
    ? rawIntensity
    : "savage";

  const VALID_PERSONAS = new Set(["classic", "hinglish", "techbro", "ramsay", "shakespearean"]);
  const rawPersona = (req.query.persona || "").toLowerCase().trim();
  const persona = VALID_PERSONAS.has(rawPersona) ? rawPersona : (req.user?.customPreferences?.defaultPersona || "classic");

  // WHY: Nuclear requires Pro
  //      free users who somehow bypass frontend check are caught here
  if (intensity === "nuclear" && !isPro) {
    return res.status(403).json({
      error: "PRO_REQUIRED",
      message:
        "☢️ Nuclear intensity requires Pro. Upgrade to unlock maximum roast.",
    });
  }

  // ── Idempotency check (Distributed Redis + In-Memory Fallback) ──
  // ── WHAT: ────────────────────────────────────────────────────
  // Checks cloud Redis and in-memory store for previous roast response.
  // ── WHY: ─────────────────────────────────────────────────────
  // React StrictMode triggers double mounting in dev/staging, and mobile
  // users often double-tap buttons. Using distributed Redis locks prevents
  // duplicate GitHub API quota consumption and Google Gemini AI token spend.
  // ── WHERE & WHEN TO USE: ─────────────────────────────────────
  // At the start of resource-heavy generation pipelines when X-Idempotency-Key is provided.
  // ── USE CASES: ───────────────────────────────────────────────
  // Cloud-synchronized deduplication across multi-container Render deployments.
  // ── WHEN NOT TO USE: ─────────────────────────────────────────
  // Do not use on mutating state operations requiring unique nonces.
  if (idempotencyKey) {
    if (processedKeys.has(idempotencyKey)) {
      return res.status(200).json(processedKeys.get(idempotencyKey).response);
    }
    if (redisService.isConfigured) {
      const cached = await redisService.get(`idemp:${idempotencyKey}`).catch(() => null);
      if (cached) {
        return res.status(200).json(cached);
      }
    }
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
      // WHY: AI roast for Pro — pass intensity and persona to tune the prompt
      roast = await generateAIRoast(data, intensity, persona);
      if (roast) {
        roastSource = "ai";
      } else {
        roast = generateRoast(data, intensity, persona);
      }
    } else {
      // WHY: rule engine for free — pass intensity and persona for tone variation
      roast = generateRoast(data, intensity, persona);
    }

    if (!roast || roast.trim().length === 0) {
      roast = `@${username}'s GitHub exists. That's the nicest thing the data supports.`;
    }

    data.roast = roast;
    data.roastSource = roastSource;
    data.intensity = intensity; // WHY: frontend can show intensity badge
    data.persona = persona; // WHY: frontend can show persona badge

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
        persona, // WHY: track which persona archetype was used
        isPrivate: Boolean(req.user?.customPreferences?.hideFromLeaderboard),
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
        $inc: { roastCount: 1, "stats.totalRoasts": 1 },
        $set: { lastRoastDate: req.user.lastRoastDate },
      }).catch((e) =>
        logger.error("Roast", "User atomic update failed", { message: e.message }),
      );
    }

    const responseData = { success: true, data };

    if (idempotencyKey) {
      // 1. In-memory fallback cap & store
      if (processedKeys.size >= 1000) {
        // Evict oldest entries when capacity reached
        const firstKey = processedKeys.keys().next().value;
        processedKeys.delete(firstKey);
      }
      processedKeys.set(idempotencyKey, {
        response: responseData,
        time: Date.now(),
      });

      // 2. Distributed Cloud Redis cache (60 seconds TTL)
      // ── WHAT: ────────────────────────────────────────────────────
      // Caches completed roast payload in Upstash Redis with 60s TTL.
      // ── WHY: ─────────────────────────────────────────────────────
      // Synchronizes idempotency state across ephemeral container restarts.
      // ── WHERE & WHEN TO USE: ─────────────────────────────────────
      // Immediately after successful roast synthesis and database persistence.
      // ── USE CASES: ───────────────────────────────────────────────
      // Rapid duplicate request deduplication across browser tabs.
      // ── WHEN NOT TO USE: ─────────────────────────────────────────
      // Do not store permanent user profiles in ephemeral Redis keys.
      if (redisService.isConfigured) {
        redisService.set(`idemp:${idempotencyKey}`, responseData, 60).catch(() => {});
      }
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
