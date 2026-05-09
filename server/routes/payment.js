// ============================================================
// GITROAST — Payment Routes
// ============================================================
// WHAT: Handles Razorpay order creation and payment verification.
//       Two endpoints:
//         POST /api/payment/create-order → creates Razorpay order
//         POST /api/payment/verify       → verifies + unlocks Pro
//         GET  /api/payment/plans        → returns plan definitions
//         GET  /api/payment/history      → user payment history
//
// WHY server-side order creation:
//   Razorpay key_secret must NEVER be in the browser
//   Order amount is set server-side — user cannot tamper with price
//
// WHERE: Registered in index.js as app.use('/api/payment', require('./routes/payment'))
// ============================================================

const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment");
const { requireAuth } = require("../middleware/auth");
const {
  PLANS,
  createOrder,
  verifyPayment,
} = require("../services/paymentService");
const { logger } = require("../utils/logger");

// ── GET /api/payment/plans ────────────────────────────────────
// WHAT: Returns plan definitions to frontend
// WHY: Single source of truth — prices defined in paymentService.js
//      Frontend reads from here, not hardcoded
// WHY public (no auth): pricing page is visible to everyone
router.get("/plans", (req, res) => {
  // WHY: strip sensitive fields before sending to frontend
  //      amount in paise is confusing — send displayPrice only
  const publicPlans = Object.values(PLANS).map((plan) => ({
    id: plan.id,
    name: plan.name,
    tagline: plan.tagline,
    displayPrice: plan.displayPrice,
    period: plan.period,
    badge: plan.badge,
    highlight: plan.highlight,
    comingSoon: plan.comingSoon || false,
    features: plan.features,
    notIncluded: plan.notIncluded,
    cta: plan.cta,
    ctaSubtext: plan.ctaSubtext,
  }));
  res.json({ success: true, plans: publicPlans });
});

// ── POST /api/payment/create-order ───────────────────────────
// WHAT: Creates a Razorpay order — returns orderId + amount to frontend
// WHY requireAuth: only logged-in users can buy Pro
//     anonymous users have no account to upgrade
router.post("/create-order", requireAuth, async (req, res) => {
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({
      error: "MISSING_PLAN",
      message: "Plan ID is required.",
    });
  }

  try {
    const { order, plan } = await createOrder(planId, req.user._id);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planName: plan.name,
      planId: plan.id,
      // WHY send key_id to frontend: Razorpay SDK needs it to open popup
      //     key_id is PUBLIC — safe to send. key_secret is NEVER sent.
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    logger.error("Payment", "Order creation failed", { message: err.message });
    return res.status(500).json({
      error: "ORDER_FAILED",
      message: err.message || "Could not create payment order.",
    });
  }
});

// ── POST /api/payment/verify ──────────────────────────────────
// WHAT: Verifies Razorpay payment signature and upgrades user to Pro
//
// WHY HMAC verification before any DB write:
//   Without verification, anyone could POST fake payment data
//   and get Pro for free. Signature uses key_secret — only Razorpay
//   and our server know it. Match = payment is real.
router.post("/verify", requireAuth, async (req, res) => {
  const { orderId, paymentId, signature, planId } = req.body;

  if (!orderId || !paymentId || !signature || !planId) {
    return res.status(400).json({
      error: "MISSING_FIELDS",
      message: "orderId, paymentId, signature and planId are required.",
    });
  }

  // WHY: verify first, DB write second
  //      if verification fails → reject immediately → no DB changes
  const isValid = verifyPayment({ orderId, paymentId, signature });

  if (!isValid) {
    logger.warn("Payment", "Signature verification FAILED", {
      orderId,
      userId: req.user._id,
    });
    return res.status(400).json({
      error: "INVALID_SIGNATURE",
      message:
        "Payment verification failed. Contact support if money was deducted.",
    });
  }

  try {
    // WHY check duplicate: user might retry verify if they had a network error
    //     without this check: second verify call would create a duplicate Payment doc
    const existing = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (existing) {
      logger.info("Payment", "Duplicate verify request — already processed", {
        paymentId,
      });
      return res
        .status(200)
        .json({ success: true, message: "Already processed." });
    }

    // WHY save Payment before updating User:
    //     if User.save() fails, we still have a record of the payment
    //     makes it recoverable manually
    await Payment.create({
      userId: req.user._id,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      planId,
      amount: PLANS[planId]?.amount || 0,
      status: "captured",
    });

    // WHY returnDocument 'after': returns updated doc with isPro: true
    //     needed to confirm the update actually happened
    req.user.isPro = true;
    await req.user.save();

    logger.info("Payment", "✅ Pro unlocked", {
      userId: req.user._id,
      planId,
      paymentId,
    });

    return res.status(200).json({
      success: true,
      message: "⚡ Pro unlocked! Enjoy the nuclear roasts.",
      isPro: true,
    });
  } catch (err) {
    logger.error("Payment", "Verify DB write failed", {
      message: err.message,
      orderId,
      paymentId,
    });
    return res.status(500).json({
      error: "DB_ERROR",
      message:
        "Payment verified but account upgrade failed. Contact support with payment ID.",
    });
  }
});

// ── GET /api/payment/history ──────────────────────────────────
// WHAT: Returns user's payment history
// WHY: Shows user their past payments — builds trust + useful for disputes
router.get("/history", requireAuth, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.status(200).json({ success: true, payments });
  } catch (err) {
    return res.status(500).json({
      error: "FETCH_FAILED",
      message: "Could not fetch payment history.",
    });
  }
});

module.exports = router;
