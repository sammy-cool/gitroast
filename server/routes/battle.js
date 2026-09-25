// WHERE: server/routes/battle.js

const express = require("express");
const router = express.Router();
const { runBattle } = require("../services/battleService");
const { optionalAuth } = require("../middleware/auth");
const { verifyCaptcha } = require("../middleware/captcha");
const { logger } = require("../utils/logger");

const mongoose = require("mongoose");
const Battle = require("../models/Battle");
const User = require("../models/User");
const redisService = require("../services/redisService");

// In-memory reaction deduplication cache (ip:id:type -> true)
const battleReactionCache = new Map();
// WHY .unref(): prevents background interval from blocking process shutdown/tests
setInterval(() => battleReactionCache.clear(), 24 * 60 * 60 * 1000).unref();

// ─── GET /api/battle/:user1/vs/:user2 ────────────────────
// WHY: GET not POST — results are cacheable + shareable URLs work
router.get("/:user1/vs/:user2", optionalAuth, verifyCaptcha, async (req, res) => {
  const { user1, user2 } = req.params;

  // ── Validate both usernames ───────────────────────────
  const usernameRegex = /^[a-zA-Z0-9-]+$/;
  if (
    !user1 ||
    user1.length > 39 ||
    !usernameRegex.test(user1) ||
    !user2 ||
    user2.length > 39 ||
    !usernameRegex.test(user2)
  ) {
    return res.status(400).json({
      error: "INVALID_USERNAME",
      message: "Invalid GitHub username format.",
    });
  }

  // WHY: no battling yourself
  if (user1.toLowerCase() === user2.toLowerCase()) {
    return res.status(400).json({
      error: "SAME_USER",
      message: "You cannot battle yourself. Even if you want to.",
    });
  }

  const norm1 = (user1 || "").toLowerCase();
  const norm2 = (user2 || "").toLowerCase();
  const battlePairKey = [norm1, norm2].sort().join("-vs-");
  const cacheKey = `cache:battle:${battlePairKey}`;

  // ── Distributed Battle Cache (60s TTL) ──────────────────────
  // ── WHAT: ────────────────────────────────────────────────────
  // Checks cloud Redis for recent match results between this pair.
  // ── WHY: ─────────────────────────────────────────────────────
  // A battle triggers 2 complete GitHub profile analyses plus Gemini AI
  // announcer synthesis. Caching recent results for 60s eliminates redundant
  // API calls when both rivals load the challenge link simultaneously.
  // ── WHERE & WHEN TO USE: ─────────────────────────────────────
  // Bidirectional head-to-head match fetches.
  // ── USE CASES: ───────────────────────────────────────────────
  // Shared challenge links clicked from Discord, WhatsApp, or Twitter.
  // ── WHEN NOT TO USE: ─────────────────────────────────────────
  // When a rematch action is explicitly requested.
  if (redisService.isConfigured) {
    const cached = await redisService.get(cacheKey).catch(() => null);
    if (cached) {
      return res.status(200).json(cached);
    }
  }

  try {
    const token = req.user?.githubAccessToken || null;
    const result = await runBattle(user1, user2, token);

    // ── Save or update battle in MongoDB to persist reactions ──
    try {
      let battleDoc = await Battle.findOne({
        $or: [
          { user1: norm1, user2: norm2 },
          { user1: norm2, user2: norm1 },
        ],
      });
      const isNewBattle = !battleDoc;
      if (battleDoc) {
        const isReversed = battleDoc.user1 === norm2 && battleDoc.user2 === norm1;
        if (isReversed) {
          battleDoc.score1 = result.score2;
          battleDoc.score2 = result.score1;
          battleDoc.grade1 = result.grade2;
          battleDoc.grade2 = result.grade1;
          battleDoc.roast1 = result.roast2;
          battleDoc.roast2 = result.roast1;
          battleDoc.stats1 = result.stats2;
          battleDoc.stats2 = result.stats1;
        } else {
          battleDoc.score1 = result.score1;
          battleDoc.score2 = result.score2;
          battleDoc.grade1 = result.grade1;
          battleDoc.grade2 = result.grade2;
          battleDoc.roast1 = result.roast1;
          battleDoc.roast2 = result.roast2;
          battleDoc.stats1 = result.stats1;
          battleDoc.stats2 = result.stats2;
        }
        battleDoc.winner = result.winner;
        battleDoc.loser = result.loser;
        battleDoc.battleRoast = result.battleRoast;
        battleDoc.rematchCount = (battleDoc.rematchCount || 0) + 1;
        await battleDoc.save();
      } else {
        battleDoc = await Battle.create({
          user1: norm1,
          user2: norm2,
          avatarUrl1: `https://avatars.githubusercontent.com/${norm1}?s=120`,
          avatarUrl2: `https://avatars.githubusercontent.com/${norm2}?s=120`,
          ...result,
        });
      }

      result._id = battleDoc._id;
      result.battleId = battleDoc._id;
      result.reactions = battleDoc.reactions || { relatable: 0, destroyed: 0, savage: 0 };

      // ── Wire Battle Win/Loss Counters into User Model ───────────
      // WHAT: Atomically increments battlesWon / battlesLost on registered user accounts.
      // WHY: The User schema declares stats.battlesWon and stats.battlesLost;
      //      updating them asynchronously guarantees real player rivalry statistics.
      // WHERE & WHEN TO USE: Whenever a brand-new head-to-head battle yields a decisive winner.
      // USE CASES: Player rivalry profiles, win/loss leaderboards.
      // WHEN NOT TO USE: On page reloads or rematches to prevent artificial counter inflation.
      if (isNewBattle && result.winner && result.winner !== "tie" && result.loser) {
        User.updateOne(
          { username: new RegExp(`^${result.winner}$`, "i") },
          { $inc: { "stats.battlesWon": 1 } }
        ).catch(() => {});
        User.updateOne(
          { username: new RegExp(`^${result.loser}$`, "i") },
          { $inc: { "stats.battlesLost": 1 } }
        ).catch(() => {});
      }
    } catch (dbErr) {
      // Non-blocking: if MongoDB is temporarily disconnected, return computed battle
      logger.warn("Battle", "Failed to persist battle in DB", { message: dbErr.message });
      result.reactions = { relatable: 0, destroyed: 0, savage: 0 };
    }

    const responsePayload = { success: true, data: result };
    if (redisService.isConfigured) {
      redisService.set(cacheKey, responsePayload, 60).catch(() => {});
    }

    return res.status(200).json(responsePayload);
  } catch (err) {
    if (err.message === "ORGANIZATION_NOT_SUPPORTED" || err.code === "ORGANIZATION_NOT_SUPPORTED") {
      return res.status(400).json({
        error: "ORGANIZATION_NOT_SUPPORTED",
        message: "GitRoast battles are for individual developers, not organizations.",
      });
    }
    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
        message: "One or both GitHub users not found. Check the usernames.",
      });
    }
    if (err.message === "RATE_LIMIT_EXCEEDED") {
      return res.status(429).json({
        error: "RATE_LIMIT_EXCEEDED",
        message: "GitHub rate limit hit. Try again in 60 seconds.",
      });
    }
    logger.error("Battle", "Route error", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Battle failed. Both developers live to code another day.",
    });
  }
});

