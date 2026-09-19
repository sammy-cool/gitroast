// ============================================================
// GITROAST — Express Server Entry Point
// ============================================================
// WHAT: Bootstraps the entire backend application.
//       Wires together: middleware → routes → DB connection → server start.
//
// WHY this order matters:
//   1. Logger + process handlers FIRST — catch errors from startup
//   2. Security headers BEFORE cors/body-parser
//   3. Rate limiters BEFORE routes — blocks bad actors early
//   4. Routes registered with their specific limiters
//   5. Error handlers LAST — catches anything that falls through
//
// WHERE: Entry point for Docker container → CMD ["node", "index.js"]
// ============================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const {
  roastLimiter,
  authLimiter,
  battleLimiter, // WHY: battle = 2x GitHub API + AI — needs strict limit
  generalLimiter,
} = require("./middleware/rateLimiter");
const { logger, logRequest, attachProcessHandlers } = require("./utils/logger");
const { startKeepAlive } = require("./services/keepAliveService");

// ── Step 1: Attach process-level error handlers ───────────────
// WHY FIRST: ensures uncaughtException and unhandledRejection are
//            captured even during server startup (DB connect, etc.)
attachProcessHandlers();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Step 2: Security headers ──────────────────────────────────
// WHY before everything: applied to every response regardless of route
// WHY manual instead of helmet: zero additional dependency
app.use((req, res, next) => {
  // WHY X-Frame-Options: prevents clickjacking — embedding in iframes
  res.setHeader("X-Frame-Options", "DENY");

  // WHY X-Content-Type-Options: prevents MIME sniffing
  //     browser won't try to guess content type — prevents certain XSS vectors
  res.setHeader("X-Content-Type-Options", "nosniff");

  // WHY HSTS: forces HTTPS only in production — prevents SSL stripping attacks
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }

  next();
});

// ── Step 3: CORS ──────────────────────────────────────────────
// WHAT: Allows browser requests from authorized frontend domains
// WHY allowedHeaders: must list all custom headers sent by client,
//     including X-Captcha-Token and X-Idempotency-Key, to prevent preflight failures
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://gitroast-dev.vercel.app",
  "https://gitroast.dev",
  "https://www.gitroast.dev",
];

function isOriginAllowed(origin) {
  if (!origin) return true; // allow non-browser requests (curl, server-to-server)
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (process.env.CLIENT_URL) {
    const configured = process.env.CLIENT_URL.split(",").map((s) => s.trim().replace(/\/$/, ""));
    if (configured.includes(origin)) return true;
  }
  // Allow Vercel preview/production deployments for this app
  if (/^https:\/\/gitroast.*\.vercel\.app$/.test(origin)) return true;
  return false;
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        logger.warn("CORS", `Request blocked for origin: ${origin}`);
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Idempotency-Key",
      "X-Captcha-Token",
    ],
    exposedHeaders: ["X-Idempotency-Key", "Retry-After"],
    maxAge: 86400, // 24 hours preflight cache
  }),
);

// ── Step 4: Body parsing + cookies ───────────────────────────
app.use(
  express.json({
    limit: "10kb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser());

// ── Step 5: HTTP request logger ───────────────────────────────
// WHY: logs every request AFTER body parsed, BEFORE routes
//      so we can see what came in if a route throws
app.use(logRequest);

// ── Step 6: General rate limit on ALL /api routes ─────────────
// WHY: applied broadly — specific routes get stricter limiters below
app.use("/api", generalLimiter);

// ── Step 7: Routes with specific rate limiters ────────────────
// WHY route-specific limiters:
//   /roast  — most expensive (GitHub API calls per request) → strictest
//   /auth   — security sensitive (brute-force risk) → strict
//   /battle — expensive (2x GitHub API + AI) → handled inside battle route
//   others  — covered by generalLimiter above
app.use("/api/roast", roastLimiter, require("./routes/roast"));
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/history", require("./routes/history"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/battle", battleLimiter, require("./routes/battle"));

// ── Step 8: Health check ──────────────────────────────────────
// WHAT: Returns server status — used by Docker HEALTHCHECK, Render, and frontend pre-warming
// WHY ["/health", "/api/health"]: /health for Docker & Render internally;
//     /api/health for frontend pre-warming so privacy extensions/Brave do not block it as telemetry
app.get(["/health", "/api/health"], generalLimiter, (req, res) => {
  res.json({
    status: "🔥 GitRoast server is alive",
    time: new Date().toISOString(),
    mongoDb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    env: process.env.NODE_ENV || "development",
  });
});

// ── Step 9: 404 + global error handlers ──────────────────────
// WHY LAST: Express reads middleware top to bottom
//           if no route matched → falls to notFoundHandler
//           if any route called next(err) → falls to errorHandler
app.use(notFoundHandler);
app.use(errorHandler);

// ── Step 10: Connect DB then start server ─────────────────────
// WHY connect BEFORE listen: routes need DB — don't accept traffic until ready
mongoose
  .connect(process.env.MONGODB_URI, {
    // WHY: fail fast if Atlas unreachable — better 500 than hanging forever
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    logger.info("MongoDB", "✅ Connected to Atlas");
    app.listen(PORT, () => {
      logger.info("Server", `🚀 Running on port ${PORT}`, {
        env: process.env.NODE_ENV || "development",
        port: PORT,
      });
      startKeepAlive();
    });
  })
  .catch((err) => {
    logger.error("MongoDB", "❌ Connection failed — server cannot start", {
      message: err.message,
    });
    // WHY exit(1): DB is critical — no point running without it
    process.exit(1);
  });
