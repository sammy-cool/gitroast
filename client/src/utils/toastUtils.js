// ============================================================
// GITROAST — Centralized Master Toast Notification Engine
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Unified, full-featured wrapper around the `customizable-toast-notification`
// npm package (authored by Priyanshu Patel / @sammy-cool).
// Provides modern dark card styling, fire-brand color palettes,
// custom cubic-bezier spring animations, progress bar positioning,
// interactive CTAs, promise-based toasts, and helper methods.
//
// ── WHY: ─────────────────────────────────────────────────────
// 1. Brand Consistency: GitRoast aesthetic requires deep obsidian cards (#141414)
//    with glowing fire accents (#FF4500, #FF6B00, #FFB700), matching --radius-md (12px),
//    rather than generic 50px pill shapes or mismatched timings.
// 2. Motion Design: Enhances user delight with 0.35s cubic-bezier(0.16, 1, 0.3, 1)
//    spring deceleration curve and pauseOnHover protection.
// 3. Actionable UX: Equips notifications with rich interactive CTA buttons/links
//    (e.g., direct GitHub OAuth redirect, upgrade modals, clipboard copy, retry).
// 4. Promise Automation: Built-in toastPromise integration gives instant loading
//    spinners followed by auto-settling success/error transitions for file exports
//    and async operations.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// Import in any client component across the application:
//   import { toast, createToast, toastPromise } from '@/utils/toast'
//   // OR
//   import { toast, createToast, toastPromise } from '@/utils/toastUtils'
//
// ── USE CASES: ───────────────────────────────────────────────
// - Asynchronous downloads (Roast certificates, Wrapped summaries, battle cards).
// - Interactive rate limit warnings with one-click GitHub OAuth CTA.
// - Pro feature gates with direct pricing modal triggers.
// - Copy-to-clipboard alerts with direct link previews.
// - Transaction confirmations and form submission feedback.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// Do not call in Node.js server-side code or API routes (requires browser DOM).
// Do not use for silent background telemetry (use logger.js instead).
// ============================================================

import {
  createToast as pkgCreateToast,
  toastPromise as pkgToastPromise,
  dismiss as pkgDismiss,
  setDefaultColors as pkgSetDefaultColors,
  setDefaultMessages as pkgSetDefaultMessages,
} from "customizable-toast-notification";

// ── GitRoast Theme Color Constants ────────────────────────────
// WHAT: Brand-aligned color palette matching GitRoast CSS design tokens.
// WHY: Centralizes visual identity across all notification states.
export const TOAST_COLORS = {
  success: "#00E676", // Emerald glow (--good)
  error: "#FF3D3D",   // Crimson flame (--bad)
  warning: "#FFB700", // Warm amber gold (--warn)
  info: "#FF6B00",    // GitRoast signature fire orange (--fire-mid)
  fire: "#FF4500",    // Blaze red-orange (--fire-dark)
  darkBg: "#141414",  // Obsidian charcoal card background (--bg-card)
  textLight: "#FFFFFF", // High-contrast text
};

// ── GitRoast Master Default Configuration ─────────────────────
// WHAT: Base configuration merged into all notifications by default.
// WHY: Ensures unified position, border radius, animation, and typography.
const BASE_DEFAULTS = {
  position: "top-center",
  borderRadius: "12px",
  animationDuration: "0.35s",
  animationEasing: "cubic-bezier(0.16, 1, 0.3, 1)",
  backgroundColor: TOAST_COLORS.darkBg,
  textColor: TOAST_COLORS.textLight,
  progressPosition: "bottom",
  progressHeight: "3px",
  pauseOnHover: true,
  showProgressBar: true,
};

// ── Enhanced createToast Wrapper ──────────────────────────────
/**
 * ── WHAT:
 * Enhanced factory wrapper around `customizable-toast-notification`'s `createToast`.
 * Automatically injects GitRoast's dark fire theme defaults (12px radius, obsidian background,
 * cubic-bezier spring animation, type-accented progress bar) while honoring custom overrides.
 *
 * ── WHY:
 * Eliminates repetitive style definitions across components and guarantees that any
 * toast launched in GitRoast adheres to the modern card design system.
 *
 * ── WHERE & WHEN TO USE:
 * Wherever custom, low-level toast configurations or direct `createToast({ ... })` calls are needed.
 *
 * ── USE CASES:
 * Custom notifications with complex multi-action CTAs, custom timeouts, or unique layouts.
 *
 * ── WHEN NOT TO USE:
 * For standard success/error/warning messages, prefer using the concise `toast.success()`,
 * `toast.error()`, etc. methods.
 */
export function createToast(options = {}) {
  const type = options.type || "info";
  const progressColor =
    options.progressColor || TOAST_COLORS[type] || TOAST_COLORS.info;

  const merged = {
    ...BASE_DEFAULTS,
    progressColor,
    ...options,
  };

  return pkgCreateToast(merged);
}

