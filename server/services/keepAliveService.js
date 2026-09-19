// ============================================================
// GITROAST — Render Keep-Alive Service
// ============================================================
// WHAT: Periodically pings the server's public health endpoint.
// WHY:
//   Render free-tier web services automatically spin down after
//   15 minutes of inactivity. Pinging the public URL every 14
//   minutes keeps the container warm and eliminates 50s cold starts.
// ============================================================

const { logger } = require("../utils/logger");

const PING_INTERVAL_MS = 14 * 60 * 1000; // 14 minutes (Render spins down at 15m)

function getHealthUrl() {
  if (process.env.RENDER_EXTERNAL_URL) {
    return `${process.env.RENDER_EXTERNAL_URL}/health`;
  }
  if (process.env.BACKEND_URL) {
    return `${process.env.BACKEND_URL}/health`;
  }
  return "https://gitroast-latest.onrender.com/health";
}

async function pingHealth() {
  const targetUrl = getHealthUrl();
  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: { "User-Agent": "GitRoast-KeepAlive/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      logger.debug("KeepAlive", `✅ Self-ping succeeded (${res.status})`, { url: targetUrl });
    } else {
      logger.warn("KeepAlive", `⚠️ Self-ping returned status ${res.status}`, { url: targetUrl });
    }
    return res.ok;
  } catch (err) {
    logger.warn("KeepAlive", `Self-ping warning: ${err.message}`, { url: targetUrl });
    return false;
  }
}

function startKeepAlive() {
  const isProduction = process.env.NODE_ENV === "production";
  const isRender = Boolean(process.env.RENDER || process.env.RENDER_EXTERNAL_URL);
  const isExplicit = process.env.ENABLE_KEEP_ALIVE === "true";

  // Only run in production / Render environments, or when explicitly requested
  if (!isProduction && !isRender && !isExplicit) {
    logger.info("KeepAlive", "Idle keep-alive disabled in non-production environment.");
    return null;
  }

  logger.info("KeepAlive", "🚀 Keep-alive scheduler initialized (14 min interval)", {
    target: getHealthUrl(),
  });

  const timer = setInterval(() => {
    pingHealth();
  }, PING_INTERVAL_MS);

  // Unref so the timer does not prevent process exit during tests/shutdown
  if (timer.unref) timer.unref();

  return timer;
}

module.exports = {
  startKeepAlive,
  pingHealth,
  getHealthUrl,
};
