const express = require("express");
const router = express.Router();
const { requireRecruiterAuth } = require("../middleware/auth");
const { generateHireabilityBrief } = require("../services/aiService");
const { fetchProfile, fetchRepos } = require("../services/githubService");
const { logger } = require("../utils/logger");

// ── WHAT: ────────────────────────────────────────────────────
// Apply requireRecruiterAuth middleware to all recruiter routes.
// ── WHY: ─────────────────────────────────────────────────────
// Ensures only authenticated recruiters can access these features.
router.use(requireRecruiterAuth);

// ── GET /dashboard/stats ─────────────────────────────────────
// ── WHAT: Returns basic recruiter counts (how many saved).
// ── WHY: Powers the recruiter dashboard high-level metrics.
router.get("/dashboard/stats", async (req, res) => {
  try {
    const savedCount = req.recruiter.savedCandidates ? req.recruiter.savedCandidates.length : 0;
    res.json({ savedCount });
  } catch (error) {
    logger.error("Recruiter", "Failed to fetch stats", { error: error.message });
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ── GET /candidates/saved ─────────────────────────────────────
// ── WHAT: Returns req.recruiter.savedCandidates.
// ── WHY: Displays the list of candidates a recruiter has saved.
router.get("/candidates/saved", async (req, res) => {
  try {
    res.json({ candidates: req.recruiter.savedCandidates || [] });
  } catch (error) {
    logger.error("Recruiter", "Failed to fetch saved candidates", { error: error.message });
    res.status(500).json({ error: "Failed to fetch saved candidates" });
  }
});

// ── POST /candidates/saved ────────────────────────────────────
// ── WHAT: Adds { username, notes } to req.recruiter.savedCandidates.
// ── WHY: Allows recruiters to bookmark candidates for later review.
router.post("/candidates/saved", async (req, res) => {
  try {
    const { username, notes } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Check if already saved
    const exists = req.recruiter.savedCandidates.find(c => c.username === username);
    if (exists) {
      return res.status(400).json({ error: "Candidate already saved" });
    }

    req.recruiter.savedCandidates.push({ username, notes });
    await req.recruiter.save();
    res.json({ 
      message: "Candidate saved successfully", 
      candidate: req.recruiter.savedCandidates[req.recruiter.savedCandidates.length - 1] 
    });
  } catch (error) {
    logger.error("Recruiter", "Failed to save candidate", { error: error.message });
    res.status(500).json({ error: "Failed to save candidate" });
  }
});

// ── DELETE /candidates/saved/:username ────────────────────────
// ── WHAT: Removes candidate from req.recruiter.savedCandidates.
// ── WHY: Allows recruiters to remove candidates they are no longer interested in.
router.delete("/candidates/saved/:username", async (req, res) => {
  try {
    const { username } = req.params;
    req.recruiter.savedCandidates = req.recruiter.savedCandidates.filter(c => c.username !== username);
    await req.recruiter.save();
    res.json({ message: "Candidate removed successfully" });
  } catch (error) {
    logger.error("Recruiter", "Failed to remove candidate", { error: error.message });
    res.status(500).json({ error: "Failed to remove candidate" });
  }
});

// ── GET /analyze/:username ────────────────────────────────────
// ── WHAT: Fetches GitHub profile & repos, passes them to generateHireabilityBrief.
// ── WHY: Provides recruiters with an AI-generated structured analysis of a developer.
router.get("/analyze/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const [profile, repos] = await Promise.all([
      fetchProfile(username),
      fetchRepos(username)
    ]);
    
    const brief = await generateHireabilityBrief(profile, repos);
    if (brief.error) {
      return res.status(500).json(brief);
    }
    
    res.json(brief);
  } catch (error) {
    logger.error("Recruiter", "Failed to analyze candidate", { error: error.message });
    res.status(500).json({ error: "Failed to analyze candidate" });
  }
});

module.exports = router;
