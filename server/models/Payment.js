// ============================================================
// GITROAST — Payment Model
// ============================================================
// WHAT: Stores every payment transaction permanently.
//       Audit trail for support, analytics, and Pro verification.
//
// WHY keep payment records:
//   If User.isPro accidentally reset → can restore from Payment docs
//   Dispute resolution — proof of payment with Razorpay IDs
//   Revenue analytics — how much earned, which plans popular
//
// FIELD NAMING CONVENTION:
//   razorpay prefix = data that came from Razorpay
//   camelCase throughout — matches JavaScript conventions
// ============================================================

const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // ── Who paid ──────────────────────────────────────────────
    // WHY index: most queries filter by userId
    //     "show all payments for this user" is the most common query
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── What plan they bought ─────────────────────────────────
    // WHY planId not plan:
    //   Old field was 'plan' with PayPal-era enum values
    //   New system uses planId: 'roaster' | 'historian'
    //   Renamed for clarity + matches frontend/backend naming
    planId: {
      type: String,
      required: true,
      enum: ["roaster", "historian"],
    },

    // ── Amount paid ───────────────────────────────────────────
    // WHY paise: Razorpay stores amounts in paise (₹1 = 100 paise)
    //     storing same unit = no conversion errors
    //     ₹99 = 9900 paise, ₹199 = 19900 paise
    amount: {
      type: Number,
      required: true,
    },

    // WHY currency: future international payment gateways (USD, EUR)
    currency: {
      type: String,
      default: "INR",
    },

    // ── Razorpay identifiers ──────────────────────────────────
    // WHY store both orderId and paymentId:
    //   orderId   = created by us before payment (Razorpay order)
    //   paymentId = created by Razorpay after user pays
    //   Both needed for disputes + duplicate payment checks
    razorpayOrderId: {
      type: String,
      index: true,
    },

    // WHY unique + sparse:
    //   unique: one payment ID can only exist once — no duplicates
    //   sparse: allows null values (index only on non-null docs)
    //   This is how we check for duplicate verify calls
    razorpayPaymentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },

    // ── Optional Billing & Auditing Fields ─────────────────────
    customerEmail: {
      type: String,
      trim: true,
      default: null,
    },

    receipt: {
      type: String,
      default: null,
    },

    invoiceId: {
      type: String,
      default: null,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    refundReason: {
      type: String,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

    // ── Payment status ────────────────────────────────────────
    // WHY these specific statuses:
    //   pending   → order created, user hasn't paid yet
    //   captured  → Razorpay confirmed payment received ✅
    //   failed    → user's payment method declined
    //   refunded  → we issued a refund
    status: {
      type: String,
      enum: ["pending", "captured", "failed", "refunded"],
      default: "pending",
      index: true,
    },
  },
  {
    // WHY timestamps:
    //   createdAt = when payment was initiated
    //   updatedAt = when status last changed
    //   Both useful for support queries and analytics
    timestamps: true,
  },
);

// ── Compound indexes ───────────────────────────────────────
// WHY: most common query = all payments for one user, newest first
paymentSchema.index({ userId: 1, createdAt: -1 });
// WHY: admin revenue summaries and reconciliation jobs
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