// ── Enhanced toastPromise Wrapper ─────────────────────────────
/**
 * ── WHAT:
 * Wraps `customizable-toast-notification`'s `toastPromise` with GitRoast dark theme defaults.
 * Displays an active loading notification, then smoothly transitions to success or error
 * once the underlying Promise settles, passing the result or error through transparently.
 *
 * ── WHY:
 * Provides seamless async UX for image generation (html2canvas), API dispatches, and
 * checkout verification without requiring manual loading state state-machine juggling.
 *
 * ── WHERE & WHEN TO USE:
 * On asynchronous user-triggered actions: card image downloads, form dispatches, or heavy calculations.
 *
 * ── USE CASES:
 * - `await toastPromise(generateCertificate(), { loading: 'Generating...', success: 'Ready!' })`
 * - `await toastPromise(dispatchContact(data), { loading: 'Sending...', success: 'Dispatched!' })`
 *
 * ── WHEN NOT TO USE:
 * On synchronous actions or operations that already have an explicit inline skeleton UI.
 */
export function toastPromise(promiseOrFn, messages = {}, options = {}) {
  const mergedOptions = {
    ...BASE_DEFAULTS,
    progressColor: TOAST_COLORS.info,
    ...options,
  };

  return pkgToastPromise(promiseOrFn, messages, mergedOptions);
}

// ── Re-exported Lifecycle Primitives ──────────────────────────
export const dismiss = pkgDismiss;
export const setDefaultColors = pkgSetDefaultColors;
export const setDefaultMessages = pkgSetDefaultMessages;

