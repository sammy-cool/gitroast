// ============================================================
// GITROAST — Razorpay Payment Service
// WHY Razorpay: Indian company, works globally, free to setup
//               INR currency, UPI + cards + netbanking + wallets
// FLOW:
//   1. Backend creates Razorpay order → gets order_id
//   2. Frontend opens Razorpay checkout with order_id
//   3. User pays → Razorpay sends back 3 values:
//      razorpay_order_id, razorpay_payment_id, razorpay_signature
//   4. Backend verifies signature using HMAC SHA256
//   5. Signature valid → unlock Pro in MongoDB
// ============================================================

const Razorpay = require('razorpay')
const crypto = require('crypto')
const Payment = require('../models/Payment')
const User = require('../models/User')

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ─── Plan config ──────────────────────────────────────────
// WHY INR: Razorpay default currency — works immediately
//          no international activation needed
//          amount in PAISE (smallest INR unit)
//          ₹199 = 19900 paise
const PLANS = {
    pro_one_time: {
        amount: parseInt(process.env.PRO_ONE_TIME_PRICE || '19900'),
        currency: 'INR',
        description: 'GitRoast Pro — Lifetime Access',
        label: 'Pro Lifetime',
        displayPrice: '₹199',
    },
    pro_monthly: {
        amount: parseInt(process.env.PRO_MONTHLY_PRICE || '49900'),
        currency: 'INR',
        description: 'GitRoast Pro — Monthly Subscription',
        label: 'Pro Monthly',
        displayPrice: '₹499',
    },
    teams_monthly: {
        amount: parseInt(process.env.TEAMS_MONTHLY_PRICE || '99900'),
        currency: 'INR',
        description: 'GitRoast Teams — Monthly Subscription',
        label: 'Teams Monthly',
        displayPrice: '₹999',
    },
}

// ─── createOrder ─────────────────────────────────────────
async function createOrder(plan, userId) {
    const planConfig = PLANS[plan]
    if (!planConfig) throw new Error('INVALID_PLAN')

    const receipt = `gitroast_${plan}_${userId}_${Date.now()}`

    const order = await razorpay.orders.create({
        amount: planConfig.amount,
        currency: planConfig.currency,
        receipt: receipt.slice(0, 40),
        notes: {
            plan,
            userId: userId.toString(),
            description: planConfig.description,
        },
        payment_capture: 1,
    })

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        displayPrice: planConfig.displayPrice,
        label: planConfig.label,
        description: planConfig.description,
    }
}

// ─── verifySignature ──────────────────────────────────────
// WHY: CRITICAL security step — verify payment is genuine
//      HMAC SHA256 of order_id + "|" + payment_id
function verifySignature(orderId, paymentId, signature) {
    const body = `${orderId}|${paymentId}`
    const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex')

    try {
        return crypto.timingSafeEqual(
            Buffer.from(expectedSig),
            Buffer.from(signature)
        )
    } catch {
        return false
    }
}

// ─── captureAndUnlock ────────────────────────────────────
async function captureAndUnlock({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
    userId,
}) {
    // ── Verify signature first — never skip ──────────────
    const isValid = verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    )
    if (!isValid) throw new Error('SIGNATURE_INVALID')

    // ── Fetch payment details ─────────────────────────────
    let paymentDetails = null
    try {
        paymentDetails = await razorpay.payments.fetch(razorpay_payment_id)
    } catch (err) {
        console.warn('[Payment] Could not fetch payment details:', err.message)
    }

    // WHY: convert paise back to rupees for storage
    const amountPaid = paymentDetails
        ? (paymentDetails.amount / 100).toFixed(2)
        : (PLANS[plan]?.amount / 100).toFixed(2)

    // ── Save to MongoDB ───────────────────────────────────
    const payment = await Payment.create({
        userId,
        plan,
        amountINR: parseFloat(amountPaid),  // WHY: field stores amount paid
        razorPayOrderId: razorpay_order_id,        // WHY: reusing field for Razorpay order ID
        payerEmail: paymentDetails?.email || null,
        status: 'confirmed',
        confirmedAt: new Date(),
        subscriptionEndsAt: plan !== 'pro_one_time'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
    })

    // ── Upgrade user to Pro ───────────────────────────────
    await User.findByIdAndUpdate(userId, {
        $set: { isPro: true, proSince: new Date() },
    })

    return { payment, paymentId: razorpay_payment_id }
}

module.exports = { createOrder, captureAndUnlock, verifySignature, PLANS }