// ============================================================
// GITROAST — Serverless Redis Service Adapter (Upstash)
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Universal key-value cache and rate limit store adapter powered by Upstash Redis REST API.
// Features transparent automatic fallback to a local in-memory Map if Upstash credentials
// (`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`) are not provided.
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Horizontal Scalability: When GitRoast scales across multiple Render containers,
//    rate-limit counters and idempotency locks are unified in a single cloud Redis instance.
// 2. HTTP/REST Stateless Transport: Connects via stateless HTTPS fetch requests, eliminating
//    TCP connection pool exhaustion common in serverless or auto-scaling container environments.
// 3. Resilient Fail-Safe: If Redis is unconfigured or experiences network downtime,
//    all operations seamlessly degrade to the local in-memory store with zero downtime.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// • In `server/middleware/rateLimiter.js` for distributed IP quota tracking.
// • In `server/routes/roast.js` for distributed idempotency lock deduplication.
// • In `server/services/queueService.js` for ephemeral task coordinating.
//
// ── USE CASES: ───────────────────────────────────────────────
// • Incrementing sliding-window rate limit counters with TTL expiration.
// • Atomic SETNX locks to prevent concurrent duplicate roast requests.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// • DO NOT use Redis for persistent database models (Users, Roasts, Battles, Payments).
//   MongoDB Atlas is the permanent system of record.
// ============================================================

const { Redis } = require("@upstash/redis");
const { logger } = require("../utils/logger");

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient = null;
const isConfigured = Boolean(url && token);

if (isConfigured) {
  try {
    redisClient = new Redis({ url, token });
    logger.info("Redis", "Connected to Upstash Serverless Redis");
  } catch (err) {
    logger.warn("Redis", "Failed to initialize Upstash Redis, falling back to in-memory store", {
      message: err.message,
    });
    redisClient = null;
  }
} else {
  logger.info("Redis", "Upstash Redis credentials not set — running with local in-memory store");
}

// Fallback in-memory store when Redis is not configured
const memoryStore = new Map();

// Periodic cleanup of expired in-memory items (5-minute interval)
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of memoryStore.entries()) {
    if (v.expiresAt && v.expiresAt < now) {
      memoryStore.delete(k);
    }
  }
  // Hard capacity cap against memory exhaustion
  if (memoryStore.size >= 50000) memoryStore.clear();
}, 5 * 60 * 1000).unref();

/**
 * Increment a key with window expiration in seconds
 * @param {string} key - Cache key
 * @param {number} ttlSeconds - Time-to-live in seconds
 * @returns {Promise<{ count: number, ttl: number }>}
 */
async function incrWithTtl(key, ttlSeconds = 60) {
  if (redisClient) {
    try {
      const count = await redisClient.incr(key);
      let ttl = await redisClient.ttl(key);
      if (count === 1 || ttl === -1) {
        await redisClient.expire(key, ttlSeconds);
        ttl = ttlSeconds;
      }
      return { count, ttl: ttl > 0 ? ttl : ttlSeconds };
    } catch (err) {
      logger.warn("Redis", "Redis incr error, using in-memory fallback", { message: err.message });
      // Fall through to memoryStore below
    }
  }

  // In-memory fallback
  const now = Date.now();
  const existing = memoryStore.get(key);
  if (!existing || existing.expiresAt < now) {
    memoryStore.set(key, { count: 1, expiresAt: now + ttlSeconds * 1000 });
    return { count: 1, ttl: ttlSeconds };
  }

  existing.count += 1;
  const remainingSecs = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));
  return { count: existing.count, ttl: remainingSecs };
}

/**
 * Get value of a key
 * @param {string} key
 * @returns {Promise<any>}
 */
async function get(key) {
  if (redisClient) {
    try {
      return await redisClient.get(key);
    } catch (err) {
      logger.warn("Redis", "Redis get error, falling back to memory", { message: err.message });
    }
  }
  const item = memoryStore.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }
  return item.value !== undefined ? item.value : item;
}

/**
 * Set a key with optional expiration
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlSeconds]
 */
async function set(key, value, ttlSeconds = null) {
  if (redisClient) {
    try {
      if (ttlSeconds) {
        return await redisClient.set(key, value, { ex: ttlSeconds });
      }
      return await redisClient.set(key, value);
    } catch (err) {
      logger.warn("Redis", "Redis set error, falling back to memory", { message: err.message });
    }
  }
  const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  memoryStore.set(key, { value, expiresAt });
  return "OK";
}

module.exports = {
  isConfigured,
  incrWithTtl,
  get,
  set,
  redisClient,
};
