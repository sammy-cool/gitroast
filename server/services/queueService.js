// ============================================================
// GITROAST — Asynchronous Job Queue & Telemetry Worker
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Lightweight, in-process asynchronous task queue engine featuring concurrency throttling,
// exponential backoff retries, and telemetry logging.
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Latency Optimization: Decouples heavy non-blocking operations (email dispatches,
//    historical analytics aggregation, view telemetry) from the user's synchronous HTTP response.
// 2. Resource Management: Throttles background workloads to prevent Node.js event loop starvation
//    and MongoDB connection pool spikes.
// 3. Resilient Retries: Automatically retries transient upstream failures (e.g. Resend API rate limits)
//    without returning errors to the end-user.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// • In `server/routes/contact.js` for async email dispatch.
// • In `server/routes/history.js` and `server/routes/battle.js` for non-blocking view/share tracking.
// • For background cache pre-warming and database telemetry updates.
//
// ── USE CASES: ───────────────────────────────────────────────
// • Enqueueing contact ticket notification emails to the owner.
// • Offloading Wrapped commit aggregations in the background.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// • DO NOT use for synchronous request-response flows where the client requires immediate return data
//   (e.g. verifying a password or returning a signed JWT token).
// ============================================================

const { logger } = require("../utils/logger");

class JobQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  /**
   * Enqueue an async task with retry capability
   * @param {string} taskName - Human-readable task identifier
   * @param {Function} taskFn - Asynchronous worker function
   * @param {Object} options - { maxRetries: 2, delayMs: 0 }
   */
  enqueue(taskName, taskFn, options = {}) {
    const { maxRetries = 2, delayMs = 0 } = options;
    this.queue.push({
      taskName,
      taskFn,
      maxRetries,
      delayMs,
      retries: 0,
      enqueuedAt: Date.now(),
    });
    this.processNext();
  }

  async processNext() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    this.running++;

    if (job.delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, job.delayMs));
    }

    try {
      await job.taskFn();
      logger.debug("Queue", `Job completed: ${job.taskName}`, {
        durationMs: Date.now() - job.enqueuedAt,
      });
    } catch (err) {
      if (job.retries < job.maxRetries) {
        job.retries++;
        job.delayMs = Math.pow(2, job.retries) * 1000; // Exponential backoff: 2s, 4s
        logger.warn("Queue", `Job failed, retrying (${job.retries}/${job.maxRetries}): ${job.taskName}`, {
          error: err.message,
        });
        this.queue.push(job);
      } else {
        logger.error("Queue", `Job exhausted retries: ${job.taskName}`, {
          error: err.message,
        });
      }
    } finally {
      this.running--;
      this.processNext();
    }
  }

  /**
   * Get current queue statistics
   */
  getStats() {
    return {
      pending: this.queue.length,
      running: this.running,
      concurrency: this.concurrency,
    };
  }
}

const defaultQueue = new JobQueue(3);

module.exports = {
  JobQueue,
  defaultQueue,
  enqueue: (name, fn, opts) => defaultQueue.enqueue(name, fn, opts),
};
