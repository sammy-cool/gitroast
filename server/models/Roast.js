// ============================================================
// GITROAST — Roast Mongoose Model
// ============================================================
// WHAT: Defines the schema (shape) of every roast document in MongoDB.
//       Every time a user gets roasted, one document is saved here.
//
// WHY Mongoose schema:
//   - Validates data before saving — rejects bad data at the DB layer
//   - Provides type coercion — "84" string becomes 84 number automatically
//   - Indexes optimise query performance — leaderboard loads fast
//
// WHERE: Used by:
//   server/routes/roast.js    → Roast.create() after generating roast
//   server/routes/history.js  → Roast.getHistory() for /history/:username
//   server/routes/history.js  → Roast.getLeaderboard() for leaderboard
// ============================================================

const mongoose = require("mongoose");

const roastSchema = new mongoose.Schema(
  {
    // ── Who got roasted ──────────────────────────────────────
    // WHY index: every history + leaderboard query filters by username
    //            indexed field = O(log n) lookup instead of O(n) full scan
    username: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    // ── Who triggered the roast ──────────────────────────────
    // WHY ObjectId ref: links to User document if logged in
    // WHY nullable: anonymous free users have no account → null
    roastedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    // ── Roast score ──────────────────────────────────────────
    // WHY min 1 / max 99: never show 0 (too harsh) or 100 (nobody is perfect)
    //     keeps the comedy in the mid-range where it's most roastable
    score: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
    },

    // WHY enum for grade: only valid letter grades allowed
    //     prevents typos like "G" or "Z" entering the DB
    grade: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D", "F", "F-"],
    },

    roastText: {
      type: String,
      required: true,
    },

    // WHY roastSource: tracks which engine generated this roast
    //     'rules' = rule engine (free users)
    //     'ai'    = Gemini 2.5 Flash (Pro users)
    //     Useful for analytics: "what % of roasts are AI-powered?"
    roastSource: {
      type: String,
      enum: ["rules", "ai"],
      default: "rules",
    },

    // WHY intensity field:
    //     'mild'    → gentle, observational comedy
    //     'savage'  → brutal comedy (default)
    //     'nuclear' → maximum devastation (Pro only)
    //     Stored so history page can show which intensity was used
    //     Also powers future analytics: "which intensity do users prefer?"
    intensity: {
      type: String,
      enum: ["mild", "savage", "nuclear"],
      default: "savage",
    },

    // ── GitHub snapshot at time of roast ─────────────────────
    // WHY snapshot: GitHub profile changes over time
    //     storing snapshot preserves what it looked like WHEN roasted
    //     so history chart shows accurate trends, not current state
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

    // WHY stats array: stores the 4 stat boxes shown on the RoastCard
    //     so history page can re-render past roast cards accurately
    stats: [
      {
        label: String,
        value: String,
        bad: Boolean,
        note: String,
      },
    ],

    // WHY shameCommits: stores the actual embarrassing commit messages
    //     shown in CommitShame component on the roast card
    shameCommits: [String],

    // ── Monetization tracking ────────────────────────────────
    // WHY isPro: records whether this specific roast was a Pro roast
    //     free tier gets rule engine, Pro gets Gemini AI
    //     useful for: "how many Pro roasts generated this month?"
    isPro: {
      type: Boolean,
      default: false,
    },

    // WHY shareCount: viral metrics
    //     incremented via POST /api/history/:id/share
    //     powers the social proof counter on the landing page
    shareCount: {
      type: Number,
      default: 0,
    },
  },
  {
    // WHY timestamps: auto-adds createdAt + updatedAt to every document
    //     createdAt is used for sorting history (newest first)
    //     updatedAt is useful for debugging stale data
    timestamps: true,
  },
);

// ── Indexes ───────────────────────────────────────────────────
// WHAT: Compound index on username + createdAt
// WHY: The most common query = "give me all roasts for @username, newest first"
//      This compound index serves that exact query in O(log n) instead of full collection scan
//      Without index: 1000 roasts = 1000 rows scanned. With index: ~log(1000) = 10 comparisons
roastSchema.index({ username: 1, createdAt: -1 });

// WHAT: Index on score for leaderboard
// WHY: Leaderboard sorts by score ascending (worst first)
//      Score index makes this fast at any collection size
roastSchema.index({ score: 1, createdAt: -1 });

// ── Static methods ────────────────────────────────────────────
// WHY static: called on the Model itself, not an instance
//     Roast.getHistory('torvalds') — clean, readable, reusable

// WHAT: Returns last N roasts for a username, newest first
// WHY limit param: caller controls how many — history page wants 10, chart wants all
roastSchema.statics.getHistory = function (username, limit = 10) {
  return this.find({ username }).sort({ createdAt: -1 }).limit(limit);
};

// WHAT: Returns leaderboard — top N profiles with their worst score
// WHY aggregate: we need to group multiple roasts per username
//     then take the minimum score (most roastable) per user
// WHY $group then $sort: group first (collapse duplicates), then sort (rank them)
roastSchema.statics.getLeaderboard = function (limit = 10) {
  return this.aggregate([
    {
      // WHAT: Group all roasts by username, compute stats per user
      $group: {
        _id: "$username",
        // WHY $min score: lower score = more roastable = higher shame rank
        bestScore: { $min: "$score" },
        roastCount: { $sum: 1 },
      },
    },
    {
      // WHY sort ascending: lowest score = most roastable = top of Wall of Shame
      $sort: { bestScore: 1 },
    },
    { $limit: limit },
  ]);
};

// WHAT: Increments share count for a specific roast document
// WHY static not method: called by ID from route, not on a fetched instance
// WHY $inc: atomic operation — safe against concurrent share requests
roastSchema.statics.incrementShare = function (id) {
  return this.findByIdAndUpdate(id, { $inc: { shareCount: 1 } });
};

module.exports = mongoose.model("Roast", roastSchema);
