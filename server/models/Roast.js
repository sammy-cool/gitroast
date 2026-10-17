const mongoose = require("mongoose");

const roastSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
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
      enum: ["warm", "crispy", "nuclear", "mild", "savage"],
      default: "crispy",
    },

    persona: {
      type: String,
      enum: ["staff_engineer", "chaos_intern", "historian", "classic", "hinglish", "techbro", "ramsay", "shakespearean"],
      default: "staff_engineer",
      index: true,
    },

    isPrivate: {
      type: Boolean,
      default: false,
      index: true,
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
      // Public collaboration evidence, last 12 months (null when unavailable → "insufficient evidence").
      collab: {
        type: new mongoose.Schema(
          {
            prs: { type: Number, default: 0 },
            reviews: { type: Number, default: 0 },
            externalRepos: { type: Number, default: 0 },
            windowMonths: { type: Number, default: 12 },
          },
          { _id: false },
        ),
        default: null,
      },
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

    viewCount: {
      type: Number,
      default: 0,
    },

    tags: {
      type: [String],
      default: [],
    },

    customTitle: {
      type: String,
      default: null,
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    aiModel: {
      type: String,
      default: null,
    },

    generationTimeMs: {
      type: Number,
      default: null,
    },

    redemptionPlan: {
      type: [String],
      default: [],
    },

    reactions: {
      relatable: { type: Number, default: 0 },
      destroyed: { type: Number, default: 0 },
      savage: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  },
);

roastSchema.index({ username: 1, createdAt: -1 });
roastSchema.index({ username: 1, isPinned: -1, createdAt: -1 });
roastSchema.index({ score: 1, createdAt: -1 });
roastSchema.index({ topLanguage: 1, score: 1 });
roastSchema.index({ "githubSnapshot.topLanguage": 1 });

roastSchema.index({ createdAt: -1 });
roastSchema.index({ roastedBy: 1, roastSource: 1, createdAt: -1 }); // AI quota counting

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
    { $match: { isPrivate: { $ne: true } } },
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

// Evidence board: best-first ranking over the latest public roast per profile.
// Ghost Mode (isPrivate) profiles are excluded. Ranking uses the roast score only —
// never follower count, geography or identity.
roastSchema.statics.getEvidenceBoard = async function ({ page = 1, limit = 10, windowWeeks = 0, language = "" } = {}) {
  page = Math.max(1, parseInt(page, 10) || 1);
  limit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const match = { isPrivate: { $ne: true } };
  if (windowWeeks > 0) match.createdAt = { $gte: new Date(Date.now() - windowWeeks * 7 * 864e5) };
  if (language) match.topLanguage = new RegExp(`^${String(language).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

  const result = await this.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $toLower: "$username" },
        username: { $first: "$username" },
        score: { $first: "$score" },
        grade: { $first: "$grade" },
        topLanguage: { $first: "$topLanguage" },
        githubSnapshot: { $first: "$githubSnapshot" },
        analyzedAt: { $first: "$createdAt" },
        roastCount: { $sum: 1 },
      },
    },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $sort: { score: -1, analyzedAt: -1 } }, { $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
  ]);

  const total = result[0]?.metadata?.[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    entries: result[0]?.data || [],
    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
  };
};

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

