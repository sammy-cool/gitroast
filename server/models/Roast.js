const mongoose = require("mongoose");

const roastSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      // WHY: index: true removed because compound index { username: 1, createdAt: -1 }
      //      already indexes username with left-prefix query optimization
    },

    roastedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    score: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },

    grade: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D", "F", "F-"],
    },

    roastText: {
      type: String,
      required: true,
    },

    roastSource: {
      type: String,
      enum: ["rules", "ai"],
      default: "rules",
    },

    intensity: {
      type: String,
      enum: ["mild", "savage", "nuclear"],
      default: "savage",
    },

    avatarUrl: {
      type: String,
      default: null,
    },

    topLanguage: {
      type: String,
      trim: true,
      default: "",
    },

    githubSnapshot: {
      totalRepos: { type: Number, default: 0 },
      joinYear: { type: Number, default: 0 },
      followers: { type: Number, default: 0 },
      topLanguage: { type: String, default: "" },
      abandonedCount: { type: Number, default: 0 },
      commitQuality: { type: Number, default: 0 },
      totalStars: { type: Number, default: 0 },
      hasReadme: { type: Boolean, default: false },
    },

    stats: [
      {
        label: String,
        value: String,
        bad: Boolean,
        note: String,
      },
    ],

    shameCommits: [String],

    bioContrast: {
      bio: { type: String, default: "" },
      claimed: { type: String, default: "" },
      reality: { type: String, default: "" },
      verdict: { type: String, default: "" },
    },

    isPro: {
      type: Boolean,
      default: false,
    },

    shareCount: {
      type: Number,
      default: 0,
    },

    // WHY viewCount: provides social proof on cards and reports (e.g. "👀 1,420 views")
    viewCount: {
      type: Number,
      default: 0,
    },

    // WHY tags: dynamically renders category labels (e.g. 'abandoned_graveyard', 'ghost_dev')
    tags: {
      type: [String],
      default: [],
    },

    // WHY customTitle: allows assigning hilarious roast archetypes (e.g. 'Senior Git Blame Dodger')
    customTitle: {
      type: String,
      default: null,
    },

    // WHY isPinned: allows users to pin their favorite historical burn to their profile
    isPinned: {
      type: Boolean,
      default: false,
    },

    // WHY aiModel & generationTimeMs: telemetry for LLM auditing and model performance tracking
    aiModel: {
      type: String,
      default: null,
    },

    generationTimeMs: {
      type: Number,
      default: null,
    },

    // ── AI Redemption Plan ─────────────────────────────────────
    // WHAT: 3 actionable, humorous tips to help developer or repository recover from their roast.
    // WHY: Gives positive forward momentum and value beyond pure roasting (Staff Architect insights).
    // WHERE & WHEN TO USE: Generated on Pro roasts or AI analysis workflows.
    // USE CASES: Displayed in RoastCard / RepoRoastCard as "Redemption Path".
    // WHEN NOT TO USE: Never store unvalidated arbitrary user text; only string arrays.
    redemptionPlan: {
      type: [String],
      default: [],
    },

    // ── Reactions ────────────────────────────────────────────
    // WHAT: Stores emoji reaction counts for this roast
    // WHY object not array:
    //   3 fixed reaction types — object lookup is O(1)
    //   No need to iterate — just reactions.relatable etc.
    reactions: {
      relatable: { type: Number, default: 0 }, // 😂
      destroyed: { type: Number, default: 0 }, // 💀
      savage: { type: Number, default: 0 }, // 🔥
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes for Maximum Query Efficiency ─────────────────────
roastSchema.index({ username: 1, createdAt: -1 });
roastSchema.index({ username: 1, isPinned: -1, createdAt: -1 });
roastSchema.index({ score: 1, createdAt: -1 });
roastSchema.index({ topLanguage: 1, score: 1 });
roastSchema.index({ "githubSnapshot.topLanguage": 1 });

// WHY: /api/roast/feed sorts by { createdAt: -1 } with no $match — without
//      this index, MongoDB performs a full collection scan on every 30s poll
roastSchema.index({ createdAt: -1 });

// WHY: /api/history/daily-burn sorts by reactions — without a compound index,
//      MongoDB in-memory sorts the entire collection (32MB limit risk)
roastSchema.index({ "reactions.savage": -1, "reactions.destroyed": -1, createdAt: -1 });

roastSchema.statics.getHistory = function (username, limit = 10) {
  return this.find({ username: new RegExp(`^${username}$`, "i") })
    .sort({ isPinned: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

roastSchema.statics.getLeaderboard = async function (options = {}) {
  let page = 1;
  let limit = 10;
  let legacyMode = false;

  if (typeof options === "number") {
    limit = options;
    legacyMode = true;
  } else if (options && typeof options === "object") {
    page = Math.max(1, parseInt(options.page, 10) || 1);
    limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
  }

  const skip = (page - 1) * limit;

  const result = await this.aggregate([
    // WHY $project first: reduces data passed to $group and normalizes username casing
    //     so duplicate case variants (Alice vs alice) don't split rankings
    { $project: { username: { $toLower: "$username" }, score: 1 } },
    {
      $group: {
        _id: "$username",
        bestScore: { $min: "$score" },
        roastCount: { $sum: 1 },
      },
    },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $sort: { bestScore: 1 } },
          { $skip: skip },
          { $limit: limit },
        ],
      },
    },
  ]);

  const total = result[0]?.metadata?.[0]?.total || 0;
  const entries = result[0]?.data || [];
  const totalPages = Math.max(1, Math.ceil(total / limit));

  if (legacyMode) {
    return entries;
  }

  return {
    entries,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// ── Safe Share Increment With ID Validation ─────────────────
// ── WHAT: ────────────────────────────────────────────────────
// Atomically increments shareCount for a roast after validating the MongoDB ObjectId.
// ── WHY: ─────────────────────────────────────────────────────
// Guarding with mongoose.Types.ObjectId.isValid(id) prevents unhandled CastError exceptions
// when client sends an invalid or truncated document ID.
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// Invoked by social share tracking endpoints (POST /api/history/:id/share).
// ── USE CASES: ───────────────────────────────────────────────
// Telemetry tracking for social share clicks across platforms.
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// Do not use when querying by username or composite keys.
roastSchema.statics.incrementShare = function (id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return this.findByIdAndUpdate(id, { $inc: { shareCount: 1 } });
};

roastSchema.statics.incrementView = function (id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return this.findByIdAndUpdate(
    id,
    { $inc: { viewCount: 1 } },
    { returnDocument: "after", select: "viewCount" }
  );
};

// WHY static method for reactions:
//   Atomic $inc — safe for concurrent reactions
//   Returns updated doc so frontend gets fresh counts
//   type validated here so route stays clean
// ── Safe Reaction Increment With ID Validation ──────────────
// ── WHAT: ────────────────────────────────────────────────────
// Atomically increments emoji reaction count for a verified roast document ID.
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Verifying mongoose.Types.ObjectId.isValid(id) prevents unhandled CastError exceptions.
// 2. Atomic $inc prevents lost update race conditions under high concurrent clicks.
// 3. Selecting both reactions AND username ensures callers can update User stats.reactionsReceived.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// In all model static methods handling document updates by dynamic ID.
//
// ── USE CASES: ───────────────────────────────────────────────
// User reaction clicks on public roast permalinks.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// Do not use if arbitrary string identifiers are employed instead of Mongo ObjectIds.
roastSchema.statics.addReaction = function (id, type) {
  const allowed = ["relatable", "destroyed", "savage"];
  if (!allowed.includes(type)) throw new Error("Invalid reaction type");
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return this.findByIdAndUpdate(
    id,
    { $inc: { [`reactions.${type}`]: 1 } },
    { returnDocument: "after", select: "reactions username" },
  );
};

module.exports = mongoose.model("Roast", roastSchema);
