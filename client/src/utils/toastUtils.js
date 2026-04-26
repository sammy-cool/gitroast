// ============================================================
// GITROAST — Centralized Toast Utility
// ============================================================
// WHAT: Single source of truth for all toast notifications.
//       Every toast call in the app goes through these helpers.
//
// WHY:  Without centralizing, each component writes its own config:
//       - position varies (some top-center, some bottom-right)
//       - duration varies (some 3000, some undefined)
//       - textColor: "snow" appears in some (overrides brand colors)
//       - showCloseButton missing on errors
//
//       With this file: change once → changes everywhere.
//       Brand colors, font, position, duration — all in one place.
//
// WHERE: Import anywhere in the app:
//        import { toast } from '@/utils/toastUtils'
//        toast.success('Roast ready! 🔥')
//        toast.error('User not found')
//        toast.proNudge('Nuclear mode is Pro', onProClick)
//
// THEME: Matches GitRoast CSS variables exactly:
//   success → #00E676  (--good)     — roast ready, link copied
//   error   → #FF3D3D  (--bad)      — user not found, payment failed
//   warning → #FFB700  (--warn)     — rate limit, daily limit
//   info    → #FF6B00  (--fire-mid) — Pro CTA, heads up
// ============================================================

import { createToast } from "customizable-toast-notification";

// ── Base config ───────────────────────────────────────────────
// WHY: shared defaults — never typed twice anywhere in the app
const BASE = {
  position: "top-center", // WHY: consistent placement — eye always goes to top
  // NOTE: do NOT set textColor here — setDefaultColors in ToastConfig.jsx
  //       already handles brand colors globally for each toast type
  //       adding textColor here would override those brand colors
};

// ── Toast helpers ─────────────────────────────────────────────
export const toast = {
  // ── Success ─────────────────────────────────────────────────
  // WHAT: Positive outcome — roast ready, link copied, payment confirmed
  // WHY showProgressBar: gives time context — user knows toast will auto-dismiss
  // WHY duration 3000: short — success doesn't need long screen time
  success(message, extra = {}) {
    createToast({
      type: "success",
      message,
      position: BASE.position,
      showProgressBar: true,
      duration: 3000,
      ...extra,
    });
  },

  // ── Error ────────────────────────────────────────────────────
  // WHAT: Something failed — user needs to act or retry
  // WHY showCloseButton: errors need user acknowledgement — don't auto-dismiss fast
  // WHY duration 5000: longer — user needs time to read what went wrong
  error(message, extra = {}) {
    createToast({
      type: "error",
      message,
      position: BASE.position,
      showCloseButton: true,
      duration: 5000,
      ...extra,
    });
  },

  // ── Warning ──────────────────────────────────────────────────
  // WHAT: Soft block — rate limit, daily limit, validation nudge
  // WHY showProgressBar + showCloseButton: user might want to dismiss
  //     or wait — give them both options
  warning(message, extra = {}) {
    createToast({
      type: "warning",
      message,
      position: BASE.position,
      showProgressBar: true,
      showCloseButton: true,
      duration: 5000,
      ...extra,
    });
  },

  // ── Info ─────────────────────────────────────────────────────
  // WHAT: Neutral heads-up — not urgent, not an error
  // WHY duration 4000: medium — informational, not action-required
  info(message, extra = {}) {
    createToast({
      type: "info",
      message,
      position: BASE.position,
      duration: 4000,
      showCloseButton: true,
      ...extra,
    });
  },

  // ── Pro nudge (special: info + CTA button) ────────────────────
  // WHAT: Soft upgrade prompt — shown when user hits a Pro-gated feature
  // WHY CTA: non-blocking upgrade path — toast shows benefit + one-click to modal
  // WHY autoClose: when user clicks CTA, toast should dismiss automatically
  // WHY duration 6000: longer — user needs time to read the benefit before deciding
  proNudge(message, onCtaClick, ctaLabel = "See Plans ⚡") {
    createToast({
      type: "info",
      message,
      position: BASE.position,
      duration: 6000,
      showCloseButton: true,
      showProgressBar: true,
      cta: {
        label: ctaLabel,
        onClick: onCtaClick,
        autoClose: true, // WHY: modal opens → toast closes → no overlap
      },
    });
  },

  // ── Battle complete ───────────────────────────────────────────
  // WHAT: Shown when battle result is ready — celebratory moment
  // WHY: Slightly longer duration — battle is a bigger event
  battleComplete(winner) {
    createToast({
      type: "success",
      message: winner
        ? `⚔️ Battle complete! @${winner} is the most roastable!`
        : "⚔️ Battle complete! It's a draw — equally shameful.",
      position: BASE.position,
      showProgressBar: true,
      duration: 4500,
    });
  },

  // ── Payment success ───────────────────────────────────────────
  // WHAT: Pro upgrade confirmed
  // WHY longer duration: this is the most important success moment in the app
  paymentSuccess() {
    createToast({
      type: "success",
      message: "⚡ You are now Pro! AI roasts unlocked. ☢️ Nuclear ready.",
      position: BASE.position,
      showProgressBar: true,
      duration: 6000,
    });
  },

  // ── Payment error ─────────────────────────────────────────────
  // WHAT: Payment failed — user may have lost money — handle with care
  // WHY duration 8000: payment errors are high-stakes — user needs more time
  paymentError(message = "Payment failed. No money was deducted. Try again.") {
    createToast({
      type: "error",
      message,
      position: BASE.position,
      showCloseButton: true,
      duration: 8000,
    });
  },
};
