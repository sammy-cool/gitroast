const mongoose = require("mongoose");
const { verifyToken, extractToken } = require("../services/tokenService");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Login required to access this resource.",
    });
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) {
    return res.status(401).json({
      error: "TOKEN_INVALID",
      message: "Session expired or invalid. Please login again.",
    });
  }

  try {
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: "USER_NOT_FOUND",
        message: "Account associated with this token was not found.",
      });
    }
    req.user = user;
    next();
  } catch {
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "Authentication validation check failed.",
    });
  }
}

async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  req.user = null;

  if (!token) return next();

  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId || !mongoose.Types.ObjectId.isValid(decoded.userId)) return next();

  try {
    const user = await User.findById(decoded.userId);
    if (user) req.user = user;
  } catch {
  }

  next();
}

function requirePro(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Please log in before accessing Pro features.",
    });
  }

  if (!req.user.isPro) {
    return res.status(403).json({
      error: "PRO_REQUIRED",
      message: "This feature requires an active GitRoast Pro account.",
    });
  }

  next();
}

function requireRecruiter(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "Please sign in to your recruiter workspace." });
  }
  if (req.user.role !== "recruiter") {
    return res.status(403).json({ error: "RECRUITER_REQUIRED", message: "This area is for recruiter workspaces." });
  }
  next();
}

module.exports = { requireAuth, optionalAuth, requirePro, requireRecruiter };

