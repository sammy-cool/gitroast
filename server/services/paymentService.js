const Razorpay = require("razorpay");
const crypto = require("crypto");
const { logger } = require("../utils/logger");
const { getPlan, PLAN_META } = require("./pricing");

let _razorpay = null;
function getRazorpay() {
  if (!_razorpay) {
    _razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpay;
}

// Kept for backwards compatibility (plan-id validation); prices are regional.
const PLANS = PLAN_META;

async function createOrder(planId, userId, country = "US") {
  const plan = getPlan(planId, country);
  logger.debug("Payment", "createOrder called", { planId });
  if (!plan) {
    const err = new Error(`Unknown plan: ${planId}`);
    err.statusCode = 400;
    throw err;
  }

  let order;
  try {
    order = await getRazorpay().orders.create({
      amount: plan.amount,
      currency: plan.currency,
      receipt: `gr_${planId}_${userId.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: {
        planId,
        userId: userId?.toString(),
      },
    });
  } catch (razorErr) {
    logger.error("Payment", "Razorpay orders.create failed", {
      error: razorErr?.error || razorErr?.message,
    });
    throw razorErr;
  }

  return { order, plan };
}

function verifyPayment({ orderId, paymentId, signature }) {
  if (!orderId || !paymentId || !signature || !process.env.RAZORPAY_KEY_SECRET) {
    return false;
  }
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

function verifyWebhookSignature(rawBody, signature, webhookSecret) {
  if (!rawBody || !signature || !webhookSecret) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

module.exports = { PLANS, createOrder, verifyPayment, verifyWebhookSignature };

