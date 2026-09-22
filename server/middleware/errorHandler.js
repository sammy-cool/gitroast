// ============================================================
// GITROAST — Global Express Error Handler
// ============================================================
// WHAT: Catches all errors passed via next(err) from any route,
//       maps them to clean HTTP responses, and logs everything.
//
// WHY:  Without a global handler, unhandled errors give Express's
//       default "Cannot GET /..." HTML response — ugly, exposes info.
//       Centralizing here means ONE place to change error formats.
//
// WHERE: Registered LAST in index.js after all routes:
//        app.use(notFoundHandler)
//        app.use(errorHandler)
// ============================================================

const { logger } = require("../utils/logger");

// ── Known error type map ───────────────────────────────────────
// WHAT: Maps error names/codes to structured HTTP responses
// WHY:  Readable, predictable — adding a new error type = add one entry here
//       Instead of duplicating if/else across every route file
const ERROR_MAP = {
  // WHY ValidationError: Mongoose schema validation failed
  //     Example: required field missing, wrong enum value
  ValidationError: (err) => ({
    status: 400,
    error: "VALIDATION_ERROR",
    message: Object.values(err.errors)
      .map((e) => e.message)
      .join(", "),
  }),

  // WHY CastError: MongoDB received invalid ObjectId format
  //     Example: /api/history/not-a-valid-id
  CastError: () => ({
    status: 400,
    error: "INVALID_ID",
    message: "Invalid ID format.",
  }),

  // WHY JsonWebTokenError: JWT was tampered with or malformed
  JsonWebTokenError: () => ({
    status: 401,
    error: "TOKEN_INVALID",
    message: "Invalid token. Please login again.",
  }),

  // WHY TokenExpiredError: JWT is valid but past its expiry time
  TokenExpiredError: () => ({
    status: 401,
    error: "TOKEN_EXPIRED",
    message: "Session expired. Please login again.",
  }),
};

// ── Main error handler ─────────────────────────────────────────
// WHAT: Express recognises this as an error handler because it has 4 args (err, req, res, next)
// WHY 4 params: Express convention — error handlers MUST have exactly 4 params
function errorHandler(err, req, res, next) {
  // WHY: prevents ERR_HTTP_HEADERS_SENT crash if error occurs after partial response
  if (res.headersSent) {
    return next(err);
  }
  // WHY: always log server-side — even if we return a clean response
  //      the log is how we discover bugs in production
  logger.error("ErrorHandler", `${req.method} ${req.path}`, {
    name: err.name,
    message: err.message,
    code: err.code,
    // WHY: stack only in dev — never expose internal paths in production
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  // WHY: check ERROR_MAP for known error types first
  const knownHandler = ERROR_MAP[err.name];
  if (knownHandler) {
    const { status, error, message } = knownHandler(err);
    return res.status(status).json({ error, message });
  }

  // WHY code 11000: MongoDB duplicate key (unique index violation)
  //     Example: same githubId trying to create a second user document
  if (err.code === 11000) {
    return res.status(409).json({
      error: "DUPLICATE_ENTRY",
      message: "This record already exists.",
    });
  }

  // WHY: fallback for any unknown error
  //      statusCode/status: allows routes to set custom status via err.statusCode
  const statusCode = err.statusCode || err.status || 500;

  // WHY: never expose raw error.message in production
  //      could leak internal logic, file paths, DB structure
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong. Please try again."
      : err.message;

  res.status(statusCode).json({ error: "SERVER_ERROR", message });
}

// ── 404 handler ────────────────────────────────────────────────
// WHAT: Catches requests to API routes that don't exist
// WHY:  Must be placed AFTER all route definitions in index.js
//       Express falls through to this only if no route matched
// WHERE: app.use(notFoundHandler) in index.js — just before errorHandler
function notFoundHandler(req, res) {
  logger.warn("404", `Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} does not exist.`,
  });
}

module.exports = { errorHandler, notFoundHandler };
