// ============================================================
// GITROAST — Payment Routes
// ============================================================
// WHAT: Three endpoints for the payment lifecycle:
//   GET  /api/payment/plans        → returns plan list to frontend
//   POST /api/payment/create-order → creates Razorpay order
//   POST /api/payment/verify       → verifies + unlocks Pro
//
// WHY GET /plans:
//   Frontend reads plan data from backend — single source of truth
//   If price changes in paymentService.js → frontend auto-updates
//   No hardcoded prices in React components
//
// WHY POST for create-order (not GET):
//   Creates a resource on Razorpay servers — POST is correct
//   Also: GET requests should not have side effects (REST principle)
//
// WHERE: Registered in index.js as:
//   app.use('/api/payment', require('./routes/payment'))
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

// ── GET /api/payment/plans ────────────────────────────────────
// WHAT: Returns all available plans to frontend
// WHY public (no auth): pricing page visible to everyone
// WHY strip sensitive fields: amount in paise confuses frontend
//     only send display-ready data
router.get("/plans", (req, res) => {
  const publicPlans = Object.values(PLANS).map((plan) => ({
    id: plan.id,
    name: plan.name,
    amount: plan.amount,
    currency: plan.currency,
  }));
  res.json({ success: true, plans: publicPlans });
});

// ── POST /api/payment/create-order ───────────────────────────
// WHAT: Creates a Razorpay order and returns orderId to frontend
//
// WHY requireAuth:
//   Only logged-in users can buy Pro
//   Anonymous users have no account to upgrade
//
// WHY planId from body (not URL param):
//   POST body is not logged by proxies/CDNs
//   URL params are logged — plan info shouldn't be in logs
router.post("/create-order", requireAuth, async (req, res) => {
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({
      error: "MISSING_PLAN",
      message: "planId is required.",
    });
  }

  // WHY check PLANS here too (not just in service):
  //   Fast fail before hitting Razorpay API
  //   Gives clearer error message to frontend
  if (!PLANS[planId]) {
    return res.status(400).json({
      error: "INVALID_PLAN",
      message: `Unknown plan: ${planId}. Valid plans: ${Object.keys(PLANS).join(", ")}`,
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
      // WHY send keyId to frontend:
      //   Razorpay SDK needs key_id to open checkout popup
      //   key_id is PUBLIC — safe to expose
      //   key_SECRET is NEVER sent to frontend
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      error: "ORDER_FAILED",
      message: err.message || "Could not create payment order.",
    });
  }
});

// ── POST /api/payment/verify ──────────────────────────────────
// WHAT: Verifies payment signature → sets isPro = true on user
//
// WHY verify before ANY DB write:
//   Signature check uses HMAC + key_secret
//   If signature invalid → reject immediately, no DB changes
//   Prevents free Pro by posting fake payment data
//
// WHY duplicate payment check:
//   User might retry if network dropped after Razorpay succeeded
//   Without check: second verify = second Payment doc created
//   With check: idempotent — same payment processed once only
router.post("/verify", requireAuth, async (req, res) => {
  const { orderId, paymentId, signature, planId } = req.body;

  if (!orderId || !paymentId || !signature || !planId) {
    return res.status(400).json({
      error: "MISSING_FIELDS",
      message: "orderId, paymentId, signature and planId are all required.",
    });
  }

  // WHY verify first, DB write second:
  //   If verify fails → reject immediately → no DB changes
  const isValid = verifyPayment({ orderId, paymentId, signature });

  if (!isValid) {
    return res.status(400).json({
      error: "INVALID_SIGNATURE",
      message:
        "Payment verification failed. Contact support if money was deducted.",
    });
  }

  try {
    // WHY check duplicate before writing:
    //   Same paymentId = same transaction
    //   Return 200 silently — not an error, just already processed
    const existing = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Already processed.",
        isPro: true,
      });
    }

    // WHY save Payment before updating User:
    //   If User.save() fails — Payment doc still exists
    //   Can manually recover Pro status from payment record
    //   Audit trail for every transaction
    await Payment.create({
      userId: req.user._id,
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      planId,
      amount: PLANS[planId]?.amount || 0,
      status: "captured",
    });

    req.user.isPro = true;
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "⚡ Pro unlocked! Enjoy the nuclear roasts.",
      isPro: true,
    });
  } catch (err) {
    return res.status(500).json({
      error: "DB_ERROR",
      message:
        "Payment verified but account upgrade failed. Contact support with your payment ID.",
    });
  }
});

module.exports = router;
