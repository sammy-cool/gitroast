// ============================================================
// GITROAST — Razorpay Payment Service
// WHY Razorpay: Indian company, works globally, free to setup
//               USD/INR/100+ currencies, full sandbox, 2% fee
// FLOW:
//   1. Backend creates Razorpay order → gets order_id
//   2. Frontend opens Razorpay checkout with order_id
//   3. User pays → Razorpay sends back 3 values:
//      razorpay_order_id, razorpay_payment_id, razorpay_signature
//   4. Backend verifies signature using HMAC SHA256
//   5. Signature valid → unlock Pro in MongoDB
// ============================================================

const Razorpay = require('razorpay')
const crypto = require('crypto')  // WHY: built-in Node.js — zero dependency
const Payment = require('../models/Payment')
const User = require('../models/User')

// WHY: instantiate once — reuse across all calls
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// ─── Plan config ──────────────────────────────────────────
// WHY: single source of truth for all plan details
//      amount in CENTS (USD) — Razorpay requirement
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
// WHY: Step 1 — create order on Razorpay servers
//      returns order_id which frontend needs to open checkout
async function createOrder(plan, userId) {
    const planConfig = PLANS[plan]
    if (!planConfig) throw new Error('INVALID_PLAN')

    // WHY receipt: unique identifier for this order
    //     Razorpay shows it in dashboard + emails
    const receipt = `gitroast_${plan}_${userId}_${Date.now()}`

    const order = await razorpay.orders.create({
        amount: planConfig.amount,
        currency: planConfig.currency,
        receipt: receipt.slice(0, 40), // WHY: Razorpay max 40 chars
        // WHY notes: stored in Razorpay dashboard — helpful for support
        notes: {
            plan,
            userId: userId.toString(),
            description: planConfig.description,
        },
        // WHY payment_capture 1: auto-capture payment immediately
        //     no manual capture step needed
        payment_capture: 1,
    })

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        amountFloat: (order.amount / 100).toFixed(2), // WHY: for display
        label: planConfig.label,
        displayPrice: planConfig.displayPrice,
        description: planConfig.description,
    }
}

// ─── verifySignature ──────────────────────────────────────
// WHY: CRITICAL security step
//      Razorpay sends back a signature after payment
//      We MUST verify it using HMAC SHA256 before unlocking Pro
//      Without this anyone could fake a successful payment
//
// HOW it works:
//   Razorpay creates: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
//   We recreate the same hash
//   If they match → payment is genuine
//   If they don't → someone tampered with the response
function verifySignature(orderId, paymentId, signature) {
    // WHY: exact format Razorpay uses to generate signature
    const body = `${orderId}|${paymentId}`
    const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex')

    // WHY timingSafeEqual: prevents timing attacks
    //     normal string comparison leaks timing info
    //     timingSafeEqual always takes same time regardless
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
// WHY: Step 3 — called after frontend gets payment success
//      1. Verify signature (security)
//      2. Save payment to MongoDB
//      3. Upgrade user to Pro
async function captureAndUnlock({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    plan,
    userId,
}) {
    // ── Step 1: Verify signature ─────────────────────────
    // WHY: NEVER skip this — it's the only proof payment is real
    const isValid = verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    )

    if (!isValid) {
        throw new Error('SIGNATURE_INVALID')
    }

    // ── Step 2: Get payment details from Razorpay ─────────
    // WHY: fetch actual amount paid for accurate records
    let paymentDetails = null
    try {
        paymentDetails = await razorpay.payments.fetch(razorpay_payment_id)
    } catch (err) {
        // WHY: signature already verified — safe to proceed
        //      even if this fetch fails
        console.warn('[Payment] Could not fetch payment details:', err.message)
    }

    const amountPaid = paymentDetails
        ? (paymentDetails.amount / 100).toFixed(2)
        : (PLANS[plan]?.amount / 100).toFixed(2)

    // ── Step 3: Save to MongoDB ──────────────────────────
    const payment = await Payment.create({
        userId,
        plan,
        amountUSD: parseFloat(amountPaid),
        paypalOrderId: razorpay_order_id,   // WHY: reusing field for Razorpay order ID
        payerEmail: paymentDetails?.email || null,
        status: 'confirmed',
        confirmedAt: new Date(),
        subscriptionEndsAt: plan !== 'pro_one_time'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
    })

    // ── Step 4: Upgrade user to Pro ──────────────────────
    await User.findByIdAndUpdate(userId, {
        $set: {
            isPro: true,
            proSince: new Date(),
        },
    })

    return { payment, paymentId: razorpay_payment_id }
}

module.exports = { createOrder, captureAndUnlock, verifySignature, PLANS }