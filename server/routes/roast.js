const express = require("express");
const router = express.Router();
const { analyzeProfile, analyzeWrapped, analyzeUniverse } = require("../services/githubService");
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
const { normalizeIntensity, toEngineIntensity, normalizePersona } = require("../utils/constants");
const { computeSignals, MODEL_VERSION: EVIDENCE_MODEL } = require("../services/talentEvidence");
const { getAiQuota, canUseAi, afterConsuming } = require("../services/quota");

const nextUtcMidnight = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString();
};

// Explainable score anatomy shown on the result page (same public-evidence model as recruiter view).
function anatomyOf(data) {
  return {
    model: EVIDENCE_MODEL,
    signals: computeSignals({
      totalRepos: data.totalRepos,
      abandonedCount: data.repoAnalysis?.abandonedCount || 0,
      totalStars: data._raw?.totalStars || 0,
      hasReadme: data.readme?.exists || false,
      commitQuality: data.commitAnalysis?.qualityScore || 0,
      collab: data.collab || null,
    }),
  };
}

const processedKeys = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of processedKeys.entries()) {
    if (now - val.time > 60000) processedKeys.delete(key);
  }
}, 60000).unref();

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

router.get("/stats", async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  try {
    const count = await Roast.estimatedDocumentCount();
    return res.status(200).json({ success: true, totalRoasts: count });
  } catch {
    return res.status(200).json({ success: true, totalRoasts: 0 });
  }
});

router.get("/:username/wrapped", optionalAuth, verifyCaptcha, async (req, res) => {
  const { username } = req.params;

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
    if (err.message === "ORGANIZATION_NOT_SUPPORTED") {
      return res.status(400).json({
        error: "ORGANIZATION_NOT_SUPPORTED",
        message: "Organizations cannot be roasted. Enter a personal developer username.",
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
      });
    }
    logger.error("Wrapped", `Error for ${username}`, { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Failed to generate Wrapped report.",
    });
  }
});

router.get("/:username/universe", optionalAuth, verifyCaptcha, async (req, res) => {
  const { username } = req.params;
  const isPro = req.user?.isPro || false;
  const authUsername = req.user?.username || null;
  const githubToken = req.user?.githubAccessToken || null;

  if (!username || username.length > 39 || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
      message: "GitHub usernames can only contain letters, numbers, and hyphens.",
    });
  }

  const isOwnProfileAndPro = Boolean(isPro && authUsername && username.toLowerCase() === authUsername.toLowerCase());
  const cacheKey = isOwnProfileAndPro
    ? `universe:${username.toLowerCase()}:private`
    : `universe:${username.toLowerCase()}:public`;

  if (redisService.isConfigured) {
    const cached = await redisService.get(cacheKey).catch(() => null);
    if (cached) {
      if (isOwnProfileAndPro) {
        res.setHeader("Cache-Control", "private, no-cache");
      } else {
        res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
      }
      return res.status(200).json({ success: true, universe: cached, cached: true });
    }
  }

  try {
    const universe = await analyzeUniverse(
      username,
      githubToken,
      authUsername,
      isPro,
    );

    if (redisService.isConfigured) {
      redisService.set(cacheKey, universe, 600).catch(() => {});
    }

    if (isOwnProfileAndPro) {
      res.setHeader("Cache-Control", "private, no-cache");
    } else {
      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    }
    return res.status(200).json({ success: true, universe });
  } catch (err) {
    if (err.code === "ORGANIZATION_NOT_SUPPORTED") {
      return res.status(400).json({
        error: "ORGANIZATION_NOT_SUPPORTED",
        message: `@${username} is an Organization. 3D Solar Systems are generated for individual developers!`,
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
        message: "GitHub rate limit hit. Try again in 60 seconds or log in with GitHub.",
      });
    }
    logger.error("Universe", `Error generating universe for ${username}`, { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Failed to generate 3D Code Solar System.",
    });
  }
});

