const express = require('express')
const router = express.Router()
const { createOrder, captureAndUnlock, PLANS } = require('../services/paymentService')
const { requireAuth } = require('../middleware/auth')
const { createRateLimiter } = require('../middleware/rateLimiter')
const Payment = require('../models/Payment')

const paymentLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Too many payment requests. Please slow down.',
})

// ─── GET /api/payment/plans ───────────────────────────────
// WHY: frontend fetches current prices from server
//      single source of truth — prices always match .env
//      amount converted back to dollars for display
router.get('/plans', (req, res) => {
    const plans = Object.entries(PLANS).map(([key, val]) => ({
        key,
        amount: val.amount,
        price: val.displayPrice,  // WHY: $2.49 not 249
        currency: val.currency,
        label: val.label,
    }))
    res.json({ success: true, plans })
})

// ─── POST /api/payment/create-order ──────────────────────
// WHY: frontend calls this FIRST
//      we create order on Razorpay → get order_id
//      frontend uses order_id to open Razorpay checkout popup
router.post('/create-order', requireAuth, paymentLimiter, async (req, res) => {
    const { plan } = req.body

    const validPlans = ['pro_one_time', 'pro_monthly', 'teams_monthly']
    if (!validPlans.includes(plan)) {
        return res.status(400).json({
            error: 'INVALID_PLAN',
            message: 'Invalid plan selected.',
        })
    }

    // WHY: don't create order if already Pro on one-time plan
    if (req.user.isPro && plan === 'pro_one_time') {
        return res.status(400).json({
            error: 'ALREADY_PRO',
            message: 'You are already a Pro member!',
        })
    }

    try {
        const result = await createOrder(plan, req.user._id)
        return res.status(201).json({
            success: true,
            ...result,
            plan,
            // WHY: send Key ID to frontend so it can open checkout
            //      Key ID is safe to expose — Key Secret is NOT
            keyId: process.env.RAZORPAY_KEY_ID,
        })
    } catch (err) {
        console.error('[Payment] Create order error:', err.message)
        return res.status(500).json({
            error: 'CREATE_FAILED',
            message: 'Could not create payment session. Try again.',
        })
    }
})

// ─── POST /api/payment/verify ─────────────────────────────
// WHY: called AFTER user pays in Razorpay popup
//      Razorpay gives frontend 3 values:
//        razorpay_order_id
//        razorpay_payment_id
//        razorpay_signature
//      We MUST verify signature before unlocking Pro
router.post('/verify', requireAuth, async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        plan,
    } = req.body

    // WHY: all 4 fields are required — reject if any missing
    if (!razorpay_order_id || !razorpay_payment_id ||
        !razorpay_signature || !plan) {
        return res.status(400).json({
            error: 'MISSING_FIELDS',
            message: 'Payment details incomplete.',
        })
    }

    // WHY: prevent double-processing same payment
    const existing = await Payment.findOne({
        paypalOrderId: razorpay_order_id,
        status: 'confirmed',
    })

    if (existing) {
        return res.status(200).json({
            success: true,
            alreadyCaptured: true,
            message: 'Payment already processed. You are Pro!',
        })
    }

    try {
        await captureAndUnlock({
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            plan,
            userId: req.user._id,
        })

        return res.status(200).json({
            success: true,
            message: 'Payment verified. Welcome to Pro! 🔥',
        })

    } catch (err) {
        console.error('[Payment] Verify error:', err.message)

        // WHY: signature invalid = someone tampered with response
        //      treat as serious security event
        if (err.message === 'SIGNATURE_INVALID') {
            return res.status(400).json({
                error: 'SIGNATURE_INVALID',
                message: 'Payment verification failed. No charge was made.',
            })
        }

        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: 'Something went wrong. Contact support with your payment ID.',
        })
    }
})

// ─── GET /api/payment/history ─────────────────────────────
router.get('/history', requireAuth, async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('plan amountUSD status confirmedAt createdAt paypalOrderId')
            .lean()
        return res.status(200).json({ success: true, payments })
    } catch (err) {
        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: 'Could not fetch payment history.',
        })
    }
})

module.exports = router