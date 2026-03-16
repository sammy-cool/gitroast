const mongoose = require('mongoose')

// WHY: defines exact shape of every roast document in MongoDB
const roastSchema = new mongoose.Schema(
    {
        // ── Who got roasted ──────────────────────────────────
        username: {
            type: String,
            required: true,
            trim: true,
            // WHY index: most queries filter by username
            index: true,
        },

        // ── Who triggered the roast ──────────────────────────
        // WHY: null = anonymous free user, ObjectId = logged-in user
        roastedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true,
        },

        // ── The roast result ─────────────────────────────────
        score: {
            type: Number,
            required: true,
            min: 1,
            max: 99,
        },

        grade: {
            type: String,
            required: true,
            enum: ['A', 'B', 'C', 'D', 'F', 'F-'],
        },

        roastText: {
            type: String,
            required: true,
        },

        // WHY: track which engine generated this roast
        //      'rules' = rule engine, 'ai' = Gemini
        roastSource: {
            type: String,
            enum: ['rules', 'ai'],
            default: 'rules',
        },

        // ── GitHub snapshot at time of roast ─────────────────
        // WHY snapshot: GitHub data changes over time
        //     we store what it looked like WHEN roasted
        githubSnapshot: {
            totalRepos: { type: Number, default: 0 },
            joinYear: { type: Number, default: 0 },
            followers: { type: Number, default: 0 },
            topLanguage: { type: String, default: '' },
            abandonedCount: { type: Number, default: 0 },
            commitQuality: { type: Number, default: 0 },
            totalStars: { type: Number, default: 0 },
            hasReadme: { type: Boolean, default: false },
        },

        // ── Stats at time of roast ───────────────────────────
        // WHY: store the 4 stat boxes for history comparison
        stats: [
            {
                label: String,
                value: String,
                bad: Boolean,
                note: String,
            },
        ],

        // ── Shame commits at time of roast ───────────────────
        shameCommits: [String],

        // ── Monetization tracking ────────────────────────────
        isPro: {
            type: Boolean,
            default: false,
        },

        // WHY: track shares for viral metrics
        shareCount: {
            type: Number,
            default: 0,
        },
    },
    {
        // WHY: auto-adds createdAt + updatedAt
        timestamps: true,
    }
)

// ─── Compound index ───────────────────────────────────────
// WHY: fastest query pattern = "all roasts for this username,
//      sorted by newest first" — this index serves that exactly
roastSchema.index({ username: 1, createdAt: -1 })

// WHY: for leaderboard — find lowest scores globally
roastSchema.index({ score: 1, createdAt: -1 })

// ─── Static method: get roast history for a username ─────
// WHY static: called on the Model, not an instance
roastSchema.statics.getHistory = function (username, limit = 10) {
    return this.find({ username })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('score grade roastText roastSource createdAt githubSnapshot')
        .lean()   // WHY lean: returns plain JS object, faster than Mongoose doc
}

// ─── Static method: global leaderboard (most roasted) ────
roastSchema.statics.getLeaderboard = function (limit = 10) {
    return this.aggregate([
        // WHY: group by username to avoid duplicate entries
        {
            $group: {
                _id: '$username',
                bestScore: { $min: '$score' },    // WHY min: lowest score = most roasted
                roastCount: { $sum: 1 },
                lastRoast: { $max: '$createdAt' },
            },
        },
        { $sort: { bestScore: 1 } },         // WHY: most roasted (lowest) first
        { $limit: limit },
    ])
}

// ─── Static method: increment share count ────────────────
roastSchema.statics.incrementShare = function (roastId) {
    return this.findByIdAndUpdate(
        roastId,
        { $inc: { shareCount: 1 } },
        { new: true }
    )
}

module.exports = mongoose.model('Roast', roastSchema)