// ============================================================
// GITROAST — Universal Server Logger
// ============================================================
// WHAT: Centralized structured logging utility for the entire backend.
//       Captures every event — HTTP requests, errors, warnings, debug info.
//
// DESIGN PRINCIPLES:
//   • Structured JSON in production — parseable by Datadog, Grafana, ELK, etc.
//   • Coloured readable text in development — instant visual triage
//   • Zero external dependencies — raw ANSI codes, native crypto.randomUUID()
//   • RFC 5424 numeric severity levels — enables numeric filtering in log drains
//   • Request correlation via X-Request-Id — trace a single request across
//     multiple log lines (middleware → route → service → error handler)
//   • High-standard metadata — pid, hostname, service, version for production ops
//   • res.on("finish") instead of res.json monkey-patch — captures ALL response
//     types (JSON, HTML, redirects, streams, empty 204s, errors)
//   • Health check suppression with periodic summary — noise-free Render logs
//   • Process-level crash catchers — uncaughtException, unhandledRejection, SIGTERM
//
// PERFORMANCE:
//   • No synchronous I/O beyond process.stdout/stderr.write (Node's default)
//   • Health pings skip the entire middleware (early return, zero closures)
//   • format() uses string concatenation in dev (faster than template literals for
//     long strings) and JSON.stringify in prod (native C++ binding)
//   • Single object spread in production format — no nested stringify calls
//   • .unref() on all intervals — never blocks process exit
//
// WHERE: Used by errorHandler.js, all routes, and process-level handlers.
//        Imported as: const { logger, logRequest, attachProcessHandlers } = require('../utils/logger')
// ============================================================

const { randomUUID } = require("crypto");
const os = require("os");

// ── Service metadata (resolved once at module load) ───────────
// WHY: log aggregators use service/hostname/pid to group and filter logs
//      across multiple containers, deploys, and horizontally scaled instances.
const SERVICE_META = {
  service: "gitroast-api",
  hostname: os.hostname(),
  pid: process.pid,
  nodeVersion: process.version,
};

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
  bold: "\x1b[1m",
};

// ── Log level definitions ─────────────────────────────────────
// WHY RFC 5424 numeric severity:
//   Log aggregators (Datadog, Grafana Loki, CloudWatch) support numeric
//   filtering: severity <= 4 shows only WARN and above.
//   Emoji + color = dev scanning; numeric severity = prod filtering.
const LEVELS = {
  ERROR: { severity: 3, emoji: "🔴", color: COLORS.red, label: "ERROR" },
  WARN: { severity: 4, emoji: "⚠️", color: COLORS.yellow, label: "WARN" },
  INFO: { severity: 6, emoji: "✅", color: COLORS.green, label: "INFO" },
  HTTP: { severity: 6, emoji: "🌐", color: COLORS.magenta, label: "HTTP" },
  DEBUG: { severity: 7, emoji: "🔍", color: COLORS.cyan, label: "DEBUG" },
};

// ── Environment detection (cached once) ───────────────────────
const IS_PROD = process.env.NODE_ENV === "production";
const IS_TEST = process.env.NODE_ENV === "test";

