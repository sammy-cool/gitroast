const mongoose = require('mongoose')
const { normalizeIntensity, normalizePersona } = require('../utils/constants')

const userSchema = new mongoose.Schema(
    {
        githubId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        username: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            default: null,
        },

        // Developers sign in with GitHub, recruiters with Google or work email.
        // Recruiters get a synthetic githubId ("recruiter:<id>") so the existing
        // unique index keeps working with zero migration.
        role: {
            type: String,
            enum: ['developer', 'recruiter'],
            default: 'developer',
            index: true,
        },

        authProvider: {
            type: String,
            enum: ['github', 'google', 'password'],
            default: 'github',
        },

        passwordHash: { type: String, default: null, select: false },
        googleId: { type: String, default: null, index: { unique: true, sparse: true } },

        recruiter: {
            organization: { type: String, trim: true, default: '' },
            acceptedResponsibleUseAt: { type: Date, default: null },
        },

        avatarUrl: {
            type: String,
            default: null,
        },

        githubAccessToken: {
            type: String,
            default: null,
        },

        isPro: {
            type: Boolean,
            default: false,
            index: true,
        },

        proPlan: {
            type: String,
            enum: ['none', 'roaster', 'historian'],
            default: 'none',
        },

        proSince: {
            type: Date,
            default: null,
        },

        proExpiresAt: {
            type: Date,
            default: null,
        },

        roastCount: {
            type: Number,
            default: 0,
        },

        lastRoastDate: {
            type: Date,
            default: null,
        },

        badges: {
            type: [String],
            default: [],
        },

        customPreferences: {
            defaultIntensity: {
                type: String,
                enum: ['warm', 'crispy', 'nuclear', 'mild', 'savage'],
                default: 'crispy',
            },
            defaultPersona: {
                type: String,
                enum: ['staff_engineer', 'chaos_intern', 'historian', 'classic', 'hinglish', 'techbro', 'ramsay', 'shakespearean'],
                default: 'staff_engineer',
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

        stats: {
            totalRoasts: { type: Number, default: 0 },
            battlesWon: { type: Number, default: 0 },
            battlesLost: { type: Number, default: 0 },
            reactionsReceived: { type: Number, default: 0 },
        },
    },
    {
        timestamps: true,
    }
)

userSchema.index({ isPro: 1, proSince: -1 });

userSchema.methods.canRoastToday = function () {
    if (this.isPro) return true

    if (!this.lastRoastDate) return true

    const todayUtc = new Date().toISOString().slice(0, 10)
    const lastRoastUtc = new Date(this.lastRoastDate).toISOString().slice(0, 10)

    return todayUtc !== lastRoastUtc
}

userSchema.methods.toSafeObject = function () {
    return {
        id: this._id,
        githubId: this.role === 'recruiter' ? null : this.githubId,
        role: this.role || 'developer',
        organization: this.recruiter?.organization || '',
        username: this.username,
        email: this.email,
        avatarUrl: this.avatarUrl,
        isPro: this.isPro,
        proPlan: this.isPro && (!this.proPlan || this.proPlan === 'none') ? 'roaster' : (this.proPlan || 'none'),
        proSince: this.proSince,
        badges: this.badges || [],
        customPreferences: {
            defaultIntensity: normalizeIntensity(this.customPreferences?.defaultIntensity),
            defaultPersona: normalizePersona(this.customPreferences?.defaultPersona),
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

