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
        },

        email: {
            type: String,
            trim: true,
            default: null,        // WHY: GitHub email can be private
        },

        avatarUrl: {
            type: String,
            default: null,
        },

        // WHY: store access token to call GitHub API on behalf of user
        //      this is what gives us private repo access
        githubAccessToken: {
            type: String,
            default: null,
        },

        // WHY: track Pro status
        isPro: {
            type: Boolean,
            default: false,
        },

        // WHY: when did they go Pro — for subscription tracking
        proSince: {
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
    },
    {
        // WHY timestamps: auto-adds createdAt + updatedAt fields
        timestamps: true,
    }
)

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
//      this method strips sensitive fields
userSchema.methods.toSafeObject = function () {
    return {
        id: this._id,
        githubId: this.githubId,
        username: this.username,
        email: this.email,
        avatarUrl: this.avatarUrl,
        isPro: this.isPro,
        proSince: this.proSince,
    }
}

module.exports = mongoose.model('User', userSchema)
