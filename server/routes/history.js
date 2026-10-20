const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Roast = require("../models/Roast");
const Battle = require("../models/Battle");
const User = require("../models/User");
const redisService = require("../services/redisService");
const { logger } = require("../utils/logger");
const { getCompanyLeaderboard } = require("../services/companyRoastService");

router.get("/leaderboard/worst", async (req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=120",
  );
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const cacheKey = `cache:lb:page:${page}:limit:${limit}`;
    if (redisService.isConfigured) {
      const cached = await redisService.get(cacheKey).catch(() => null);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    const result = await Roast.getLeaderboard({ page, limit });
    const responseData = {
      success: true,
      leaderboard: result.entries,
      pagination: result.pagination,
    };

    if (redisService.isConfigured) {
      redisService.set(cacheKey, responseData, 60).catch(() => {});
    }

    return res.status(200).json(responseData);
  } catch (err) {
    logger.error("Leaderboard", "Fetch failed", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Could not fetch leaderboard.",
    });
  }
});

const { computeSignals, nicknameFor } = require("../services/talentEvidence");
const SIGNAL_LABELS = { depth: "Project depth", consistency: "Consistency", documentation: "Documentation", collaboration: "Collaboration" };

// Wall of Shame — evidence board (best-first, Ghost Mode excluded).
router.get("/leaderboard/board", async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const windowWeeks = [0, 4, 12, 52].includes(parseInt(req.query.weeks, 10)) ? parseInt(req.query.weeks, 10) : 12;
    const language = String(req.query.language || "").trim().slice(0, 30);
    const q = String(req.query.q || "").trim().toLowerCase().slice(0, 39);

    let result = await Roast.getEvidenceBoard({ page, limit, windowWeeks, language });
    if (result.pagination.total === 0 && windowWeeks > 0) {
      result = await Roast.getEvidenceBoard({ page, limit, windowWeeks: 0, language });
    }
    let entries = result.entries.map((e, i) => {
      const signals = computeSignals(e.githubSnapshot || {});
      const best = Object.entries(signals)
        .filter(([, s]) => typeof s.value === "number")
        .sort((a, b) => b[1].value - a[1].value)[0];
      return {
        rank: (result.pagination.page - 1) * result.pagination.limit + i + 1,
        username: e.username,
        score: e.score,
        grade: e.grade,
        topLanguage: e.topLanguage || "",
        roastCount: e.roastCount,
        analyzedAt: e.analyzedAt,
        nickname: nicknameFor(signals),
        topSignal: best ? { label: SIGNAL_LABELS[best[0]], value: best[1].value } : null,
      };
    });
    if (q) entries = entries.filter((e) => e.username.toLowerCase().includes(q));
    return res.status(200).json({ success: true, window: windowWeeks, entries, pagination: result.pagination });
  } catch (err) {
    logger.error("Leaderboard", "Board fetch failed", { message: err.message });
    return res.status(500).json({ error: "SERVER_ERROR", message: "Could not fetch the evidence board." });
  }
});

router.get("/leaderboard/companies", (req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=3600, stale-while-revalidate=7200",
  );
  try {
    const companies = getCompanyLeaderboard();
    return res.status(200).json({
      success: true,
      companies,
    });
  } catch (err) {
    logger.error("CompaniesLeaderboard", "Failed to fetch companies", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Could not fetch company leaderboard.",
    });
  }
});

router.get("/leaderboard/search", async (req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=30, stale-while-revalidate=60"
  );
  try {
    const q = (req.query.q || "").trim().slice(0, 39);
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, results: [], pagination: { total: 0, page: 1, totalPages: 0 } });
    }
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const result = await Roast.aggregate([
      { $match: { username: { $regex: safeQ, $options: "i" }, isPrivate: { $ne: true } } },
      { $project: { username: { $toLower: "$username" }, score: 1 } },
      { $group: { _id: "$username", bestScore: { $min: "$score" }, roastCount: { $sum: 1 } } },
      { $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $sort: { bestScore: 1 } }, { $skip: skip }, { $limit: limit }],
      }},
    ]);

    const total = result[0]?.metadata?.[0]?.total || 0;
    const entries = result[0]?.data || [];
    return res.status(200).json({
      success: true,
      results: entries,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasNext: page < Math.ceil(total / limit), hasPrev: page > 1 },
    });
  } catch (err) {
    logger.error("Leaderboard Search", "Search failed", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Could not search leaderboard.",
    });
  }
});