router.get("/repo/:owner/:repo", optionalAuth, verifyCaptcha, async (req, res) => {
  const { owner, repo } = req.params;
  const isPro = req.user?.isPro || false;
  const intensity = normalizeIntensity(req.query.intensity);

  if (intensity === "nuclear" && !isPro) {
    return res.status(403).json({
      error: "PRO_REQUIRED",
      message: "Nuclear intensity is exclusively for GitRoast Pro members. Upgrade to unlock maximum destruction.",
    });
  }

  const validOwner = /^[a-zA-Z0-9-]+$/.test(owner || "");
  const validRepo = /^[a-zA-Z0-9._-]+$/.test(repo || "");
  if (!owner || !repo || owner.length > 39 || repo.length > 100 || !validOwner || !validRepo) {
    return res.status(400).json({
      error: "INVALID_REPO",
      message: "Invalid repository owner or name.",
    });
  }

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

  if (req.user && !isPro) {
    const canRoast = req.user.canRoastToday();
    if (!canRoast) {
      return res.status(429).json({
        error: "DAILY_LIMIT_REACHED",
        message: "Free accounts get 1 roast per day. It resets at midnight UTC.",
        resetsAt: nextUtcMidnight(),
      });
    }
  }

  try {
    const userToken = req.user?.githubAccessToken || null;
    const repoAnalysis = await analyzeRepository(owner, repo, userToken, isPro, toEngineIntensity(intensity));

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { roastCount: 1, "stats.totalRoasts": 1 },
        $set: { lastRoastDate: new Date() },
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

router.get("/:username/stream", optionalAuth, verifyCaptcha, async (req, res) => {
  const { username } = req.params;
  const isPro = req.user?.isPro || false;
  const intensity = normalizeIntensity(req.query.intensity || req.user?.customPreferences?.defaultIntensity);

  const persona = normalizePersona(req.query.persona || req.user?.customPreferences?.defaultPersona);

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

  if (req.user && !isPro) {
    const canRoast = req.user.canRoastToday();
    if (!canRoast) {
      return res.status(429).json({
        error: "DAILY_LIMIT_REACHED",
        message: "Free accounts get 1 roast per day. It resets at midnight UTC.",
        resetsAt: nextUtcMidnight(),
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

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  try {
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
        anatomy: anatomyOf(data),
        intensity,
        persona,
        isPro,
      })}\n\n`
    );

    let fullRoast = "";
    let roastSource = "rules";
    let clientAborted = false;
    req.on("close", () => {
      clientAborted = true;
    });

    const aiQuota = await getAiQuota(req.user).catch(() => null);
    if (process.env.GEMINI_API_KEY && canUseAi(aiQuota)) {
      roastSource = "ai";
      for await (const chunk of generateAIRoastStream(data, toEngineIntensity(intensity), persona)) {
        if (clientAborted || res.writableEnded || res.destroyed) break;
        fullRoast += chunk;
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    }

    if (!fullRoast && !clientAborted && !res.writableEnded && !res.destroyed) {
      fullRoast = generateRoast(data, toEngineIntensity(intensity), persona);
      roastSource = "rules";
      res.write(`event: chunk\ndata: ${JSON.stringify({ text: fullRoast })}\n\n`);
    }

    let redemptionPlan = [];
    if (isPro) {
      try {
        redemptionPlan = await generateAIRedemptionPlan(data);
      } catch (e) {
        logger.warn("RoastStream", "Failed to generate redemption plan", { message: e.message });
      }
    }

    if (clientAborted || !fullRoast || fullRoast.trim().length < 20) {
      logger.warn("RoastStream", `Stream aborted or incomplete for ${data.username} — skipping save`);
      return;
    }

    const isOwnProfile = Boolean(req.user && req.user.username.toLowerCase() === data.username.toLowerCase());
    const isPrivate = isOwnProfile ? Boolean(req.user?.customPreferences?.hideFromLeaderboard) : false;

    const newRoast = await Roast.create({
      username: data.username,
      roastedBy: req.user?._id || null,
      score: data.score,
      grade: data.grade,
      roastText: fullRoast,
      intensity,
      persona,
      isPrivate,
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
        collab: data.collab || null,
        topRepos: data.topRepos || [],
          repoHighlight: data.repoHighlight || null,
      },
      stats: data.stats,
      shameCommits: data.shameCommits,
      bioContrast: data.bioContrast || {},
      redemptionPlan,
      isPro,
    });

    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { roastCount: 1, "stats.totalRoasts": 1 },
        $set: { lastRoastDate: new Date() },
      }).catch((e) =>
        logger.error("RoastStream", "User atomic update failed", { message: e.message }),
      );
    }

    if (!res.writableEnded && !res.destroyed) {
      res.write(
        `event: done\ndata: ${JSON.stringify({
          roastId: newRoast._id,
          fullRoast,
          roastSource,
          redemptionPlan,
          quota: roastSource === "ai" ? afterConsuming(aiQuota) : aiQuota,
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

  const aiQuota = await getAiQuota(req.user).catch(() => null);

  return res.status(200).json({
    success: true,
    authenticated: isAuthenticated,
    aiQuota,
    isPro,
    canRoast,
    remainingToday: isPro ? "unlimited" : remainingToday,
    plan: req.user?.proPlan || (isPro ? "roaster" : "free"),
    resetAt: new Date(new Date().setHours(24, 0, 0, 0)).toISOString(),
  });
});

router.get("/:username", optionalAuth, verifyCaptcha, async (req, res) => {
  const { username } = req.params;

  if (!username || username.length > 39 || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
      message: "Invalid GitHub username format.",
    });
  }

  const isPro = req.user?.isPro || false;
  const idempotencyKey = req.headers["x-idempotency-key"];

  const intensity = normalizeIntensity(req.query.intensity || req.user?.customPreferences?.defaultIntensity);

  const persona = normalizePersona(req.query.persona || req.user?.customPreferences?.defaultPersona);

  if (intensity === "nuclear" && !isPro) {
    return res.status(403).json({
      error: "PRO_REQUIRED",
      message:
        "☢️ Nuclear intensity requires Pro. Upgrade to unlock maximum roast.",
    });
  }

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

  if (req.user && !isPro) {
    const canRoast = req.user.canRoastToday();
    if (!canRoast) {
      return res.status(429).json({
        error: "DAILY_LIMIT_REACHED",
        message: "Free accounts get 1 roast per day. It resets at midnight UTC.",
        resetsAt: nextUtcMidnight(),
      });
    }
  }

  try {
    const githubToken = req.user?.githubAccessToken || null;
    const authUsername = req.user?.username || null;
    const data = await analyzeProfile(username, githubToken, authUsername, isPro);

    let roast = null;
    let roastSource = "rules";

    const aiQuota = await getAiQuota(req.user).catch(() => null);
    if (canUseAi(aiQuota)) {
      roast = await generateAIRoast(data, toEngineIntensity(intensity), persona);
      if (roast) {
        roastSource = "ai";
      } else {
        roast = generateRoast(data, toEngineIntensity(intensity), persona);
      }
    } else {
      roast = generateRoast(data, toEngineIntensity(intensity), persona);
    }

    if (!roast || roast.trim().length === 0) {
      roast = `@${username}'s GitHub exists. That's the nicest thing the data supports.`;
    }

    data.roast = roast;
    data.roastSource = roastSource;
    data.intensity = intensity;
    data.persona = persona;

    let redemptionPlan = [];
    if (isPro) {
      try {
        redemptionPlan = await generateAIRedemptionPlan(data);
      } catch (e) {
        logger.warn("Roast", "Failed to generate redemption plan", { message: e.message });
      }
    }
    data.redemptionPlan = redemptionPlan;

    try {
      const isOwnProfile = Boolean(req.user && req.user.username.toLowerCase() === username.toLowerCase());
      const isPrivate = isOwnProfile ? Boolean(req.user?.customPreferences?.hideFromLeaderboard) : false;

      data.anatomy = anatomyOf(data);
      const savedRoast = await Roast.create({
        username,
        roastedBy: req.user?._id || null,
        score: data.score,
        grade: data.grade,
        roastText: roast,
        roastSource,
        intensity,
        persona,
        isPrivate,
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
          collab: data.collab || null,
          topRepos: data.topRepos || [],
          repoHighlight: data.repoHighlight || null,
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
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { roastCount: 1, "stats.totalRoasts": 1 },
        $set: { lastRoastDate: new Date() },
      }).catch((e) =>
        logger.error("Roast", "User atomic update failed", { message: e.message }),
      );
    }

    data.isPro = isPro;
    data.watermark = !isPro;
    data.roastSource = roastSource;
    data.quota = roastSource === "ai" ? afterConsuming(aiQuota) : aiQuota;
    const responseData = { success: true, data };

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

