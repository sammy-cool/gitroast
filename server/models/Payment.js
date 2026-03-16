const mongoose = require('mongoose')

// WHY: every payment ever made is stored here
//      powers payment history, Pro verification, analytics
const paymentSchema = new mongoose.Schema(
    {
        // ── Who paid ──────────────────────────────────────────
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        // ── What they bought ──────────────────────────────────
        plan: {
            type: String,
            required: true,
            enum: ['pro_one_time', 'pro_monthly', 'teams_monthly'],
        },

        // ── Payment amounts ───────────────────────────────────
        amountUSD: {
            type: Number,
            required: true,
        },

        // ── PayPal specific ───────────────────────────────────
        // WHY: PayPal order ID — our reference for every transaction
        paypalOrderId: {
            type: String,
            index: true,
        },

        // WHY: payer's PayPal email — for receipts + support
        payerEmail: {
            type: String,
            default: null,
        },

        // ── Status ────────────────────────────────────────────
        // pending   → order created, user hasn't paid yet
        // confirmed → PayPal captured payment successfully
        // failed    → capture failed
        // refunded  → payment refunded
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'failed', 'refunded'],
            default: 'pending',
            index: true,
        },

        // ── Timestamps ────────────────────────────────────────
        confirmedAt: {
            type: Date,
            default: null,
        },

        // WHY: for monthly plans — when subscription expires
        subscriptionEndsAt: {
            type: Date,
            default: null,
        },
    },
    {
        // WHY: auto-adds createdAt + updatedAt to every document
        timestamps: true,
    }
)

// ─── Compound index ───────────────────────────────────────
// WHY: fastest query = all payments for one user, newest first
roastSchema = paymentSchema
paymentSchema.index({ userId: 1, createdAt: -1 })

module.exports = mongoose.model('Payment', paymentSchema)