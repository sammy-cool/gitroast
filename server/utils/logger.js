// ============================================================
// GITROAST — Universal Server Logger & Dynamic Telemetry Engine
// ============================================================
// WHAT: Centralized structured logging and dynamic telemetry utility for
//       the entire backend. Captures HTTP requests, errors, warnings,
//       and runtime telemetry with zero external dependencies.
//
// DESIGN PRINCIPLES & INDUSTRY STANDARDS:
//   • RFC 5424 severity levels: Numeric severity (3=ERROR, 4=WARN, 6=INFO/HTTP, 7=DEBUG)
//     enabling numeric filtering in CloudWatch, Grafana Loki, Datadog.
//   • OpenTelemetry (OTel) & ECS standard metadata:
//     - traceId (derived from X-Request-Id / UUID) & spanId (16-hex characters)
//     - service identity (service, version, env, hostname, pid, uptime)
//     - memory health (heapUsedMb, heapTotalMb)
//     - client telemetry (ip, userAgent, method, route, status, durationMs, bytes)
//   • Sensitive Data Sanitization:
//     - Automatically redacts authorization headers, bearer tokens, passwords,
//       API keys, cookies, and secret fields from all logged metadata.
//   • Dynamic Log Suppression & Intelligent Rollup:
//     - Automatically monitors request frequency per route in a sliding window.
//     - High-frequency endpoints (e.g. /health pings every 5s, /api/roast/feed polls)
//       are dynamically identified and their successful (2xx/3xx) individual lines
//       are automatically suppressed to eliminate Render log noise and save bandwidth.
//     - Safety Guarantee: 4xx and 5xx errors are NEVER suppressed — logged immediately.
//     - Periodic Rollup Aggregation: Suppressed requests are summarized every 2m with
//       hit counts, avg response times, and status distributions.
//     - Dynamic Traffic Decay: Automatically restores individual logging if route
//       traffic drops back below threshold.
//   • Non-blocking & Leak-proof:
//     - Native process.stdout/stderr streams with zero sync disk I/O.
//     - All background intervals use .unref() to never block process exit or tests.
//     - In-memory tracker bounded with strict capacity limits (LRU-style pruning).
//
// WHERE: Used by errorHandler.js, index.js, and all service/route modules.
//        Imported as: const { logger, logRequest, attachProcessHandlers } = require('../utils/logger')
// ============================================================

const { randomUUID, randomBytes } = require("crypto");
const os = require("os");

// ── Service metadata (resolved once at module load) ───────────
const packageJson = (() => {
  try {
    return require("../package.json");
  } catch {
    return { version: "1.0.0" };
  }
})();

const SERVICE_META = {
  service: "gitroast-api",
  version: packageJson.version || "1.0.0",
  hostname: os.hostname(),
  pid: process.pid,
  nodeVersion: process.version,
  env: process.env.NODE_ENV || "development",
};

// Terminal color codes for visual triage in development
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

// RFC 5424 numeric severity levels
const LEVELS = {
  ERROR: { severity: 3, emoji: "🔴", color: COLORS.red, label: "ERROR" },
  WARN: { severity: 4, emoji: "⚠️", color: COLORS.yellow, label: "WARN" },
  INFO: { severity: 6, emoji: "✅", color: COLORS.green, label: "INFO" },
  HTTP: { severity: 6, emoji: "🌐", color: COLORS.magenta, label: "HTTP" },
  DEBUG: { severity: 7, emoji: "🔍", color: COLORS.cyan, label: "DEBUG" },
};

const IS_PROD = process.env.NODE_ENV === "production";

// ── Sensitive Key Sanitization ────────────────────────────────
// WHY: Prevents credentials, authorization tokens, session cookies, and API keys
//      from leaking into log drains, CloudWatch, Datadog, or external log stores.
const SENSITIVE_KEY_REGEX = /authorization|password|token|secret|cookie|apikey|api_key|credential|githubaccesstoken|signature|key/i;

function sanitizeMeta(obj, depth = 0) {
  if (!obj || typeof obj !== "object" || depth > 4) return obj;

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: obj.message,
      code: obj.code,
      stack: obj.stack,
    };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeMeta(item, depth + 1));
  }

  const sanitized = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof val === "string" && val.startsWith("Bearer ") && val.length > 12) {
      sanitized[key] = "Bearer [REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      sanitized[key] = sanitizeMeta(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

// ── URL Query String Sanitizer ────────────────────────────────
// WHAT: Redacts sensitive parameters (key, token, secret, auth, code, password) from URLs.
// WHY: Prevents credentials and API tokens in query strings from leaking into HTTP access logs.
function sanitizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  return rawUrl.replace(
    /([?&](?:key|token|secret|auth|code|password|apikey|api_key)=)[^&]+/gi,
    "$1[REDACTED]"
  );
}

