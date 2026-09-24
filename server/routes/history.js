// ============================================================
// GITROAST — History Routes
// ============================================================
// WHAT: Endpoints for roast history, leaderboard, sharing, reactions.
//
// ROUTES:
//   GET  /:username       → roast history for a user
//   GET  /leaderboard/worst → Wall of Shame top 10
//   POST /:id/share       → increment share count
//   POST /:id/react       → add emoji reaction (NEW)
//
// WHY /leaderboard/worst MUST be above /:username:
//   Express matches routes top to bottom
//   /:username would catch /leaderboard/worst as username="leaderboard"
//   Specific routes ALWAYS above dynamic routes
// ============================================================

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Roast = require("../models/Roast");
const Battle = require("../models/Battle");
const { logger } = require("../utils/logger");
const { getCompanyLeaderboard } = require("../services/companyRoastService");

// ── GET /api/history/leaderboard/worst ───────────────────────
// WHY above /:username: specific route must come before dynamic
router.get("/leaderboard/worst", async (req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=60, stale-while-revalidate=120",
  );
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

    const result = await Roast.getLeaderboard({ page, limit });
    return res.status(200).json({
      success: true,
      leaderboard: result.entries,
      pagination: result.pagination,
    });
  } catch (err) {
    logger.error("Leaderboard", "Fetch failed", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Could not fetch leaderboard.",
    });
  }
});

// ── GET /api/history/leaderboard/companies ───────────────────
// WHAT: Returns curated tech giant roast rankings and developer sins
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

// ── GET /api/history/leaderboard/search ──────────────────────
// WHAT: Searches the Wall of Shame by username prefix/substring
router.get("/leaderboard/search", async (req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=30, stale-while-revalidate=60"
  );
  try {
    // 1. Extract and validate query
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.status(200).json({ success: true, results: [], pagination: { total: 0, page: 1, totalPages: 0 } });
    }
    // Sanitize for regex safety
    const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // 2. Aggregate: match by username regex, group like leaderboard, paginate
    const result = await Roast.aggregate([
      { $match: { username: { $regex: safeQ, $options: "i" } } },
      // WHY $project first: reduces RAM passed to $group — only username
      //     and score are needed for leaderboard calculation
      { $project: { username: 1, score: 1 } },
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

// ── GET /api/history/daily-burn ──────────────────────────────
// WHAT: Returns the highest-reacted "Roast of the Day"
router.get("/daily-burn", async (req, res) => {
  res.setHeader(
    "Cache-Control",
    "public, max-age=300, stale-while-revalidate=600",
  );
  try {
    const topRoast = await Roast.findOne({
      roastText: { $exists: true, $ne: "" },
    })
      .sort({ "reactions.savage": -1, "reactions.destroyed": -1, createdAt: -1 })
      .select("username score grade roastText reactions avatarUrl")
      .lean();

    if (topRoast) {
      return res.status(200).json({
        success: true,
        roast: {
          username: topRoast.username,
          score: topRoast.score,
          grade: topRoast.grade,
          roastText: topRoast.roastText,
          reactions: topRoast.reactions || { relatable: 0, destroyed: 0, savage: 0 },
          avatarUrl: topRoast.avatarUrl || `https://avatars.githubusercontent.com/${topRoast.username}?s=96`,
        },
      });
    }

    // Default curated fallback if DB empty
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

// ── GET /api/history/:username ────────────────────────────────
router.get("/:username", async (req, res) => {
  const { username } = req.params;

  if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
      message: "Invalid GitHub username.",
    });
  }

  try {
    const limit = parseInt(req.query.limit) || 10;
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

// ── POST /api/history/:id/share ───────────────────────────────
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
    // WHY always 200: share tracking failure must never break UX
    return res.status(200).json({ success: true });
  }
});

// ── POST /api/history/:id/view ────────────────────────────────
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
    // WHY always 200: view tracking failure must never break UX
    return res.status(200).json({ success: true });
  }
});

// ── POST /api/history/:id/react ───────────────────────────────
// WHAT: Adds one emoji reaction to a roast
//
// WHY no auth required:
//   Anonymous reactions = more engagement
//   Requiring login = friction = fewer reactions
//   Same UX as Twitter/Reddit likes
//
// WHY IP-based deduplication (not user ID):
//   Works for anonymous users too
//   Simple — no session management needed
//   Good enough for this scale
//   One reaction per IP per roast per type
//
// WHY store seen reactions in memory (not DB):
//   Storing every IP in DB = expensive at scale
//   In-memory Map = fast, zero DB cost
//   Trade-off: resets on server restart (acceptable)
//   At this scale: correct choice
const reactionCache = new Map();
// WHY cleanup every 24h:
//   Prevents Map growing unbounded
//   24h window = fair deduplication period
// WHY .unref(): prevents this timer from blocking process exit during tests/shutdown
// WHY cap check: prevents unbounded memory growth from IP-based keys
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

  // WHY validate type server-side:
  //   Client sends type — must validate before DB write
  //   Prevents arbitrary field injection
  const allowed = ["relatable", "destroyed", "savage"];
  if (!type || !allowed.includes(type)) {
    return res.status(400).json({
      error: "INVALID_REACTION",
      message: `type must be one of: ${allowed.join(", ")}`,
    });
  }

  // WHY x-forwarded-for:
  //   Render sits behind proxy — real IP in this header
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  // WHY compound key (ip + id + type):
  //   Same IP can react with DIFFERENT emojis to same roast
  //   But cannot react SAME emoji twice
  //   e.g. user can click 😂 AND 💀 but not 😂 twice
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
        // Dynamic fallback: check if ID belongs to a Battle document
        updated = await Battle.addReaction(id, type);
      }
    }

    if (!updated) {
      return res.status(404).json({
        error: "NOT_FOUND",
        message: "Roast or Battle not found.",
      });
    }

    // WHY cap: prevents unbounded Map growth from spoofed IPs or bot traffic
    if (reactionCache.size >= 50000) reactionCache.clear();
    // WHY mark after successful DB write:
    //   If DB fails — don't cache — user can try again
    //   Only mark seen when we're sure it worked
    reactionCache.set(cacheKey, true);

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