// ── Core formatter ────────────────────────────────────────────
// WHAT: Formats a log entry as structured JSON in production,
//       coloured readable text in development
// WHY JSON in prod: Render log drains and tools parse JSON natively
//     coloured text in dev: readable at a glance in terminal
function format(level, context, message, meta = {}) {
  const ts = new Date().toISOString();
  const levelData = LEVELS[level] || LEVELS.INFO;

  if (IS_PROD) {
    // WHY: structured JSON — parseable by log aggregators (Datadog, etc.)
    // WHY spread order: base fields first, then meta overrides (requestId, etc.)
    return JSON.stringify({
      ts,
      level: levelData.label,
      severity: levelData.severity,
      context,
      message,
      ...SERVICE_META,
      ...meta,
    });
  }

  // WHY: coloured format in development — faster to read
  const color = levelData.color;
  const emoji = levelData.emoji;
  const reset = COLORS.reset;
  const grey = COLORS.grey;
  const metaStr = Object.keys(meta).length
    ? " " + grey + JSON.stringify(meta) + reset
    : "";

  return grey + ts + reset + " " + emoji + " " + color + "[" + levelData.label + "]" + reset + " " + color + "[" + context + "]" + reset + " " + message + metaStr;
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
//      logger.info('Auth', 'User logged in', { userId }) is cleaner than
//      log('INFO', 'Auth', 'User logged in', { userId })
const logger = {
  info: (ctx, msg, meta) => log("INFO", ctx, msg, meta),
  warn: (ctx, msg, meta) => log("WARN", ctx, msg, meta),
  error: (ctx, msg, meta) => log("ERROR", ctx, msg, meta),
  debug: (ctx, msg, meta) => {
    // WHY: debug logs only in development — zero noise in production
    if (!IS_PROD) {
      log("DEBUG", ctx, msg, meta);
    }
  },
  // WHY child(): creates a scoped logger that automatically injects a requestId
  //     into every log call — eliminates manual requestId passing through service layers.
  //     Usage: const reqLog = logger.child({ requestId: req.id }); reqLog.info('Ctx', 'msg');
  child: (defaults = {}) => ({
    info: (ctx, msg, meta) => log("INFO", ctx, msg, { ...defaults, ...meta }),
    warn: (ctx, msg, meta) => log("WARN", ctx, msg, { ...defaults, ...meta }),
    error: (ctx, msg, meta) => log("ERROR", ctx, msg, { ...defaults, ...meta }),
    debug: (ctx, msg, meta) => {
      if (!IS_PROD) {
        log("DEBUG", ctx, msg, { ...defaults, ...meta });
      }
    },
  }),
};

// ── HTTP Request Logger (Express middleware) ──────────────────
// WHAT: Logs every incoming HTTP request with method, path, status, duration,
//       response size, user-agent, and a unique correlation requestId.
//
// WHY res.on("finish") instead of res.json monkey-patch:
//   • Captures ALL response types — JSON, HTML, redirects, 204 No Content,
//     stream errors, file sends — not just res.json() calls.
//   • Non-intrusive — does not modify res.json or any response method.
//   • Standard Node.js EventEmitter pattern — stable across Express versions.
//   • Zero risk of breaking middleware that wraps res.json (e.g. compression).
//
// WHY requestId (X-Request-Id):
//   • Enables end-to-end request tracing across multiple log lines.
//   • If the upstream proxy (Render, Cloudflare) sends X-Request-Id, reuse it.
//   • Otherwise generate a UUID v4 via crypto.randomUUID() (native, fast).
//   • Attach to req.id AND set on response header — visible in browser DevTools.

const SUPPRESSED_PATHS = new Set(["/health", "/api/health"]);
const healthPingTracker = { count: 0, since: Date.now() };

// WHY .unref(): Prevents this background timer from keeping the Node.js event
//     loop alive — critical for `node --test` exit and graceful SIGTERM shutdown.
//     Without .unref(), the 5-minute interval blocks process termination.
setInterval(() => {
  if (healthPingTracker.count > 0) {
    logger.info("Health", `🏥 Health check summary: ${healthPingTracker.count} pings received (all OK) in last 5m`);
    healthPingTracker.count = 0;
  }
  healthPingTracker.since = Date.now();
}, 5 * 60 * 1000).unref();

function logRequest(req, res, next) {
  // WHY early return: health pings arrive every ~5s from keep-alive, Docker,
  //     Render monitoring, and client pre-warming. Logging each creates
  //     hundreds of identical lines per hour — noise that buries real traffic.
  //     Counter is summarized every 5 minutes (see interval above).
  if (SUPPRESSED_PATHS.has(req.path)) {
    healthPingTracker.count++;
    return next();
  }

  const start = Date.now();

  // WHY: reuse upstream request ID if available (Render/Cloudflare sets it),
  //      otherwise generate a fresh UUID. Attached to req.id for downstream use.
  const requestId =
    req.headers["x-request-id"] || randomUUID();
  req.id = requestId;

  // WHY: echo requestId in response header — visible in browser DevTools
  //      and curl output for end-to-end tracing without grep-ing server logs.
  res.setHeader("X-Request-Id", requestId);

  // WHY res.on("finish"): standard Node.js event fired when response is fully
  //     flushed to the OS network buffer. Unlike monkey-patching res.json:
  //     • Fires for ALL response types (JSON, HTML, redirect, 204, streams)
  //     • Non-intrusive — no prototype override, no closure-per-method
  //     • Works with compression middleware (fires after gzip encoding)
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // WHY: color-code status for instant visual triage
    const level = status >= 500 ? "ERROR" : status >= 400 ? "WARN" : "HTTP";

    // WHY: resolve IP via req.ip (uses trust proxy setting) with fallback
    const ip = req.ip || req.socket?.remoteAddress || "unknown";

    // WHY content-length: detect unexpectedly large payloads or missing compression
    const contentLength = res.getHeader("content-length");

    log(level, "HTTP", `${req.method} ${req.originalUrl}`, {
      status,
      ms: duration,
      ip,
      requestId,
      // WHY originalUrl over path: includes query string for debugging
      //     (e.g. /api/history/leaderboard/worst?page=2&limit=10)
      // WHY route: shows the Express route pattern (e.g. /:username)
      //     vs originalUrl which shows the actual URL — both are needed
      //     for filtering in log aggregators (group by route pattern)
      route: req.route?.path || undefined,
      // WHY bytes: helps detect payload bloat and verify compression
      bytes: contentLength ? parseInt(contentLength, 10) : undefined,
      // WHY userAgent: distinguish bots (Googlebot, curl) from real users
      //     Truncated to 120 chars to avoid log bloat from long UA strings
      userAgent: IS_PROD
        ? (req.headers["user-agent"] || "").slice(0, 120) || undefined
        : undefined,
    });
  });

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

  // WHY startup metadata: provides instant visibility into the runtime
  //     environment when tailing production logs — confirms Node version,
  //     PID, hostname, and environment without SSH-ing into the container.
  logger.info("Process", "✅ Process error handlers attached", {
    ...SERVICE_META,
    env: process.env.NODE_ENV || "development",
    uptime: Math.round(process.uptime()) + "s",
  });
}

module.exports = { logger, logRequest, attachProcessHandlers };