// ── Memory telemetry helper ───────────────────────────────────
function getMemoryMetrics() {
  try {
    const mem = process.memoryUsage();
    return {
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 10) / 10,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 10) / 10,
    };
  } catch {
    return undefined;
  }
}

// ── Core Formatter ────────────────────────────────────────────
// WHAT: Formats structured JSON in production (parseable by Datadog, ELK, CloudWatch)
//       and readable coloured text in development.
function format(level, context, message, meta = {}) {
  const ts = new Date().toISOString();
  const levelData = LEVELS[level] || LEVELS.INFO;
  const cleanMeta = sanitizeMeta(meta);

  if (IS_PROD) {
    // OpenTelemetry standard fields: traceId, spanId, resource attributes
    const traceId = cleanMeta.traceId || cleanMeta.requestId || undefined;
    const spanId = cleanMeta.spanId || undefined;

    return JSON.stringify({
      ts,
      level: levelData.label,
      severity: levelData.severity,
      context,
      message,
      ...SERVICE_META,
      uptimeSec: Math.round(process.uptime()),
      traceId,
      spanId,
      ...cleanMeta,
    });
  }

  // Coloured developer format for instant visual scanning
  const color = levelData.color;
  const emoji = levelData.emoji;
  const reset = COLORS.reset;
  const grey = COLORS.grey;
  const metaStr = Object.keys(cleanMeta).length
    ? " " + grey + JSON.stringify(cleanMeta) + reset
    : "";

  return (
    grey +
    ts +
    reset +
    " " +
    emoji +
    " " +
    color +
    "[" +
    levelData.label +
    "]" +
    reset +
    " " +
    color +
    "[" +
    context +
    "]" +
    reset +
    " " +
    message +
    metaStr
  );
}

// ── Base Log Output ───────────────────────────────────────────
function log(level, context, message, meta = {}) {
  const entry = format(level, context, message, meta);
  if (level === "ERROR") {
    process.stderr.write(entry + "\n");
  } else {
    process.stdout.write(entry + "\n");
  }
}

// ── Log Throttling / Deduplication Engine ─────────────────────
// WHY: If a repetitive warning or error fires 100 times in 5 seconds (e.g. repeated
//      timeout or database retry), throttle it to prevent console buffer flooding.
const messageThrottle = new Map();
const THROTTLE_WINDOW_MS = 5000;

function throttledLog(level, context, message, meta = {}) {
  const key = `${level}:${context}:${message}`;
  const now = Date.now();
  const entry = messageThrottle.get(key);

  if (!entry || now - entry.firstSeen > THROTTLE_WINDOW_MS) {
    if (entry && entry.count > 1) {
      log(
        level,
        context,
        `[Suppressed ${entry.count - 1} duplicate "${message}" occurrences in last ${Math.round((now - entry.firstSeen) / 1000)}s]`
      );
    }
    messageThrottle.set(key, { firstSeen: now, count: 1 });
    log(level, context, message, meta);
  } else {
    entry.count++;
  }
}

// Prune stale throttles periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of messageThrottle.entries()) {
    if (now - val.firstSeen > THROTTLE_WINDOW_MS * 2) {
      messageThrottle.delete(key);
    }
  }
}, 30000).unref();

// ── Public Logger Object ──────────────────────────────────────
const logger = {
  info: (ctx, msg, meta) => log("INFO", ctx, msg, meta),
  warn: (ctx, msg, meta) => throttledLog("WARN", ctx, msg, meta),
  error: (ctx, msg, meta) => throttledLog("ERROR", ctx, msg, meta),
  debug: (ctx, msg, meta) => {
    if (!IS_PROD) log("DEBUG", ctx, msg, meta);
  },
  // Child logger with bound context/tracing
  child: (defaults = {}) => ({
    info: (ctx, msg, meta) => log("INFO", ctx, msg, { ...defaults, ...meta }),
    warn: (ctx, msg, meta) => throttledLog("WARN", ctx, msg, { ...defaults, ...meta }),
    error: (ctx, msg, meta) => throttledLog("ERROR", ctx, msg, { ...defaults, ...meta }),
    debug: (ctx, msg, meta) => {
      if (!IS_PROD) log("DEBUG", ctx, msg, { ...defaults, ...meta });
    },
  }),
};

