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
const mongoose = require("mongoose");
const router = express.Router();
const Payment = require("../models/Payment");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const {
  PLANS,
  createOrder,
  verifyPayment,
  verifyWebhookSignature,
} = require("../services/paymentService");
const { logger } = require("../utils/logger");

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
  logger.debug("Payment", "create-order body", { body: req.body });
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
    const existing = await Payment.findOne({ razorpayPaymentId: paymentId });
    if (existing) {
      return res
        .status(200)
        .json({ success: true, message: "Already processed.", isPro: true });
    }

    // WHY separate try/catch for Payment.create:
    //   Payment logging failure should NOT block Pro unlock
    //   User already paid — they must get access regardless
    try {
      await Payment.create({
        userId: req.user._id,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        planId,
        amount: PLANS[planId]?.amount || 0,
        status: "captured",
      });
    } catch (paymentErr) {
      // WHY: log but don't throw — Pro unlock is more important
      logger.error("Payment", "Verify failed", { message: paymentErr.message });
    }

    /* 
      ── WHAT: ────────────────────────────────────────────────────────
      Updates User document with Pro status and specific tier planId.
      
      ── WHY: ─────────────────────────────────────────────────────────
      Persists the user's selected tier ('roaster' | 'historian') into proPlan,
      ensuring account state matches the purchased SKU.
      
      ── WHERE & WHEN TO USE: ─────────────────────────────────────────
      In payment verification controllers after cryptographic signature validation.
      
      ── USE CASES: ───────────────────────────────────────────────────
      Unlocking Pro tier privileges and lifetime/subscription features.
      
      ── WHEN NOT TO USE: ─────────────────────────────────────────────
      Do not set proPlan without verified payment confirmation.
    */
    req.user.isPro = true;
    req.user.proPlan = planId;
    req.user.proSince = new Date();
    await req.user.save();

    return res.status(200).json({
      success: true,
      message: "⚡ Pro unlocked! Enjoy the nuclear roasts.",
      isPro: true,
      proPlan: req.user.proPlan,
    });
  } catch (err) {
    logger.error("Payment", "Verify DB error", { message: err.message });
    return res.status(500).json({
      error: "DB_ERROR",
      message:
        "Payment verified but account upgrade failed. Contact support with your payment ID.",
    });
  }
});

// ── POST /api/payment/webhook ────────────────────────────────
// WHAT: Handles asynchronous payment events directly from Razorpay.
// WHY: If user closes browser or network drops before frontend /verify completes,
//      webhook ensures Pro is still unlocked reliably in the background.
router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const secret =
    process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

  if (!signature || !secret) {
    logger.warn("Payment", "Webhook rejected — missing signature or secret");
    return res.status(400).json({ error: "MISSING_SIGNATURE_OR_SECRET" });
  }

  const isValid = verifyWebhookSignature(req.rawBody, signature, secret);
  if (!isValid) {
    logger.warn("Payment", "Webhook invalid signature");
    return res.status(400).json({ error: "INVALID_SIGNATURE" });
  }

  const event = req.body;
  const eventType = event?.event;
  logger.info("Payment", `Webhook received: ${eventType}`);

  try {
    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = event?.payload?.payment?.entity;
      const orderEntity = event?.payload?.order?.entity;

      const paymentId = paymentEntity?.id;
      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const notes = paymentEntity?.notes || orderEntity?.notes || {};
      const planId = notes.planId;
      const userId = notes.userId;
      const amount = paymentEntity?.amount || orderEntity?.amount || 0;

      // ── Webhook Payment Document Creation & User Upgrade ──────────
      // ── WHAT: ────────────────────────────────────────────────────
      // Validates userId ObjectId format before attempting Payment.create or User lookup.
      // If payment was initiated externally without notes.userId, safely checks if an
      // existing Payment document was pre-created via orderId or logs an operational warning.
      //
      // ── WHY: ─────────────────────────────────────────────────────
      // Payment.schema enforces { userId: { required: true, type: ObjectId } }.
      // If Razorpay webhook notes omit userId or send non-ObjectId strings,
      // Payment.create throws a Mongoose ValidationError causing the webhook to return
      // HTTP 500. This triggers Razorpay retry storms and prevents idempotency.
      //
      // ── WHERE & WHEN TO USE: ─────────────────────────────────────
      // In webhook and event ingestion controllers where payload payloads can
      // originate from external actors with partial or unvalidated metadata.
      //
      // ── USE CASES: ───────────────────────────────────────────────
      // Handling asynchronous payment notifications safely without unhandled rejections.
      //
      // ── WHEN NOT TO USE: ─────────────────────────────────────────
      // Do not use when processing trusted internal DB transactions where schemas are strictly typed.
      const isValidUserId = userId && mongoose.Types.ObjectId.isValid(userId);

      if (paymentId) {
        let paymentDoc = await Payment.findOne({
          razorpayPaymentId: paymentId,
        });

        if (!paymentDoc) {
          if (isValidUserId) {
            await Payment.create({
              userId,
              razorpayOrderId: orderId || "webhook_captured",
              razorpayPaymentId: paymentId,
              planId: planId || "roaster",
              amount,
              status: "captured",
            });
          } else {
            // Check if orderId matches a pre-existing order document
            const existingOrderByOrder = orderId
              ? await Payment.findOne({ razorpayOrderId: orderId })
              : null;

            if (existingOrderByOrder) {
              existingOrderByOrder.razorpayPaymentId = paymentId;
              existingOrderByOrder.status = "captured";
              await existingOrderByOrder.save();
            } else {
              logger.warn("Payment", "Webhook payment received without valid userId or pre-existing order", {
                paymentId,
                orderId,
                userId,
              });
            }
          }
        } else if (paymentDoc.status !== "captured") {
          paymentDoc.status = "captured";
          await paymentDoc.save();
        }
      }

      if (isValidUserId) {
        const user = await User.findById(userId);
        if (user && !user.isPro) {
          user.isPro = true;
          user.proPlan = (paymentDoc && paymentDoc.planId) || "roaster";
          user.proSince = new Date();
          await user.save();
          logger.info("Payment", `Pro unlocked via webhook for user ${userId}`);
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error("Payment", "Webhook processing error", {
      message: err.message,
    });
    return res.status(500).json({ error: "WEBHOOK_PROCESSING_FAILED" });
  }
});

module.exports = router;
