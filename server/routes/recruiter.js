const express = require("express");
const router = express.Router();
const Roast = require("../models/Roast");
const User = require("../models/User");
const TalentSave = require("../models/TalentSave");
const Shortlist = require("../models/Shortlist");
const { requireAuth, requireRecruiter } = require("../middleware/auth");
const { MODEL_VERSION, ROLE_MODELS, DEFAULT_ROLE, computeSignals, computeFit } = require("../services/talentEvidence");
const { logger } = require("../utils/logger");

router.use(requireAuth, requireRecruiter);

const USERNAME_RE = /^[a-zA-Z0-9-]{1,39}$/;
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Latest public roast per username, excluding Ghost Mode (isPrivate) profiles.
async function latestPublicProfiles({ q = "", language = "", limit = 200 }) {
  const match = { isPrivate: { $ne: true } };
  if (q) match.username = { $regex: esc(q), $options: "i" };
  if (language) match.topLanguage = { $regex: `^${esc(language)}$`, $options: "i" };
  return Roast.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $toLower: "$username" },
        username: { $first: "$username" },
        avatarUrl: { $first: "$avatarUrl" },
        topLanguage: { $first: "$topLanguage" },
        githubSnapshot: { $first: "$githubSnapshot" },
        analyzedAt: { $first: "$createdAt" },
      },
    },
    { $limit: Math.min(limit, 500) },
  ]);
}

function shapeCandidate(doc, roleKey, savedSet) {
  const signals = computeSignals(doc.githubSnapshot || {});
  const fit = computeFit(signals, roleKey);
  return {
    username: doc.username,
    handle: `@${String(doc.username).toLowerCase()}`,
    avatarUrl: doc.avatarUrl || null,
    topLanguage: doc.topLanguage || "",
    publicRepositories: doc.githubSnapshot?.totalRepos || 0,
    fit,
    signals,
    saved: savedSet ? savedSet.has(String(doc._id)) : false,
    analyzedAt: doc.analyzedAt,
  };
}

router.get("/methodology", (req, res) => {
  res.json({
    success: true,
    version: MODEL_VERSION,
    roles: Object.entries(ROLE_MODELS).map(([id, m]) => ({ id, label: m.label, weights: m.weights })),
    principles: [
      "Public work only. No inferred age, gender, ethnicity, health, location or private employment data.",
      "Sparse public activity is labelled as insufficient evidence, never penalised by assumption.",
      "Roast humour never affects talent evidence.",
      "Evidence supports human review; it is not a hiring recommendation.",
    ],
  });
});

router.get("/talent", async (req, res) => {
  try {
    const roleKey = ROLE_MODELS[req.query.role] ? req.query.role : DEFAULT_ROLE;
    const q = String(req.query.q || "").trim().slice(0, 60);
    const language = String(req.query.language || "").trim().slice(0, 30);
    const docs = await latestPublicProfiles({ q, language });
    const saves = await TalentSave.find({ recruiterId: req.user._id }).select("username").lean();
    const savedSet = new Set(saves.map((s) => s.username));
    const withSaved = docs.map((d) => ({ ...d, _id: String(d._id) }));
    const results = withSaved
      .map((d) => shapeCandidate(d, roleKey, savedSet))
      .sort((a, b) => (b.fit.score ?? -1) - (a.fit.score ?? -1));
    const shortlists = await Shortlist.countDocuments({ recruiterId: req.user._id });
    const covered = results.filter((r) => r.fit.score !== null).length;
    res.json({
      success: true,
      role: { id: roleKey, label: ROLE_MODELS[roleKey].label },
      model: MODEL_VERSION,
      summary: {
        evidenceProfiles: results.length,
        savedTalent: saves.length,
        shortlists,
        methodCoverage: results.length ? Math.round((covered / results.length) * 100) : 0,
      },
      results: results.slice(0, 50),
    });
  } catch (err) {
    logger.error("Recruiter", "talent search failed", { message: err.message });
    res.status(500).json({ error: "SERVER_ERROR", message: "Could not load talent evidence." });
  }
});

router.get("/talent/:username", async (req, res) => {
  const { username } = req.params;
  if (!USERNAME_RE.test(username)) return res.status(400).json({ error: "INVALID_USERNAME" });
  try {
    const roleKey = ROLE_MODELS[req.query.role] ? req.query.role : DEFAULT_ROLE;
    const docs = await latestPublicProfiles({ q: username });
    const doc = docs.find((x) => x._id === username.toLowerCase());
    if (!doc) return res.status(404).json({ error: "PROFILE_NOT_FOUND", message: "No public evidence for this profile." });
    const saved = await TalentSave.exists({ recruiterId: req.user._id, username: username.toLowerCase() });
    const candidate = shapeCandidate({ ...doc, _id: doc._id }, roleKey, saved ? new Set([doc._id]) : new Set());
    res.json({
      success: true,
      model: MODEL_VERSION,
      role: { id: roleKey, label: ROLE_MODELS[roleKey].label, weights: ROLE_MODELS[roleKey].weights },
      candidate,
      snapshot: doc.githubSnapshot || {},
      disclaimer: "Evidence alignment, not a hiring recommendation. Sparse private work is not inferred.",
    });
  } catch (err) {
    logger.error("Recruiter", "candidate profile failed", { message: err.message });
    res.status(500).json({ error: "SERVER_ERROR", message: "Could not load candidate evidence." });
  }
});

