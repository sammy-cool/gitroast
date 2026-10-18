// GitRoast toast facade on top of the published package `customizable-toast-notification`.
// Same call shape as before: toast.success(msg, extra). Extra: { title, description, action:{label,onClick,autoClose},
// duration, ... }. Legacy `cta` still works. Design rules live in ./toastOptions.js.
import {
  createToast as pkgCreateToast,
  toastPromise as pkgToastPromise,
  dismiss as pkgDismiss,
} from "customizable-toast-notification";
import { buildToastOptions, cleanCopy, hoursUntil, DURATIONS } from "./toastOptions";

export const TOAST_COLORS = {
  success: "#1F6B3D", error: "#B3261E", warning: "#8A5A00", info: "#1F5F86", fire: "#E84E2A", darkBg: "#171711", textLight: "#FFFFFF",
};

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function show(type, message, extra = {}) {
  const { message: _ignored, ...rest } = extra;
  const { options } = buildToastOptions({ ...rest, type, title: rest.title ?? message }, { reducedMotion: reduced() });
  try {
    return pkgCreateToast(options);
  } catch {
    return null; // a toast must never break the app
  }
}

export function createToast(options = {}) {
  const { type = "info", message, ...rest } = options;
  return show(type === "fire" ? "ember" : type, message, rest);
}

export function toastPromise(promiseOrFn, messages = {}, options = {}) {
  const { options: base } = buildToastOptions({ type: "info", title: "x" }, { reducedMotion: reduced() });
  const { message: _m, type: _t, duration: _d, showLoader: _s, cta: _c, ...shared } = base;
  return pkgToastPromise(
    promiseOrFn,
    {
      loading: cleanCopy(messages.loading) || "Working on it…",
      success: typeof messages.success === "function" ? (v) => cleanCopy(messages.success(v)) : cleanCopy(messages.success) || "Done",
      error: typeof messages.error === "function" ? (e) => cleanCopy(messages.error(e)) : cleanCopy(messages.error) || "Something went wrong",
    },
    { ...shared, allowHtml: false, ...options },
  );
}

export const dismiss = () => pkgDismiss();
export { setDefaultColors, setDefaultMessages } from "customizable-toast-notification";

export const toast = {
  success: (m, e) => show("success", m, e),
  error: (m, e) => show("error", m, e),
  warning: (m, e) => show("warning", m, e),
  info: (m, e) => show("info", m, e),
  fire: (m, e) => show("ember", m, e),
  promise: (p, messages, options) => toastPromise(p, messages, options),
  dismiss,

  proNudge(message, onCtaClick, ctaLabel = "See plans") {
    return show("ember", message, { action: { label: cleanCopy(ctaLabel).replace(/\s*⚡$/, ""), onClick: onCtaClick } });
  },
  rateLimit(seconds, onLoginClick) {
    return show("warning", "Slow down a moment", {
      description: `Wait ${seconds ? `${seconds}s` : "a moment"} or sign in for a higher request quota.`,
      ...(onLoginClick && { action: { label: "Sign in", onClick: onLoginClick } }),
    });
  },
  copy(message, extra = {}) {
    return show("success", message || "Copied", { description: message ? "" : "It is on your clipboard.", ...extra });
  },
  battleComplete(winner, extra = {}) {
    return show("ember", "Battle complete", { description: winner ? `${winner} wins on the public evidence.` : "It is a draw — equally roasted.", ...extra });
  },
  paymentSuccess(extra = {}) {
    return show("success", "Payment confirmed", { description: "Your plan is active. Pro features are unlocked.", ...extra });
  },
  paymentError(message = "Payment failed. No money was deducted. Please try again.", extra = {}) {
    return show("error", "Payment failed", { description: cleanCopy(message), ...extra });
  },
};

// ── Message catalog: "Fifteen moments, one voice." ──
export const notify = {
  roastReady: ({ username, score, line = "The tiny commits survived.", onAction } = {}) => show("success", "Roast ready", { description: `${username} scored ${score}. ${line}`, action: { label: "View", onClick: onAction } }),
  copied: ({ what = "README badge Markdown" } = {}) => show("success", "Copied", { description: `${what} is on your clipboard.` }),
  githubBlinked: ({ onAction } = {}) => show("error", "GitHub blinked", { description: "We could not read this repository. Nothing was charged.", action: { label: "Retry", onClick: onAction } }),
  battleComplete: ({ winner, score = "3–2", onAction } = {}) => show("ember", "Battle complete", { description: `${winner} wins ${score} on balanced evidence.`, action: { label: "Rematch", onClick: onAction } }),
  profileNotFound: ({ onAction } = {}) => show("warning", "Public profile not found", { description: "Check the handle or try a repository URL.", action: { label: "Edit", onClick: onAction } }),
  paymentConfirmed: ({ plan = "Pro Roaster", until, onAction } = {}) => show("success", "Payment confirmed", { description: until ? `${plan} is active through ${until}.` : `${plan} is active.`, action: { label: "Manage", onClick: onAction } }),
  universeRendering: () => show("info", "Universe still rendering", { description: "You can keep browsing while the planets assemble." }),
  installApp: ({ onAction } = {}) => show("info", "Install GitRoast", { description: "Save results and reopen faster from your home screen.", action: { label: "Install", onClick: onAction } }),
  sharePain: ({ onAction } = {}) => show("ember", "Share the pain", { description: "Your result card is ready for civilized group chats.", action: { label: "Share", onClick: onAction } }),
  ghostModeOn: ({ onAction } = {}) => show("success", "Ghost Mode is on", { description: "You are hidden from discovery and public battles.", action: { label: "Review", onClick: onAction } }),
  reading: ({ commits, next = "Documentation", onAction } = {}) => show("loading", "Reading the receipts…", { description: commits ? `${commits} commits analyzed. ${next} is next.` : "Commits in, conclusions shortly.", action: { label: "Cancel", onClick: onAction } }),
  signedIn: () => show("success", "Signed in", { description: "Welcome back. Your history is synced." }),
  dailyLimit: ({ resetsAt, resetsIn, onAction } = {}) => show("warning", "You hit today's limit", { description: `Free roasts reset in ${resetsIn || hoursUntil(resetsAt)}.`, action: { label: "See plans", onClick: onAction } }),
  sessionExpired: ({ what = "this shortlist", onAction } = {}) => show("error", "Session expired", { description: `Sign in again to save ${what}.`, action: { label: "Sign in", onClick: onAction } }),
  aiQuotaUsed: ({ resetsAt, onAction } = {}) => {
    const when = resetsAt ? new Date(resetsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "next period";
    return show("warning", "AI roasts used up", { description: `Rules-engine roasts continue. AI roasts reset ${when}.`, action: { label: "See plans", onClick: onAction } });
  },
  offline: () => show("warning", "You are offline", { description: "Saved results stay readable. Fresh analysis waits for a connection." }),
  backOnline: () => show("success", "Back online", { description: "Fresh analysis is available again." }),
  keepHistory: ({ onAction } = {}) => show("ember", "Keep the whole history", { description: "Pro Roaster adds trends, personas and Ghost Mode.", action: { label: "Learn more", onClick: onAction } }),
};

export { DURATIONS };
export default toast;