// ─── POST /api/battle/:id/react ───────────────────────────
// WHAT: Records emoji reaction (relatable/destroyed/savage) for a battle
router.post("/:id/react", async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  const allowed = ["relatable", "destroyed", "savage"];
  if (!type || !allowed.includes(type)) {
    return res.status(400).json({
      error: "INVALID_TYPE",
      message: `type must be one of: ${allowed.join(", ")}`,
    });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown";

  // ── Symmetrical Rivalry Deduplication Cache Key ─────────────
  // ── WHAT: ────────────────────────────────────────────────────
  // Normalizes rivalry participant order so that reacting to "alice-vs-bob"
  // shares the exact same deduplication cache key as "bob-vs-alice".
  //
  // ── WHY: ─────────────────────────────────────────────────────
  // Prevents malicious or accidental duplicate reaction bursts by swapping participant URL order.
  //
  // ── WHERE & WHEN TO USE: ─────────────────────────────────────
  // In any bilateral or symmetrical matchup deduplication system.
  //
  // ── USE CASES: ───────────────────────────────────────────────
  // Battle reaction rate limiting and duplicate avoidance.
  //
  // ── WHEN NOT TO USE: ─────────────────────────────────────────
  // Do not use for directional actions (e.g. following, unfollowing, blocking).
  const normalizedId = id.includes("-vs-")
    ? id.split("-vs-").map((s) => (s || "").trim().toLowerCase()).sort().join("-vs-")
    : id;
  const cacheKey = `${ip}:${normalizedId}:${type}`;
  if (battleReactionCache.has(cacheKey)) {
    return res.status(200).json({
      success: true,
      duplicate: true,
      message: "Already reacted to this battle.",
    });
  }

  try {
    let updated = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      updated = await Battle.addReaction(id, type);
    } else if (id.includes("-vs-")) {
      const [u1, u2] = id.split("-vs-");
      const norm1 = (u1 || "").trim().toLowerCase();
      const norm2 = (u2 || "").trim().toLowerCase();
      const battle = await Battle.findOne({
        $or: [
          { user1: norm1, user2: norm2 },
          { user1: norm2, user2: norm1 },
        ],
      });
      if (battle) {
        updated = await Battle.addReaction(battle._id, type);
      }
    }

    if (!updated) {
      return res.status(404).json({
        error: "BATTLE_NOT_FOUND",
        message: "Battle not found.",
      });
    }

    // ── Safe FIFO Map Capacity Eviction ──────────────────────────
    // WHAT: Evicts oldest entry instead of clearing entire battleReactionCache.
    // WHY: Prevents attackers from wiping reaction dedup state for all users.
    // WHERE & WHEN TO USE: In-memory high-throughput deduplication maps.
    // USE CASES: Anonymous battle reaction throttling.
    // WHEN NOT TO USE: When persistent cluster-wide state is required (use Redis).
    if (battleReactionCache.size >= 50000) {
      const firstKey = battleReactionCache.keys().next().value;
      battleReactionCache.delete(firstKey);
    }
    battleReactionCache.set(cacheKey, true);

    return res.status(200).json({
      success: true,
      reactions: updated.reactions,
    });
  } catch (err) {
    logger.error("Battle", "Save reaction failed", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Could not save reaction.",
    });
  }
});

