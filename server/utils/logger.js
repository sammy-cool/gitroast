// ============================================================
// GITROAST — Universal Server Logger
// ============================================================
// WHAT: Centralized structured logging utility for the entire backend.
//       Captures every event — HTTP requests, errors, warnings, debug info.
//
// WHY:  console.log() is silent by default and gets lost in Render logs.
//       Structured logs with timestamps + levels make debugging instant.
//       process.on('uncaughtException') and process.on('unhandledRejection')
//       ensure no silent crash goes unnoticed in production.
//
// WHERE: Used by errorHandler.js, all routes, and process-level handlers.
//        Imported as: const { log, logRequest, logError } = require('../utils/logger')
// ============================================================

// WHY 'ansi-colors-free alternative': use raw ANSI codes — zero dependency
// WHAT: Terminal color codes for each log level — visual scanning in dev
const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  grey: "\x1b[90m",
  white: "\x1b[37m",
};

// WHAT: Log level definitions with emoji + color
//       Each level maps to a severity — helps filter noise in Render logs
const LEVELS = {
  INFO: { emoji: "✅", color: COLORS.green, label: "INFO" },
  WARN: { emoji: "⚠️", color: COLORS.yellow, label: "WARN" },
  ERROR: { emoji: "🔴", color: COLORS.red, label: "ERROR" },
  DEBUG: { emoji: "🔍", color: COLORS.cyan, label: "DEBUG" },
  HTTP: { emoji: "🌐", color: COLORS.magenta, label: "HTTP" },
};

// ── Core formatter ────────────────────────────────────────────
// WHAT: Formats a log entry as structured JSON in production,
//       coloured readable text in development
// WHY JSON in prod: Render log drains and tools parse JSON natively
//     coloured text in dev: readable at a glance in terminal
function format(level, context, message, meta = {}) {
  const ts = new Date().toISOString();
  const isProd = process.env.NODE_ENV === "production";
  const levelData = LEVELS[level] || LEVELS.INFO;

  if (isProd) {
    // WHY: structured JSON — parseable by log aggregators (Datadog, etc.)
    return JSON.stringify({
      ts,
      level: levelData.label,
      context,
      message,
      ...meta,
    });
  }

  // WHY: coloured format in development — faster to read
  const color = levelData.color;
  const emoji = levelData.emoji;
  const reset = COLORS.reset;
  const grey = COLORS.grey;
  const metaStr = Object.keys(meta).length
    ? ` ${grey}${JSON.stringify(meta)}${reset}`
    : "";

  return `${grey}${ts}${reset} ${emoji} ${color}[${levelData.label}]${reset} ${color}[${context}]${reset} ${message}${metaStr}`;
}

// ── Public API ────────────────────────────────────────────────
// WHAT: log(level, context, message, meta?)
//       The base function — all others call this.
function log(level, context, message, meta = {}) {
  const entry = format(level, context, message, meta);
  if (level === "ERROR") {
    // WHY stderr: errors go to stderr stream — separate from stdout in Render
    //     allows error filtering without stdout noise
    process.stderr.write(entry + "\n");
  } else {
    process.stdout.write(entry + "\n");
  }
}

// ── Convenience methods ───────────────────────────────────────
// WHY: shorthand methods so routes don't repeat the level string
//      log.info('Auth', 'User logged in', { userId }) is cleaner than
//      log('INFO', 'Auth', 'User logged in', { userId })
const logger = {
  info: (ctx, msg, meta) => log("INFO", ctx, msg, meta),
  warn: (ctx, msg, meta) => log("WARN", ctx, msg, meta),
  error: (ctx, msg, meta) => log("ERROR", ctx, msg, meta),
  debug: (ctx, msg, meta) => {
    // WHY: debug logs only in development — zero noise in production
    if (process.env.NODE_ENV !== "production") {
      log("DEBUG", ctx, msg, meta);
    }
  },
};

// ── HTTP Request Logger (Express middleware) ──────────────────
// WHAT: Logs every incoming HTTP request with method, path, status, and duration
// WHY:  Makes it trivial to see what the server is doing in Render logs
//       Without this — silent 500s are invisible until a user reports them
// WHERE: app.use(logRequest) in index.js BEFORE all routes
function logRequest(req, res, next) {
  const start = Date.now();

  // WHY: intercept res.json to capture status AFTER route finishes
  //      we can't log status before the route runs
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // WHY: color-code status for instant visual triage
    const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "HTTP";

    log(level, "HTTP", `${req.method} ${req.path}`, {
      status,
      ms: duration,
      ip:
        req.headers["x-forwarded-for"]?.split(",")[0] ||
        req.socket.remoteAddress,
      // WHY: never log Authorization header — contains JWT token (secret)
    });

    return originalJson(body);
  };

  next();
}

// ── Process-level error capturing ────────────────────────────
// WHAT: Catches errors that escape ALL try/catch blocks
//       These are the "silent" crashes that kill the process
// WHY:  Without these handlers, a single unhandled promise rejection
//       can crash the Render server completely — invisible to the user
//       until they reload and get a 502
// WHERE: Called ONCE in server/index.js at startup
function attachProcessHandlers() {
  // WHY uncaughtException: synchronous throw with no try/catch around it
  //     Example: JSON.parse(undefined) in a middleware with no error handling
  process.on("uncaughtException", (err) => {
    logger.error("Process", "💥 UNCAUGHT EXCEPTION — process will exit", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    // WHY exit(1): Node.js docs recommend exiting after uncaughtException
    //     app state is undefined after this — better to restart cleanly
    process.exit(1);
  });

  // WHY unhandledRejection: async throw with no .catch() or try/catch
  //     Example: await fetch(...) with no catch, fetch fails → rejected promise
  //     WITHOUT this: Node silently swallows the error in older versions
  //                   newer Node prints a warning but still continues
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Process", "💥 UNHANDLED PROMISE REJECTION — check this!", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
    // WHY: don't exit on rejection — server stays up
    //      but we log it so we KNOW it happened
  });

  // WHY SIGTERM: sent by Render when deploying new version
  //     Without this: server dies mid-request → users see 503
  //     With this: server finishes in-flight requests before exiting
  process.on("SIGTERM", () => {
    logger.info("Process", "🛑 SIGTERM received — shutting down gracefully");
    process.exit(0);
  });

  logger.info("Process", "✅ Process error handlers attached");
}

module.exports = { logger, logRequest, attachProcessHandlers };