// ============================================================
// DYNAMIC LOG SUPPRESSION & ROLLUP ENGINE
// ============================================================
// HOW IT WORKS:
//   1. Static paths (/health, /api/health) are suppressed from day one.
//   2. Incoming paths are tracked in a 60-second sliding traffic window.
//   3. When ANY path exceeds HIGH_FREQ_THRESHOLD (default: 12 req/min), the
//      engine automatically classifies it as high-frequency and suppresses
//      its individual 2xx/3xx HTTP log lines.
//   4. 4xx/5xx errors are NEVER suppressed.
//   5. Suppressed requests are accumulated in rollupStore. Every ROLLUP_INTERVAL_MS
//      (default: 2 minutes), a single consolidated summary is logged.
//   6. If traffic on an auto-suppressed path subsides below DECAY_THRESHOLD (<4 req/min),
//      the engine automatically restores individual line logging.
// ============================================================

const STATIC_SUPPRESSED_PATHS = new Set(
  (process.env.SUPPRESSED_LOG_PATHS || "/health,/api/health")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

const HIGH_FREQ_THRESHOLD = parseInt(process.env.LOG_HIGH_FREQ_THRESHOLD, 10) || 12;
const DECAY_THRESHOLD = 4;
const WINDOW_DURATION_MS = 60 * 1000; // 1-minute sliding window
const ROLLUP_INTERVAL_MS = 2 * 60 * 1000; // 2-minute rollup summary interval
const MAX_TRACKED_PATHS = 500;

// Dynamic state structures
const dynamicallySuppressedPaths = new Set();
const pathTrafficTracker = new Map(); // path -> { hits: number, windowStart: number }
const rollupAccumulator = new Map();  // path -> { count, totalMs, minMs, maxMs, statusCodes: {} }

// Normalize paths to group similar sub-routes or strip query params
function normalizePath(rawPath) {
  if (!rawPath) return "/";
  const pathOnly = rawPath.split("?")[0];
  return pathOnly.toLowerCase();
}

// Track path hit and evaluate dynamic auto-suppression
function trackPathTraffic(path) {
  if (STATIC_SUPPRESSED_PATHS.has(path)) return true;

  const now = Date.now();
  let stats = pathTrafficTracker.get(path);

  if (!stats || now - stats.windowStart > WINDOW_DURATION_MS) {
    if (pathTrafficTracker.size >= MAX_TRACKED_PATHS) {
      const oldestKey = pathTrafficTracker.keys().next().value;
      pathTrafficTracker.delete(oldestKey);
    }
    stats = { hits: 1, windowStart: now };
    pathTrafficTracker.set(path, stats);
  } else {
    stats.hits++;
  }

  // Auto-identify high-frequency noisy paths
  if (stats.hits >= HIGH_FREQ_THRESHOLD && !dynamicallySuppressedPaths.has(path)) {
    dynamicallySuppressedPaths.add(path);
    logger.info(
      "DynamicLogger",
      `🔇 Auto-suppressed high-frequency path: ${path} (${stats.hits} req/min > threshold ${HIGH_FREQ_THRESHOLD})`
    );
  }

  return dynamicallySuppressedPaths.has(path);
}

// Dedicated Health Ping Heartbeat Counter
const HEALTH_PATHS = new Set(["/health", "/api/health"]);
let healthPingCount = 0;

// Record suppressed request into rollup store
function recordRollup(path, duration, status) {
  // If health ping, track in dedicated lightweight counter
  if (HEALTH_PATHS.has(path)) {
    healthPingCount++;
    return;
  }

  let item = rollupAccumulator.get(path);
  if (!item) {
    item = { count: 0, totalMs: 0, minMs: duration, maxMs: duration, statusCodes: {} };
    rollupAccumulator.set(path, item);
  }

  item.count++;
  item.totalMs += duration;
  item.minMs = Math.min(item.minMs, duration);
  item.maxMs = Math.max(item.maxMs, duration);
  item.statusCodes[status] = (item.statusCodes[status] || 0) + 1;
}

// Dedicated Health Ping Heartbeat Summary (every 5 minutes)
// WHY: Keeps high-frequency /health keep-alive traffic out of the route rollup
//      while providing transparent visibility that keep-alive pings are thriving.
setInterval(() => {
  if (healthPingCount > 0) {
    logger.info(
      "Health",
      `🏥 Keep-alive heartbeat: ${healthPingCount} pings received (all OK) in last 5m`
    );
    healthPingCount = 0;
  }
}, 5 * 60 * 1000).unref();

// Periodic Rollup & Decay Check
setInterval(() => {
  // 1. Output Rollup Summary if there were suppressed requests
  if (rollupAccumulator.size > 0) {
    const summaryBreakdown = {};
    let totalSuppressed = 0;
    const parts = [];

    for (const [path, stats] of rollupAccumulator.entries()) {
      totalSuppressed += stats.count;
      const avgMs = Math.round((stats.totalMs / stats.count) * 10) / 10;
      summaryBreakdown[path] = {
        count: stats.count,
        avgMs,
        minMs: stats.minMs,
        maxMs: stats.maxMs,
        statusCodes: stats.statusCodes,
      };
      parts.push(`${path}: ${stats.count} hits (avg ${avgMs}ms)`);
    }

    if (IS_PROD) {
      log("INFO", "DynamicLogger", "High-frequency traffic rollup summary", {
        totalSuppressed,
        routes: summaryBreakdown,
        memory: getMemoryMetrics(),
      });
    } else {
      logger.info(
        "DynamicLogger",
        `🔄 High-frequency traffic rollup (last 2m, ${totalSuppressed} total): ${parts.join(" · ")}`
      );
    }

    rollupAccumulator.clear();
  }

  // 2. Traffic Decay: un-suppress paths whose traffic subsided
  const now = Date.now();
  for (const path of dynamicallySuppressedPaths) {
    if (STATIC_SUPPRESSED_PATHS.has(path)) continue;
    const stats = pathTrafficTracker.get(path);
    if (!stats || now - stats.windowStart > WINDOW_DURATION_MS * 2 || stats.hits < DECAY_THRESHOLD) {
      dynamicallySuppressedPaths.delete(path);
      logger.info(
        "DynamicLogger",
        `🔊 Restored individual logging for path: ${path} (traffic normalized to <${DECAY_THRESHOLD} req/min)`
      );
    }
  }
}, ROLLUP_INTERVAL_MS).unref();

// ── HTTP Request Logger Middleware ────────────────────────────
// WHAT: Logs incoming HTTP requests with OpenTelemetry trace correlation,
//       dynamic noise suppression, and performance metrics.
function logRequest(req, res, next) {
  const start = Date.now();
  const normalizedPath = normalizePath(req.path || req.originalUrl);

  // Request correlation: reuse upstream X-Request-Id or generate fresh UUID
  const requestId = req.headers["x-request-id"] || randomUUID();
  req.id = requestId;
  res.setHeader("X-Request-Id", requestId);

  // OpenTelemetry Span ID (16 hex chars)
  const spanId = randomBytes(8).toString("hex");

  // Track path frequency
  const isSuppressed = trackPathTraffic(normalizedPath);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Safety First: Errors & Warnings (>=400) are NEVER suppressed
    if (status >= 400) {
      const level = status >= 500 ? "ERROR" : "WARN";
      const ip = req.ip || req.socket?.remoteAddress || "unknown";
      log(level, "HTTP", `${req.method} ${sanitizeUrl(req.originalUrl)}`, {
        status,
        ms: duration,
        ip,
        requestId,
        traceId: requestId,
        spanId,
        route: req.route?.path || undefined,
        bytes: res.getHeader("content-length") ? parseInt(res.getHeader("content-length"), 10) : undefined,
      });
      return;
    }

    // High-frequency suppression: route to accumulator instead of console
    if (isSuppressed) {
      recordRollup(normalizedPath, duration, status);
      return;
    }

    // Normal logging for low-frequency, successful endpoints
    const ip = req.ip || req.socket?.remoteAddress || "unknown";
    const contentLength = res.getHeader("content-length");

    log("HTTP", "HTTP", `${req.method} ${sanitizeUrl(req.originalUrl)}`, {
      status,
      ms: duration,
      ip,
      requestId,
      traceId: requestId,
      spanId,
      route: req.route?.path || undefined,
      bytes: contentLength ? parseInt(contentLength, 10) : undefined,
      userAgent: IS_PROD
        ? (req.headers["user-agent"] || "").slice(0, 120) || undefined
        : undefined,
    });
  });

  next();
}

// ── Process-level Error Capturing ─────────────────────────────
function attachProcessHandlers() {
  process.on("uncaughtException", (err) => {
    logger.error("Process", "💥 UNCAUGHT EXCEPTION — process will exit", {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Process", "💥 UNHANDLED PROMISE REJECTION — check this!", {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });

  process.on("SIGTERM", () => {
    logger.info("Process", "🛑 SIGTERM received — shutting down gracefully");
    process.exit(0);
  });

  logger.info("Process", "✅ Process error handlers and dynamic logger initialized", {
    ...SERVICE_META,
    memory: getMemoryMetrics(),
    suppressedStaticPaths: Array.from(STATIC_SUPPRESSED_PATHS),
  });
}

// Observability inspector for health audits and automated test verification
function getDynamicLoggerStats() {
  return {
    staticSuppressed: Array.from(STATIC_SUPPRESSED_PATHS),
    dynamicallySuppressed: Array.from(dynamicallySuppressedPaths),
    trackedPathsCount: pathTrafficTracker.size,
    rollupStoreCount: rollupAccumulator.size,
  };
}

module.exports = {
  logger,
  logRequest,
  attachProcessHandlers,
  getDynamicLoggerStats,
  sanitizeMeta,
  sanitizeUrl,
};
