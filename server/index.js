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
const compression = require("compression");
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
const { logger, logRequest, recordHealthPing, attachProcessHandlers } = require("./utils/logger");
const { startKeepAlive } = require("./services/keepAliveService");

// ── Step 1: Attach process-level error handlers ───────────────
// WHY FIRST: ensures uncaughtException and unhandledRejection are
//            captured even during server startup (DB connect, etc.)
attachProcessHandlers();

const app = express();
// WHY trust proxy: Render runs behind a reverse proxy — without this,
//     req.ip is inaccurate, rate limiters can be bypassed via spoofed
//     X-Forwarded-For headers, and Express proxy optimizations are disabled.
app.set("trust proxy", 1);
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

// ── Step 2b: Response compression ─────────────────────────────
// WHY: Gzip/Brotli compresses JSON payloads (leaderboard, wrapped, history)
//      by 60-80%, dramatically reducing bandwidth and improving TTFB
app.use(compression());

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

// ── Step 3b: Health check (after CORS, before body parsing) ───
// WHY here: Must be AFTER CORS so browser cross-origin requests from
//     Vercel (checkHealth/wakeUpServer) receive Access-Control-Allow-Origin.
//     Must be BEFORE express.json/cookieParser/logRequest to skip unnecessary
//     middleware overhead on high-frequency keep-alive pings (every 5s).
app.get(["/health", "/api/health"], (req, res) => {
  // ── WHAT: ────────────────────────────────────────────────────
  // Increments dedicated health ping heartbeat telemetry counter.
  // ── WHY: ─────────────────────────────────────────────────────
  // Health checks bypass logRequest middleware to save CPU on 5s pings,
  // but calling recordHealthPing here allows logger.js to emit a clean
  // 5-minute keep-alive summary without request-level log flooding.
  // ── WHERE & WHEN TO USE: ─────────────────────────────────────
  // High-frequency health / keep-alive ping handlers mounted before logRequest.
  // ── USE CASES: ───────────────────────────────────────────────
  // Render keep-alive and Docker healthcheck heartbeat monitoring.
  // ── WHEN NOT TO USE: ─────────────────────────────────────────
  // Do not call in standard application business routes.
  recordHealthPing();

  res.json({
    status: "🔥 GitRoast server is alive",
    time: new Date().toISOString(),
    mongoDb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    env: process.env.NODE_ENV || "development",
  });
});

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
app.use("/api/contact", require("./routes/contact"));

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
    // WHY pool settings: maintains warm connections, eliminates connection churn under concurrent spikes
    maxPoolSize: 20,
    minPoolSize: 2,
    socketTimeoutMS: 45000,
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
