// ============================================================
// GITROAST — Payment Service
// ============================================================
// WHAT: Handles Razorpay order creation and payment verification.
//       Single source of truth for all plan definitions.
//
// WHY Razorpay over PayPal:
//   PayPal sandbox rejects Indian cards and UPI — unusable for India
//   Razorpay supports UPI, cards, netbanking, wallets natively in INR
//   No currency conversion — amounts in paise (₹1 = 100 paise)
//
// PLANS:
//   ROASTER   ₹99/month  → Main plan — AI roast, Nuclear, HD card
//   HISTORIAN ₹199/month → Power users — everything + monthly report
//   SQUAD     Coming Soon → Team roasting — waitlist only
//
// WHERE: Used by server/routes/payment.js
// ============================================================

const Razorpay = require("razorpay");
const crypto = require("crypto");
const { logger } = require("../utils/logger");

// WHY lazy init: Razorpay constructor throws if keys are missing
//     lazy init means server starts even without keys in dev
let razorpayInstance = null;

function getRazorpay() {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
}

// ── Plan definitions ──────────────────────────────────────────
// WHAT: Single source of truth for all plan data
//       Frontend and backend both read from here via API
//
// WHY amounts in paise:
//   Razorpay requires amounts in smallest currency unit
//   ₹99 = 9900 paise, ₹199 = 19900 paise
//
// WHY features as outcome strings not feature strings:
//   "Destroyed by real AI, not a script" → outcome (sells)
//   "AI roast enabled" → feature (doesn't sell)
const PLANS = {
  roaster: {
    id: "roaster",
    name: "🔥 Roaster",
    tagline: "The Real Roast",
    price: 99,
    amount: 9900, // WHY paise: Razorpay requirement
    currency: "INR",
    interval: "monthly",
    displayPrice: "₹99",
    period: "/month",
    badge: "MOST POPULAR",

    // WHY outcome language: sells transformation not features
    features: [
      "🤖 Destroyed by Gemini AI — not a script",
      "☢️ Nuclear intensity unlocked — zero mercy",
      "⬇️ HD card download — watermark free",
      "🔒 Private repos analyzed",
      "♾️ Unlimited roasts per day",
      "⚡ Pro badge on your roast card",
      "📊 Full score history + charts",
    ],

    // WHY notIncluded: transparency builds trust
    //     users know exactly what they're NOT getting
    //     prevents refund requests from unmet expectations
    notIncluded: ["Monthly report email", "Team roasting"],

    cta: "Get Roasted for Real",
    ctaSubtext: "Cancel anytime",
    highlight: true, // WHY: renders with fire border on pricing page
  },

  historian: {
    id: "historian",
    name: "📈 Historian",
    tagline: "The Long Game",
    price: 199,
    amount: 19900,
    currency: "INR",
    interval: "monthly",
    displayPrice: "₹199",
    period: "/month",
    badge: "FOR POWER USERS",

    features: [
      "🤖 Everything in Roaster",
      "📧 Monthly roast report email",
      "📉 Score trend — improved vs last month",
      "🔥 Roast streak tracking",
      "⚡ Priority AI — faster responses",
      "🏆 Exclusive Historian badge on card",
      "📊 Deep analytics — 6 month history",
    ],

    notIncluded: ["Team roasting"],

    cta: "Start Tracking My Shame",
    ctaSubtext: "Cancel anytime",
    highlight: false,
  },

  // WHY squad placeholder:
  //   Shows product ambition without promising unbuilt features
  //   "Notify me" button builds a waitlist of interested buyers
  //   Real social proof: "147 teams waiting" builds FOMO
  squad: {
    id: "squad",
    name: "⚔️ Squad",
    tagline: "The Bloodbath",
    price: null, // WHY null: not for sale yet
    amount: null,
    currency: "INR",
    interval: "monthly",
    displayPrice: "Coming Soon",
    period: "",
    badge: "COMING SOON",

    features: [
      "⚔️ Roast your entire engineering team",
      "🏆 Private team leaderboard",
      "💀 All vs All battle mode",
      "📊 Team shame analytics dashboard",
      "🎨 Custom roast branding",
      "📧 Weekly team roast digest",
    ],

    notIncluded: [],
    cta: "Notify Me",
    ctaSubtext: "Be first when we launch",
    highlight: false,
    comingSoon: true, // WHY: UI uses this to render waitlist button
  },
};

// ── Create Razorpay order ─────────────────────────────────────
// WHAT: Creates a payment order on Razorpay's servers
// WHY server-side: order creation requires key_secret — never expose in browser
// WHY receipt: helps match Razorpay dashboard orders to your DB records
async function createOrder(planId, userId) {
  const plan = PLANS[planId];

  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  if (plan.comingSoon) {
    throw new Error("This plan is not yet available for purchase.");
  }

  const razorpay = getRazorpay();

  const order = await razorpay.orders.create({
    amount: plan.amount,
    currency: plan.currency,
    receipt: `gitroast_${planId}_${userId}_${Date.now()}`,
    notes: {
      planId,
      userId: userId?.toString(),
      planName: plan.name,
    },
  });

  logger.info("Payment", `Order created`, {
    orderId: order.id,
    planId,
    amount: plan.amount,
  });

  return { order, plan };
}

// ── Verify payment signature ──────────────────────────────────
// WHAT: Verifies Razorpay payment using HMAC SHA256 signature
//
// WHY HMAC verification:
//   Without verification, anyone could POST fake payment data
//   and get Pro access for free.
//   HMAC uses key_secret (only you and Razorpay know it)
//   to sign the order_id + payment_id combination.
//   If signature matches → payment is genuine.
//
// HOW it works:
//   Razorpay generates: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
//   We regenerate the same hash and compare
//   If identical → payment is real ✅
//   If different → tampered/fake → reject ❌
function verifyPayment({ orderId, paymentId, signature }) {
  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  // WHY timingSafeEqual: prevents timing attacks
  //     regular === comparison leaks info via response time
  //     timingSafeEqual always takes same time regardless of match
  const isValid = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature),
  );

  return isValid;
}

module.exports = { PLANS, createOrder, verifyPayment };