// ─── POST /api/battle/:user1/vs/:user2/react ─────────────
// WHAT: Convenience slug endpoint to react to a battle by username pair
router.post("/:user1/vs/:user2/react", async (req, res) => {
  const { user1, user2 } = req.params;
  const { type } = req.body;

  const allowed = ["relatable", "destroyed", "savage"];
  if (!type || !allowed.includes(type)) {
    return res.status(400).json({
      error: "INVALID_TYPE",
      message: `type must be one of: ${allowed.join(", ")}`,
    });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    "unknown";

  const norm1 = (user1 || "").toLowerCase();
  const norm2 = (user2 || "").toLowerCase();
  const pairKey = [norm1, norm2].sort().join("-vs-");
  const cacheKey = `${ip}:${pairKey}:${type}`;

  if (battleReactionCache.has(cacheKey)) {
    return res.status(200).json({
      success: true,
      duplicate: true,
      message: "Already reacted to this battle.",
    });
  }

  try {
    const battle = await Battle.findOne({
      $or: [
        { user1: norm1, user2: norm2 },
        { user1: norm2, user2: norm1 },
      ],
    });

    if (!battle) {
      return res.status(404).json({
        error: "BATTLE_NOT_FOUND",
        message: "Battle not found. Run the battle first before reacting.",
      });
    }

    const updated = await Battle.addReaction(battle._id, type);

    // ── Safe FIFO Map Capacity Eviction ──────────────────────────
    // WHAT: Evicts oldest entry instead of clearing entire battleReactionCache.
    // WHY: Prevents attackers from wiping reaction dedup state for all users.
    // WHERE & WHEN TO USE: In-memory high-throughput deduplication maps.
    // USE CASES: Anonymous battle reaction throttling.
    // WHEN NOT TO USE: When persistent cluster-wide state is required (use Redis).
    if (battleReactionCache.size >= 50000) {
      const firstKey = battleReactionCache.keys().next().value;
      battleReactionCache.delete(firstKey);
    }
    battleReactionCache.set(cacheKey, true);

    return res.status(200).json({
      success: true,
      reactions: updated.reactions,
    });
  } catch (err) {
    logger.error("Battle", "Save slug reaction failed", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Could not save reaction.",
    });
  }
});

// ─── POST /api/battle/:id/view ────────────────────────────
// WHAT: Records an anonymous view for battle social proof
router.post("/:id/view", async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Battle.incrementView(id);
    }
    return res.status(200).json({ success: true });
  } catch {
    return res.status(200).json({ success: true });
  }
});

// ─── POST /api/battle/:id/share ───────────────────────────
// WHAT: Tracks battle share count
router.post("/:id/share", async (req, res) => {
  const { id } = req.params;
  try {
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Battle.incrementShare(id);
    }
    return res.status(200).json({ success: true });
  } catch {
    return res.status(200).json({ success: true });
  }
});

module.exports = router;
