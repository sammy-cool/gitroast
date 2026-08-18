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
const Roast = require("../models/Roast");
const { optionalAuth } = require("../middleware/auth");
const { logger } = require("../utils/logger");

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

// ── GET /api/history/leaderboard/worst ───────────────────────
// WHY above /:username: specific route must come before dynamic
router.get("/leaderboard/worst", async (req, res) => {
  try {
    const leaderboard = await Roast.getLeaderboard(10);
    return res.status(200).json({ success: true, leaderboard });
  } catch (err) {
    logger.error("Leaderboard", "Fetch failed", { message: err.message });
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Could not fetch leaderboard.",
    });
  }
});

// ── POST /api/history/:id/share ───────────────────────────────
router.post("/:id/share", async (req, res) => {
  try {
    await Roast.incrementShare(req.params.id);
    return res.status(200).json({ success: true });
  } catch {
    // WHY always 200: share tracking failure must never break UX
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
setInterval(() => reactionCache.clear(), 24 * 60 * 60 * 1000);

router.post("/:id/react", async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

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
    const updated = await Roast.addReaction(id, type);

    if (!updated) {
      return res.status(404).json({
        error: "ROAST_NOT_FOUND",
        message: "Roast not found.",
      });
    }

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