// ── Fluent Toast Helper Suite ─────────────────────────────────
export const toast = {
  /**
   * ── WHAT: Success notification with emerald accent progress bar.
   * ── WHY: Confirms completed tasks (roast ready, link copied, payment confirmed).
   * ── WHERE & WHEN TO USE: After successful mutations, downloads, or navigation.
   * ── USE CASES: Roast generated, battle created, link copied, Pro unlocked.
   * ── WHEN NOT TO USE: For warnings or non-critical info messages.
   */
  success(message, extra = {}) {
    return createToast({
      type: "success",
      message,
      progressColor: TOAST_COLORS.success,
      duration: 3200,
      showProgressBar: true,
      ...extra,
    });
  },

  /**
   * ── WHAT: Error notification with crimson accent and acknowledgement close button.
   * ── WHY: Informs user of failures with sufficient screen time to read and act.
   * ── WHERE & WHEN TO USE: Caught API errors, network disconnects, invalid inputs.
   * ── USE CASES: User not found, rate limit exceeded, payment verification failure.
   * ── WHEN NOT TO USE: For expected non-error validation nudges (use warning).
   */
  error(message, extra = {}) {
    return createToast({
      type: "error",
      message,
      progressColor: TOAST_COLORS.error,
      showCloseButton: true,
      showProgressBar: true,
      duration: 5500,
      ...extra,
    });
  },

  /**
   * ── WHAT: Warning notification with warm gold amber accent.
   * ── WHY: Warns users about non-blocking constraints, rate limits, or required confirmations.
   * ── WHERE & WHEN TO USE: Approaching quota limits, empty search fields, self-battle blocks.
   * ── USE CASES: Rate limit countdown, missing form fields, duplicate reactions.
   * ── WHEN NOT TO USE: For critical application crashes or successful operations.
   */
  warning(message, extra = {}) {
    return createToast({
      type: "warning",
      message,
      progressColor: TOAST_COLORS.warning,
      showProgressBar: true,
      showCloseButton: true,
      duration: 4800,
      ...extra,
    });
  },

  /**
   * ── WHAT: Information notification with signature GitRoast fire-orange accent.
   * ── WHY: Delivers non-urgent system updates, hints, and guidance.
   * ── WHERE & WHEN TO USE: Informational banners, audio speech playback notices, tips.
   * ── USE CASES: Voice roast playing, random battle rivalry selected, audio controls.
   * ── WHEN NOT TO USE: When immediate error resolution or confirmation is required.
   */
  info(message, extra = {}) {
    return createToast({
      type: "info",
      message,
      progressColor: TOAST_COLORS.info,
      duration: 4000,
      showCloseButton: true,
      showProgressBar: true,
      ...extra,
    });
  },

  /**
   * ── WHAT: Signature Fire notification featuring blaze red-orange palette.
   * ── WHY: Brand-defining celebratory toasts for high-impact roast moments.
   * ── WHERE & WHEN TO USE: Roast completion, savage burn generation, daily top burn.
   * ── USE CASES: "🔥 Roast is ready! Turn up the heat."
   * ── WHEN NOT TO USE: For routine system notices or error handling.
   */
  fire(message, extra = {}) {
    return createToast({
      type: "info",
      message,
      progressColor: TOAST_COLORS.fire,
      duration: 4200,
      showCloseButton: true,
      showProgressBar: true,
      ...extra,
    });
  },

  /**
   * ── WHAT: Promise-based toast wrapper forwarding to toastPromise.
   * ── WHY: Exposes fluent API `toast.promise(p, messages, options)`.
   * ── WHERE & WHEN TO USE: In async handlers requiring progress indication.
   * ── USE CASES: Image exports, network requests.
   * ── WHEN NOT TO USE: Synchronous events.
   */
  promise(promiseOrFn, messages = {}, options = {}) {
    return toastPromise(promiseOrFn, messages, options);
  },

  /**
   * ── WHAT: Soft Pro upgrade prompt featuring an interactive CTA button.
   * ── WHY: Low-friction monetization on-ramp when users encounter Pro-gated perks.
   * ── WHERE & WHEN TO USE: Nuclear intensity clicks, private repo roasts, watermark removals.
   * ── USE CASES: Clicking "Nuclear" burn mode as a free tier user.
   * ── WHEN NOT TO USE: If the user is already an authenticated Pro subscriber.
   */
  proNudge(message, onCtaClick, ctaLabel = "See Plans ⚡") {
    return createToast({
      type: "info",
      message,
      progressColor: TOAST_COLORS.info,
      duration: 6500,
      showCloseButton: true,
      showProgressBar: true,
      cta: {
        label: ctaLabel,
        onClick: onCtaClick,
        autoClose: true,
      },
    });
  },

  /**
   * ── WHAT: Specialized Rate Limit warning toast with dynamic countdown and GitHub Login CTA.
   * ── WHY: Transforms an error state into an immediate conversion opportunity.
   * ── WHERE & WHEN TO USE: On HTTP 429 errors from GitHub API or server rate limits.
   * ── USE CASES: Unauthenticated users hitting Render/GitHub IP limits.
   * ── WHEN NOT TO USE: When user is already authenticated with full quota available.
   */
  rateLimit(seconds, onLoginClick) {
    const timeText = seconds ? `${seconds}s` : "a moment";
    return createToast({
      type: "warning",
      message: `⏱ Rate limit active. Wait ${timeText} or log in to unlock 5,000 req/hr quota!`,
      progressColor: TOAST_COLORS.warning,
      duration: 7000,
      showCloseButton: true,
      showProgressBar: true,
      ...(onLoginClick && {
        cta: {
          label: "Login via GitHub ↗",
          onClick: onLoginClick,
          autoClose: true,
        },
      }),
    });
  },

  /**
   * ── WHAT: Specialized clipboard copy notification.
   * ── WHY: Clean, deterministic acknowledgment when copying URLs, text, or badge markdown.
   * ── WHERE & WHEN TO USE: Share buttons, badge generators, challenge links, contact emails.
   * ── USE CASES: Copying roast URL, copying badge markdown to README.
   * ── WHEN NOT TO USE: On failed clipboard operations (use toast.error).
   */
  copy(message = "📋 Copied to clipboard!", extra = {}) {
    return createToast({
      type: "success",
      message,
      progressColor: TOAST_COLORS.success,
      duration: 3000,
      showProgressBar: true,
      ...extra,
    });
  },

  /**
   * ── WHAT: Battle outcome celebratory toast.
   * ── WHY: Accentuates competitive excitement when battle results finish computing.
   * ── WHERE & WHEN TO USE: On initial load of a developer battle page.
   * ── USE CASES: "⚔️ Battle complete! @torvalds is the most roastable!"
   * ── WHEN NOT TO USE: Outside the battle route.
   */
  battleComplete(winner, extra = {}) {
    return createToast({
      type: "success",
      message: winner
        ? `⚔️ Battle complete! @${winner} scored higher on the roast meter!`
        : "⚔️ Battle complete! It's a draw — equally roasted.",
      progressColor: TOAST_COLORS.fire,
      duration: 4500,
      showProgressBar: true,
      ...extra,
    });
  },

  /**
   * ── WHAT: High-priority Pro membership confirmation toast.
   * ── WHY: Celebrates upgrade and reinforces purchased perks with high visibility.
   * ── WHERE & WHEN TO USE: Immediately after Razorpay payment verification succeeds.
   * ── USE CASES: Post-checkout confirmation.
   * ── WHEN NOT TO USE: Before payment verification has verified on the backend.
   */
  paymentSuccess(extra = {}) {
    return createToast({
      type: "success",
      message: "⚡ Welcome to GitRoast Pro! AI roasts unlocked. ☢️ Nuclear mode ready.",
      progressColor: TOAST_COLORS.fire,
      duration: 6500,
      showProgressBar: true,
      ...extra,
    });
  },

  /**
   * ── WHAT: High-stakes payment failure notification.
   * ── WHY: Clarifies financial safety ("No money was deducted") to prevent user panic.
   * ── WHERE & WHEN TO USE: On Razorpay failure, cancellation, or server verification rejection.
   * ── USE CASES: Card decline, network timeout during checkout.
   * ── WHEN NOT TO USE: On successful transactions.
   */
  paymentError(
    message = "Payment failed. No money was deducted. Please try again.",
    extra = {}
  ) {
    return createToast({
      type: "error",
      message,
      progressColor: TOAST_COLORS.error,
      showCloseButton: true,
      showProgressBar: true,
      duration: 8000,
      ...extra,
    });
  },

  /**
   * ── WHAT: Dismisses the most recent active toast notification.
   * ── WHY: Allows callers to programmatic clean up toasts upon modal opens or unmounts.
   */
  dismiss() {
    return pkgDismiss();
  },
};

export default toast;
