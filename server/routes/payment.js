const express = require('express')
const router = express.Router()
const { createOrder, captureAndUnlock, PLANS } = require('../services/paymentService')
const { requireAuth } = require('../middleware/auth')
const { createRateLimiter } = require('../middleware/rateLimiter')
const Payment = require('../models/Payment')

// WHY strict limit: prevent payment session spam
const paymentLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Too many payment requests. Please slow down.',
})

// ─── POST /api/payment/create-order ──────────────────────
// WHY: frontend calls this first
//      backend creates order on PayPal, returns orderId
//      frontend uses orderId to render the PayPal button
router.post('/create-order', requireAuth, paymentLimiter, async (req, res) => {
    const { plan } = req.body

    const validPlans = ['pro_one_time', 'pro_monthly', 'teams_monthly']
    if (!validPlans.includes(plan)) {
        return res.status(400).json({
            error: 'INVALID_PLAN',
            message: 'Invalid plan selected.',
        })
    }

    // WHY: don't charge already-Pro users for one-time plan again
    if (req.user.isPro && plan === 'pro_one_time') {
        return res.status(400).json({
            error: 'ALREADY_PRO',
            message: 'You are already a Pro member!',
        })
    }

    try {
        const result = await createOrder(plan)
        return res.status(201).json({
            success: true,
            orderId: result.orderId,
            price: result.price,
            label: result.label,
            plan,
        })
    } catch (err) {
        console.error('[Payment] Create order error:', err.message)

        if (err.message === 'PAYPAL_AUTH_FAILED') {
            return res.status(500).json({
                error: 'PAYPAL_AUTH_FAILED',
                message: 'PayPal configuration error. Contact support.',
            })
        }

        return res.status(500).json({
            error: 'CREATE_FAILED',
            message: 'Could not create payment session. Try again.',
        })
    }
})

// ─── POST /api/payment/capture ────────────────────────────
// WHY: called AFTER user approves payment in PayPal popup
//      onApprove fires in frontend → calls this endpoint
//      we capture money + upgrade user
router.post('/capture', requireAuth, async (req, res) => {
    const { orderId, plan } = req.body

    if (!orderId || !plan) {
        return res.status(400).json({
            error: 'MISSING_FIELDS',
            message: 'orderId and plan are required.',
        })
    }

    // WHY: prevent double-capture (user double-clicks Pay)
    //      PayPal also prevents this, but we double-check
    const existing = await Payment.findOne({
        paypalOrderId: orderId,
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
        await captureAndUnlock(orderId, req.user._id, plan)

        return res.status(200).json({
            success: true,
            message: 'Payment confirmed. Welcome to Pro! 🔥',
        })

    } catch (err) {
        console.error('[Payment] Capture error:', err.message)

        if (err.message === 'PAYPAL_CAPTURE_FAILED') {
            return res.status(402).json({
                error: 'CAPTURE_FAILED',
                message: 'Payment could not be captured. Please try again.',
            })
        }

        if (err.message.startsWith('PAYMENT_NOT_COMPLETED')) {
            return res.status(402).json({
                error: 'NOT_COMPLETED',
                message: 'Payment was not completed. No charge was made.',
            })
        }

        return res.status(500).json({
            error: 'SERVER_ERROR',
            message: 'Something went wrong. Contact support with your PayPal email.',
        })
    }
})

// ─── GET /api/payment/plans ───────────────────────────────
// WHY: frontend fetches current prices from server
//      so prices are always in sync with .env
router.get('/plans', (req, res) => {
    res.json({
        success: true,
        plans: Object.entries(PLANS).map(([key, val]) => ({
            key,
            price: val.price,
            label: val.label,
        })),
    })
})

// ─── GET /api/payment/history ─────────────────────────────
// WHY: user's own payment history — Pro dashboard
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