router.get("/daily-burn", async (req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=600",
  );
  try {
    const cacheKey = "cache:roast:daily-burn";
    if (redisService.isConfigured) {
      const cached = await redisService.get(cacheKey).catch(() => null);
      if (cached) {
        return res.status(200).json(cached);
      }
    }

    const topRoast = await Roast.findOne({
      roastText: { $exists: true, $ne: "" },
    })
      .sort({ "reactions.savage": -1, "reactions.destroyed": -1, createdAt: -1 })
      .select("_id username score grade roastText reactions avatarUrl")
      .lean();

    let responseData;
    if (topRoast) {
      responseData = {
        success: true,
        roast: {
          roastId: topRoast._id,
          id: topRoast._id,
          username: topRoast.username,
          score: topRoast.score,
          grade: topRoast.grade,
          roastText: topRoast.roastText,
          reactions: topRoast.reactions || { relatable: 0, destroyed: 0, savage: 0 },
          avatarUrl: topRoast.avatarUrl || `https://avatars.githubusercontent.com/${topRoast.username}?s=96`,
        },
      };
    } else {
      responseData = {
        success: true,
        roast: {
          username: "torvalds",
          score: 18,
          grade: "F",
          roastText: "Your git log reads like an anger management transcript. 30 years of C code and still not a single unit test in sight.",
          reactions: { relatable: 142, destroyed: 420, savage: 690 },
          avatarUrl: "https://avatars.githubusercontent.com/torvalds?s=96",
        },
      };
    }

    if (redisService.isConfigured) {
      redisService.set(cacheKey, responseData, 60).catch(() => {});
    }

    return res.status(200).json(responseData);
  } catch (err) {
    logger.warn("DailyBurn", "Fallback triggered", { message: err.message });
    return res.status(200).json({
      success: true,
      roast: {
        username: "torvalds",
        score: 18,
        grade: "F",
        roastText: "Your git log reads like an anger management transcript. 30 years of C code and still not a single unit test in sight.",
        reactions: { relatable: 142, destroyed: 420, savage: 690 },
        avatarUrl: "https://avatars.githubusercontent.com/torvalds?s=96",
      },
    });
  }
});

router.get("/:username", async (req, res) => {
  const { username } = req.params;

  if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
      message: "Invalid GitHub username.",
    });
  }

  try {
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10));
    const history = await Roast.getHistory(username, limit);

    return res.status(200).json({
      success: true,
      username,
      count: history.length,
      history,
    });
  } catch (err) {
    logger.error("History", "Fetch failed", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Could not fetch history.",
    });
  }
});

router.post("/:id/share", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "INVALID_ID",
      message: "Invalid roast ID.",
    });
  }

  try {
    await Roast.incrementShare(id);
    return res.status(200).json({ success: true });
  } catch {
    return res.status(200).json({ success: true });
  }
});

router.post("/:id/view", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "INVALID_ID",
      message: "Invalid roast ID.",
    });
  }

  try {
    const updated = await Roast.incrementView(id);
    return res.status(200).json({ success: true, viewCount: updated?.viewCount || 0 });
  } catch {
    return res.status(200).json({ success: true });
  }
});

const reactionCache = new Map();
setInterval(() => reactionCache.clear(), 24 * 60 * 60 * 1000).unref();

router.post("/:id/react", async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: "INVALID_ID",
      message: "Invalid roast ID.",
    });
  }

  const allowed = ["relatable", "destroyed", "savage"];
  if (!type || !allowed.includes(type)) {
    return res.status(400).json({
      error: "INVALID_REACTION",
      message: `type must be one of: ${allowed.join(", ")}`,
    });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const cacheKey = `${ip}:${id}:${type}`;
  if (reactionCache.has(cacheKey)) {
    return res.status(200).json({
      success: true,
      duplicate: true,
      message: "Already reacted.",
    });
  }

  try {
    let updated = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      updated = await Roast.addReaction(id, type);
      if (!updated) {
        updated = await Battle.addReaction(id, type);
      }
    }

    if (!updated) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: "Roast or Battle not found.",
      });
    }

    if (reactionCache.size >= 50000) {
      const firstKey = reactionCache.keys().next().value;
      reactionCache.delete(firstKey);
    }
    reactionCache.set(cacheKey, true);

    if (updated.username) {
      const escapedUsername = String(updated.username).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      User.updateOne(
        { username: new RegExp(`^${escapedUsername}$`, "i") },
        { $inc: { "stats.reactionsReceived": 1 } }
      ).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      reactions: updated.reactions,
    });
  } catch (err) {
    logger.error("React", "Save reaction failed", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Could not save reaction.",
    });
  }
});

module.exports = router;

