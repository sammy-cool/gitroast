// WHERE: server/routes/battle.js

const express = require("express");
const router = express.Router();
const { runBattle } = require("../services/battleService");
const { optionalAuth } = require("../middleware/auth");
const { verifyCaptcha } = require("../middleware/captcha");
const { logger } = require("../utils/logger");

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

  try {
    const token = req.user?.githubAccessToken || null;
    const result = await runBattle(user1, user2, token);

    return res.status(200).json({ success: true, data: result });
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

module.exports = router;