router.post("/saved/:username", async (req, res) => {
  const { username } = req.params;
  if (!USERNAME_RE.test(username)) return res.status(400).json({ error: "INVALID_USERNAME" });
  try {
    await TalentSave.updateOne(
      { recruiterId: req.user._id, username: username.toLowerCase() },
      { $setOnInsert: { note: String(req.body?.note || "").slice(0, 500) } },
      { upsert: true },
    );
    res.json({ success: true, saved: true });
  } catch (err) {
    res.status(500).json({ error: "SERVER_ERROR", message: "Could not save this profile." });
  }
});

router.delete("/saved/:username", async (req, res) => {
  await TalentSave.deleteOne({ recruiterId: req.user._id, username: String(req.params.username).toLowerCase() });
  res.json({ success: true, saved: false });
});

router.get("/saved", async (req, res) => {
  const saves = await TalentSave.find({ recruiterId: req.user._id }).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ success: true, saved: saves.map((s) => ({ username: s.username, note: s.note, savedAt: s.createdAt })) });
});

router.get("/shortlists", async (req, res) => {
  const lists = await Shortlist.find({ recruiterId: req.user._id }).sort({ updatedAt: -1 }).limit(100).lean();
  res.json({ success: true, shortlists: lists.map((l) => ({ id: l._id, name: l.name, roleKey: l.roleKey, members: l.members, updatedAt: l.updatedAt })) });
});

router.post("/shortlists", async (req, res) => {
  const name = String(req.body?.name || "").trim().slice(0, 80);
  if (!name) return res.status(400).json({ error: "INVALID_NAME", message: "Shortlist name is required." });
  const roleKey = ROLE_MODELS[req.body?.roleKey] ? req.body.roleKey : DEFAULT_ROLE;
  const members = [...new Set((req.body?.members || []).filter((u) => USERNAME_RE.test(u)).map((u) => u.toLowerCase()))].slice(0, 50);
  const list = await Shortlist.create({ recruiterId: req.user._id, name, roleKey, members });
  res.status(201).json({ success: true, shortlist: { id: list._id, name: list.name, roleKey, members } });
});

router.patch("/shortlists/:id", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ error: "INVALID_ID" });
  const update = {};
  if (typeof req.body?.name === "string" && req.body.name.trim()) update.name = req.body.name.trim().slice(0, 80);
  const add = (req.body?.add || []).filter((u) => USERNAME_RE.test(u)).map((u) => u.toLowerCase());
  const remove = (req.body?.remove || []).map((u) => String(u).toLowerCase());
  const ops = { };
  if (Object.keys(update).length) ops.$set = update;
  if (add.length) ops.$addToSet = { members: { $each: add } };
  const list = await Shortlist.findOneAndUpdate({ _id: req.params.id, recruiterId: req.user._id }, ops, { returnDocument: "after" });
  if (!list) return res.status(404).json({ error: "NOT_FOUND" });
  if (remove.length) {
    list.members = list.members.filter((m) => !remove.includes(m));
    await list.save();
  }
  res.json({ success: true, shortlist: { id: list._id, name: list.name, roleKey: list.roleKey, members: list.members } });
});

router.delete("/shortlists/:id", async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) return res.status(400).json({ error: "INVALID_ID" });
  await Shortlist.deleteOne({ _id: req.params.id, recruiterId: req.user._id });
  res.json({ success: true });
});

router.get("/compare", async (req, res) => {
  const names = String(req.query.u || "").split(",").map((s) => s.trim()).filter((u) => USERNAME_RE.test(u)).slice(0, 4);
  if (names.length < 2) return res.status(400).json({ error: "NEED_TWO", message: "Pick at least two profiles to compare." });
  const roleKey = ROLE_MODELS[req.query.role] ? req.query.role : DEFAULT_ROLE;
  const all = await latestPublicProfiles({ limit: 500 });
  const lower = names.map((n) => n.toLowerCase());
  const picked = all.filter((d) => lower.includes(d._id)).map((d) => shapeCandidate(d, roleKey, null));
  res.json({
    success: true,
    model: MODEL_VERSION,
    candidates: picked,
    disclaimer: "Comparison supports review; it does not recommend a hiring decision.",
  });
});

module.exports = router;
