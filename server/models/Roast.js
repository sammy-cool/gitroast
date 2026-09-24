const mongoose = require("mongoose");

const roastSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
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

    // ── Reactions ────────────────────────────────────────────
    // WHAT: Stores emoji reaction counts for this roast
    //
    // WHY object not array:
    //   3 fixed reaction types — object lookup is O(1)
    //   No need to iterate — just reactions.relatable etc.
    //
    // WHY counts not user IDs here:
    //   Keeping reaction counts here = fast read (one doc)
    //   Preventing duplicate reactions = separate collection
    //   (server checks IP/userId in react endpoint)
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

roastSchema.index({ username: 1, createdAt: -1 });
roastSchema.index({ score: 1, createdAt: -1 });

// WHY: /api/roast/feed sorts by { createdAt: -1 } with no $match — without
//      this index, MongoDB performs a full collection scan on every 30s poll
roastSchema.index({ createdAt: -1 });

// WHY: /api/history/daily-burn sorts by reactions — without a compound index,
//      MongoDB in-memory sorts the entire collection (32MB limit risk)
roastSchema.index({ "reactions.savage": -1, "reactions.destroyed": -1, createdAt: -1 });

roastSchema.statics.getHistory = function (username, limit = 10) {
  return this.find({ username }).sort({ createdAt: -1 }).limit(limit).lean();
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
    // WHY $project first: reduces data passed to $group — only username
    //     and score are needed, not roastText, stats, shameCommits, etc.
    { $project: { username: 1, score: 1 } },
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

roastSchema.statics.incrementShare = function (id) {
  return this.findByIdAndUpdate(id, { $inc: { shareCount: 1 } });
};

// WHY static method for reactions:
//   Atomic $inc — safe for concurrent reactions
//   Returns updated doc so frontend gets fresh counts
//   type validated here so route stays clean
roastSchema.statics.addReaction = function (id, type) {
  const allowed = ["relatable", "destroyed", "savage"];
  if (!allowed.includes(type)) throw new Error("Invalid reaction type");
  return this.findByIdAndUpdate(
    id,
    { $inc: { [`reactions.${type}`]: 1 } },
    { returnDocument: "after", select: "reactions" },
  );
};

module.exports = mongoose.model("Roast", roastSchema);
