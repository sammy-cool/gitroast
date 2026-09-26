const mongoose = require('mongoose')

// WHY: defines exact shape of a User document in MongoDB
//      mongoose validates every save against this schema
const userSchema = new mongoose.Schema(
    {
        // WHY: GitHub's own ID — never changes even if username does
        githubId: {
            type: String,
            required: true,
            unique: true,
            index: true,       // WHY: faster lookups by githubId
        },

        username: {
            type: String,
            required: true,
            trim: true,
            index: true,       // WHY: faster profile and user searches
        },

        email: {
            type: String,
            trim: true,
            default: null,     // WHY: GitHub email can be private
        },

        avatarUrl: {
            type: String,
            default: null,
        },

        // WHY: store access token to call GitHub API on behalf of user
        //      this is what gives us private repo access and dedicated 5,000 req/hr quota
        githubAccessToken: {
            type: String,
            default: null,
        },

        // WHY: track Pro status
        isPro: {
            type: Boolean,
            default: false,
            index: true,
        },

        // WHY: specific tier bought ('roaster' = Pro monthly, 'historian' = Pro lifetime)
        proPlan: {
            type: String,
            enum: ['none', 'roaster', 'historian'],
            default: 'none',
        },

        // WHY: when did they go Pro — for subscription tracking
        proSince: {
            type: Date,
            default: null,
        },

        // WHY: optional subscription expiry timestamp (null = lifetime/active)
        proExpiresAt: {
            type: Date,
            default: null,
        },

        // WHY: count roasts for rate limiting free users
        roastCount: {
            type: Number,
            default: 0,
        },

        // WHY: track last roast date for daily limit enforcement
        lastRoastDate: {
            type: Date,
            default: null,
        },

        // ── Future-Proofing & Dynamic UI/UX Fields ──────────────────
        // WHY badges: allows rendering dynamic achievement badges in UI (e.g. 'early_adopter', 'pro', 'battle_champ')
        badges: {
            type: [String],
            default: [],
        },

        // WHY customPreferences: lets users configure their card aesthetic and default burn level
        customPreferences: {
            defaultIntensity: {
                type: String,
                enum: ['mild', 'savage', 'nuclear'],
                default: 'savage',
            },
            defaultPersona: {
                type: String,
                enum: ['classic', 'hinglish', 'techbro', 'ramsay', 'shakespearean'],
                default: 'classic',
            },
            cardTheme: {
                type: String,
                default: 'fire',
            },
            hideFromLeaderboard: {
                type: Boolean,
                default: false,
            },
        },

        // WHY stats: aggregated telemetry for user profile display and social proof
        stats: {
            totalRoasts: { type: Number, default: 0 },
            battlesWon: { type: Number, default: 0 },
            battlesLost: { type: Number, default: 0 },
            reactionsReceived: { type: Number, default: 0 },
        },
    },
    {
        // WHY timestamps: auto-adds createdAt + updatedAt fields
        timestamps: true,
    }
)

// Compound index for fast Pro customer querying and subscription auditing
userSchema.index({ isPro: 1, proSince: -1 });

// ─── Instance method: can this user roast today? ──────────
// WHY method on schema: logic travels with the model,
//     not scattered in route files
userSchema.methods.canRoastToday = function () {
    // Pro users: unlimited
    if (this.isPro) return true

    // Free users: 1 roast per day
    if (!this.lastRoastDate) return true

    const today = new Date()
    const lastRoast = new Date(this.lastRoastDate)

    // WHY: compare date strings to check if same calendar day
    return today.toDateString() !== lastRoast.toDateString()
}

// ─── Instance method: safe user object for frontend ───────
// WHY: NEVER send githubAccessToken to the frontend
//      this method strips sensitive fields while providing rich UI metadata
userSchema.methods.toSafeObject = function () {
    return {
        id: this._id,
        githubId: this.githubId,
        username: this.username,
        email: this.email,
        avatarUrl: this.avatarUrl,
        isPro: this.isPro,
        proPlan: this.isPro && (!this.proPlan || this.proPlan === 'none') ? 'roaster' : (this.proPlan || 'none'),
        proSince: this.proSince,
        badges: this.badges || [],
        customPreferences: {
            defaultIntensity: this.customPreferences?.defaultIntensity || 'savage',
            defaultPersona: this.customPreferences?.defaultPersona || 'classic',
            cardTheme: this.customPreferences?.cardTheme || 'fire',
            hideFromLeaderboard: Boolean(this.customPreferences?.hideFromLeaderboard),
        },
        stats: {
            totalRoasts: this.stats?.totalRoasts || this.roastCount || 0,
            battlesWon: this.stats?.battlesWon || 0,
            battlesLost: this.stats?.battlesLost || 0,
            reactionsReceived: this.stats?.reactionsReceived || 0,
        },
    }
}

module.exports = mongoose.model('User', userSchema)
