// ============================================================
// GITROAST — Payment Service
// ============================================================
// WHAT: Razorpay order creation + payment verification.
//       Single source of truth for all plan definitions.
//
// WHY amounts in paise:
//   Razorpay requires amounts in smallest currency unit
//   ₹99 = 9900 paise, ₹199 = 19900 paise
//
// WHY PLANS object not env vars per plan:
//   All plan config in one place — change once, works everywhere
//   Old system needed 3 separate env vars for 3 plans
//   New system: one PLANS object, env vars for secrets only
// ============================================================

const Razorpay = require("razorpay");
const crypto = require("crypto");
const { logger } = require("../utils/logger");

// WHY lazy init: throws if keys missing — lazy = server starts in dev without keys
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

// ── Plan definitions (single source of truth) ─────────────────
// WHY here not in env vars:
//   Plan names, features, prices are business logic — belong in code
//   Only secrets (key_id, key_secret) belong in env vars
//   Changing a price = 1 line change here, redeploy — clean
const PLANS = {
  roaster: {
    id: "roaster",
    name: "🔥 Roaster",
    amount: 9900, // ₹99 in paise
    currency: "INR",
  },
  historian: {
    id: "historian",
    name: "📈 Historian",
    amount: 19900, // ₹199 in paise
    currency: "INR",
  },
};

// ── Create Razorpay order ──────────────────────────────────────
// WHAT: Creates payment order on Razorpay servers
// WHY server-side: key_secret must never reach the browser
// WHY receipt: links Razorpay dashboard entries to your DB records
async function createOrder(planId, userId) {
  const plan = PLANS[planId];
  logger.debug("Payment", "createOrder called", { planId });
  //   [Payment] create-order body: { planId: 'roaster' }
  // { id: 'roaster', name: '🔥 Roaster', amount: 9900, currency: 'INR' } roaster new ObjectId('6a55d0368fc2be6d14c219b4') createOrderfn
  // WHY explicit check: unknown planId = reject before hitting Razorpay
  //     prevents accidental orders for non-existent plans
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
    // WHY: log exact Razorpay error — not the generic message
    logger.error("Payment", "Razorpay orders.create failed", {
      error: razorErr?.error || razorErr?.message,
    });
    throw razorErr;
  }

  return { order, plan };
}

// ── Verify payment signature ───────────────────────────────────
// WHAT: Verifies Razorpay HMAC SHA256 signature
//
// WHY HMAC verification is critical:
//   Without it: anyone can POST fake payment data → free Pro
//   Razorpay generates: HMAC_SHA256(orderId|paymentId, key_secret)
//   We regenerate + compare — match = genuine payment
//
// WHY timingSafeEqual:
//   Regular === leaks info via response time (timing attack)
//   timingSafeEqual always takes same time → no timing leak
function verifyPayment({ orderId, paymentId, signature }) {
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
    // WHY catch: timingSafeEqual throws if buffers are different lengths
    //     different length = definitely not equal = return false
    return false;
  }
}

module.exports = { PLANS, createOrder, verifyPayment };
