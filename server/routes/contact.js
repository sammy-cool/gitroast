// ============================================================
// GITROAST — Contact & Feedback Route
// ============================================================
// WHAT: Handles genuine message dispatch from the /contact portal.
// WHY:
//   - Allows real users and developers to submit bug reports, feature
//     requests, and inquiries directly to the creator.
//   - Generates persistent reference tickets (e.g. GR-938210).
//   - Resilient: logs to server audit stream and persists to MongoDB.
// ============================================================

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const ContactMessage = require("../models/ContactMessage");
const { sendContactNotification } = require("../services/emailService");
const { enqueue } = require("../services/queueService");
const { evaluateContactTicket } = require("../services/typeSafeService");
const { verifyCaptcha } = require("../middleware/captcha");
const { optionalAuth } = require("../middleware/auth");
const { logger } = require("../utils/logger");

const VALID_CATEGORIES = ["feedback", "bug", "pro", "dispute", "general"];

// POST /api/contact — Dispatch a new message
// WHY verifyCaptcha: Protects dispatch from bot spammers, ticket flooding, and email quota drain
// WHY optionalAuth: Links ticket to authenticated user account if logged in
router.post("/", optionalAuth, verifyCaptcha, async (req, res) => {
  try {
    const { category, name, email, message } = req.body || {};

    // 1. Validation
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Message content is required.",
        code: "INVALID_MESSAGE",
      });
    }

    if (message.trim().length < 5) {
      return res.status(400).json({
        error: "Message must be at least 5 characters long.",
        code: "MESSAGE_TOO_SHORT",
      });
    }

    const safeCategory = VALID_CATEGORIES.includes(category)
      ? category
      : "general";

    const safeName = typeof name === "string" && name.trim()
      ? name.trim().slice(0, 100)
      : "Anonymous Developer";

    const safeEmail = typeof email === "string" && email.trim()
      ? email.trim().slice(0, 150)
      : "";

    // Email format check if provided
    if (safeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
      return res.status(400).json({
        error: "Please provide a valid email address.",
        code: "INVALID_EMAIL",
      });
    }

    const safeMessage = message.trim().slice(0, 3000);

    /* 
      ── WHAT: ────────────────────────────────────────────────────────
      Mutable ticket ID declaration for collision retry resiliency.
      
      ── WHY: ─────────────────────────────────────────────────────────
      Declaring with 'let' allows the while loop on line 128 to regenerate
      a fresh GR-XXXXXX ticket ID upon encountering an E11000 duplicate key
      error in MongoDB, preventing fatal TypeError crashes.
      
      ── WHERE & WHEN TO USE: ─────────────────────────────────────────
      Any controller generating random unique ticket codes with collision retry.
      
      ── USE CASES: ───────────────────────────────────────────────────
      Contact ticket dispatch, support message queuing.
      
      ── WHEN NOT TO USE: ─────────────────────────────────────────────
      Immutable security tokens or nonces.
    */
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    let ticketId = `GR-${randomCode}`;

    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "";
    const userAgent = req.headers["user-agent"] || "";

    // 3. Log to audit stream immediately
    logger.info("Contact", `📨 New message received [#${ticketId}]`, {
      ticketId,
      category: safeCategory,
      name: safeName,
      email: safeEmail ? `${safeEmail.slice(0, 3)}...` : "(none)",
      messageLength: safeMessage.length,
    });

    // 3b. Evaluate ticket urgency & triage via TypeSafe AI (System One / Jev)
    // ── WHAT: Assesses incoming customer support text for critical billing issues or service blockage.
    // ── WHY: Ensures users with payment failures or locked accounts are immediately elevated to 'urgent'.
    // ── WHERE & WHEN TO USE: On unauthenticated /contact dispatches prior to DB persistence.
    // ── USE CASES: Escalating Razorpay double-charges, production outages, or dispute appeals.
    // ── WHEN NOT TO USE: Do not block responses if TypeSafe fails — fall back gracefully to heuristic priority.
    let priority =
      safeCategory === "dispute" || safeCategory === "pro"
        ? "high"
        : safeCategory === "bug"
        ? "high"
        : "normal";

    const triage = await evaluateContactTicket(safeMessage);
    if (triage.isUrgent) {
      priority = "urgent";
    }

    // 4. Persist to MongoDB (with safe catch if DB is temporarily disconnected)
    let savedToDb = false;
    if (mongoose.connection.readyState === 1) {
      let attempts = 0;
      while (attempts < 3) {
        try {
          const doc = new ContactMessage({
            ticketId,
            userId: req.user?._id || null,
            username: req.user?.username || null,
            category: safeCategory,
            priority,
            name: safeName,
            email: safeEmail,
            message: safeMessage,
            ip,
            userAgent,
          });
          await doc.save();
          savedToDb = true;
          break;
        } catch (dbErr) {
          if (dbErr.code === 11000 && attempts < 2) {
            ticketId = `GR-${Math.floor(100000 + Math.random() * 900000)}`;
            attempts++;
          } else {
            logger.warn("Contact", "Failed to save message to MongoDB (falling back to audit log)", {
              ticketId,
              error: dbErr.message,
            });
            break;
          }
        }
      }
    } else {
      logger.info("Contact", "MongoDB disconnected — dispatched message logged to audit stream", {
        ticketId,
      });
    }

    // 5. Enqueue email notification to owner via background queue (with auto-retry)
    // ── WHAT: Dispatches email via QueueService worker with exponential backoff retries.
    // ── WHY: Decouples external Resend API latency and handles transient rate-limits safely.
    // ── WHERE & WHEN TO USE: Whenever asynchronous outbound webhooks/emails are triggered.
    // ── USE CASES: Contact ticket notifications, dispute alerts.
    // ── WHEN NOT TO USE: When the client awaits an immediate synchronous token or payload.
    enqueue(
      `contact-email-${ticketId}`,
      () =>
        sendContactNotification({
          ticketId,
          category: safeCategory,
          name: safeName,
          email: safeEmail,
          message: safeMessage,
          ip,
        }),
      { maxRetries: 2 },
    );

    return res.status(201).json({
      success: true,
      ticketId,
      category: safeCategory,
      message: "Your message has been dispatched to the GitRoast team.",
      saved: savedToDb,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Contact", "Error processing contact message", {
      error: err.message,
    });
    return res.status(500).json({
      error: "Failed to dispatch contact message. Please try again or email directly.",
      code: "DISPATCH_FAILED",
    });
  }
});

module.exports = router;
