require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const {
  roastLimiter,
  authLimiter,
  generalLimiter,
} = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Security Headers ─────────────────────────────────────
// WHY: basic security hardening — no extra package needed
app.use((req, res, next) => {
  // WHY: prevents clickjacking attacks
  res.setHeader("X-Frame-Options", "DENY");
  // WHY: prevents MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // WHY: forces HTTPS in production
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }
  next();
});

// ─── Core Middleware ──────────────────────────────────────
app.use(
  cors({
    origin: [process.env.CLIENT_URL || "http://localhost:3000"],
    credentials: true,
  }),
);
app.use(express.json({ limit: "10kb" })); // WHY limit: prevent payload attacks
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ─── General rate limit on all routes ────────────────────
app.use("/api", generalLimiter);

// ─── Routes ───────────────────────────────────────────────
// WHY specific limiters per route group:
//     roast = most expensive (GitHub API calls)
//     auth  = security sensitive
app.use("/api/roast", roastLimiter, require("./routes/roast"));
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/history", require("./routes/history"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/battle", require("./routes/battle"));

// ─── Health Check ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "GitRoast server is alive 🔥",
    time: new Date().toISOString(),
    mongoDb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    env: process.env.NODE_ENV || "development",
  });
});

// ─── 404 + Global Error Handlers ─────────────────────────
// WHY: must come AFTER all routes — Express reads top to bottom
app.use(notFoundHandler);
app.use(errorHandler);

// ─── MongoDB + Server Start ───────────────────────────────
// WHY: start server ONLY after DB connects
//      routes that need DB won't fail on first request
mongoose
  .connect(process.env.MONGODB_URI, {
    // WHY these options: prevents mongoose deprecation warnings
    serverSelectionTimeoutMS: 5000, // WHY: fail fast if Atlas unreachable
  })
  .then(() => {
    console.log("✅ MongoDB Atlas connected");
    app.listen(PORT, () => {
      console.log(`🔥 GitRoast server running on port ${PORT}`);
      console.log(`📡 Health: http://localhost:${PORT}/health`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ─── Graceful shutdown ────────────────────────────────────
// WHY: close DB connection cleanly when server stops
//      prevents data corruption on unexpected shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received — shutting down gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received — shutting down gracefully");
  await mongoose.connection.close();
  process.exit(0);
});
