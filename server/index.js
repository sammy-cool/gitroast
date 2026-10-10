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
  battleLimiter,
  generalLimiter,
} = require("./middleware/rateLimiter");
const { logger, logRequest, recordHealthPing, attachProcessHandlers } = require("./utils/logger");
const { startKeepAlive } = require("./services/keepAliveService");

attachProcessHandlers();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;

app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");

  res.setHeader("X-Content-Type-Options", "nosniff");

  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000");
  }

  next();
});

app.use(compression());

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://gitroast-dev.vercel.app",
  "https://gitroast.dev",
  "https://www.gitroast.dev",
];

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (process.env.CLIENT_URL) {
    const configured = process.env.CLIENT_URL.split(",").map((s) => s.trim().replace(/\/$/, ""));
    if (configured.includes(origin)) return true;
  }
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
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Idempotency-Key",
      "X-Captcha-Token",
    ],
    exposedHeaders: ["X-Idempotency-Key", "Retry-After"],
    maxAge: 86400,
  }),
);

app.get(["/health", "/api/health"], (req, res) => {
  recordHealthPing();

  res.json({
    status: "🔥 GitRoast server is alive",
    time: new Date().toISOString(),
    mongoDb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    env: process.env.NODE_ENV || "development",
  });
});

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

app.use(logRequest);

app.use("/api", generalLimiter);

app.use("/api/roast", roastLimiter, require("./routes/roast"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/history", require("./routes/history"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/battle", battleLimiter, require("./routes/battle"));
app.use("/api/contact", require("./routes/contact"));
app.use("/api/recruiter", require("./routes/recruiter"));

app.use(notFoundHandler);
app.use(errorHandler);

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
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
    process.exit(1);
  });

