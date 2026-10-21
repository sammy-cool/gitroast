// Pure mapping: GitRoast toast spec → customizable-toast-notification options.
// No package import here so it is unit-testable with `node --test`.
//
// Spec (design "Notification system"): top-center, ≤420px wide, info/success 5s, warning 7s,
// errors / actionable / loading persist until dismissed, one optional verb action, close control,
// timed progress rail, reduced motion = ≤100ms.

export const DURATIONS = { success: 5000, info: 5000, ember: 5000, warning: 7000 };
export const PERSIST_MS = 10 * 60 * 1000; // "until dismissed" (package takes a number)

export const TYPE_STYLE = {
  success: { pkgType: "success", bg: "#CFE6D6", fg: "#171711", rail: "#1F6B3D" },
  error: { pkgType: "error", bg: "#F8DAD8", fg: "#171711", rail: "#B3261E" },
  warning: { pkgType: "warning", bg: "#F8E9C8", fg: "#171711", rail: "#8A5A00" },
  info: { pkgType: "info", bg: "#DDE8F0", fg: "#171711", rail: "#1F5F86" },
  ember: { pkgType: "info", bg: "#FBE0D6", fg: "#171711", rail: "#E84E2A" },
  loading: { pkgType: "info", bg: "#FFFDF8", fg: "#171711", rail: "#171711" },
};

// Status icons from the design (Lucide-style line icons, 1.75 stroke), coloured per type.
// Passed to the package's `icon` option as an SVG string (package >= 3.17).
const ICON_PATHS = {
  success: "M8 12.5l2.7 2.7L16.5 9.5M12 21a9 9 0 100-18 9 9 0 000 18z",
  error: "M9 9l6 6m0-6l-6 6M12 21a9 9 0 100-18 9 9 0 000 18z",
  warning: "M12 9v4m0 3.5h.01M10.3 4.2L2.8 17.5A2 2 0 004.5 20.5h15a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z",
  info: "M12 11v5m0-8.5h.01M12 21a9 9 0 100-18 9 9 0 000 18z",
  ember: "M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-1.7.8-3 1.7-4 .2 1.2.9 2 1.8 2.2C10.2 8.2 10.5 5.6 12 3z",
};

export function iconFor(type) {
  const d = ICON_PATHS[type];
  if (!d) return false; // loading → the package's spinner (showLoader) is the icon
  const color = (TYPE_STYLE[type] || TYPE_STYLE.info).rail;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
}

// Global package config derived from the design spec: max 3 visible on desktop / 2 on mobile,
// queue ≤ 5, top-center, pause on hover/focus, reduced motion respected, no audio.
export function globalConfig({ mobile = false } = {}) {
  return {
    maxVisible: mobile ? 2 : 3,
    maxQueueSize: 5,
    defaultPosition: "top-center",
    reducedMotion: "auto",
    pauseOnHover: true,
    sound: false,
    showProgress: true,
  };
}

export const escapeHtml = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Strip decorative leading emoji from legacy copy so the voice stays calm.
export const cleanCopy = (s) =>
  typeof s === "string" ? s.replace(/^[\p{Extended_Pictographic}\uFE0F\u200d\u2713\s]+/u, "").trim() : s;

// "6 hours", "under an hour" — for reset notices. Falls back gracefully on bad input.
export function hoursUntil(iso, now = Date.now()) {
  const ms = iso ? new Date(iso).getTime() - now : NaN;
  if (!Number.isFinite(ms) || ms <= 0) return "a few hours";
  const h = Math.ceil(ms / 36e5);
  return h <= 1 ? "under an hour" : `${h} hours`;
}

export function resolveDuration({ type, duration, hasAction }) {
  if (duration === null || duration === Infinity) return PERSIST_MS;
  if (typeof duration === "number") return duration;
  if (type === "error" || type === "loading" || hasAction) return PERSIST_MS;
  return DURATIONS[type] ?? DURATIONS.info;
}

// Two-line message (title + one-line consequence). Escaped, then sanitised again by the package.
export const messageHtml = (title, description) =>
  description
    ? `<strong>${escapeHtml(title)}</strong><br><small>${escapeHtml(description)}</small>`
    : `<strong>${escapeHtml(title)}</strong>`;

export function buildToastOptions(spec = {}, { reducedMotion = false } = {}) {
  const type = TYPE_STYLE[spec.type] ? spec.type : "info";
  const style = TYPE_STYLE[type];
  const title = cleanCopy(spec.title ?? spec.message ?? "");
  const description = spec.description ? String(spec.description) : "";
  const action = spec.action || spec.cta || null;
  const duration = resolveDuration({ type, duration: spec.duration, hasAction: Boolean(action?.label) });

  const opts = {
    type: style.pkgType,
    message: messageHtml(title, description),
    allowHtml: true,
    duration,
    position: "top-center",
    maxWidth: "420px",
    borderRadius: "10px",
    backgroundColor: style.bg,
    textColor: style.fg,
    progressColor: style.rail,
    progressHeight: "3px",
    progressPosition: "bottom",
    showProgressBar: duration !== PERSIST_MS,
    showCloseButton: true,
    swipeToDismiss: true,
    pauseOnHover: true,
    showLoader: type === "loading",
    icon: iconFor(type),
    animationDuration: reducedMotion ? "0.1s" : "0.22s",
    animationEasing: reducedMotion ? "linear" : "cubic-bezier(0.16, 1, 0.3, 1)",
    className: `gr-toast gr-toast--${type}`,
    fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
    fontSize: "14px",
  };

  if (action?.label) {
    opts.cta = {
      label: String(action.label),
      ariaLabel: action.ariaLabel || `${action.label}: ${title}`,
      autoClose: action.autoClose !== false,
      ...(action.href ? { href: action.href, variant: "link", target: action.target } : {}),
      ...(typeof action.onClick === "function" ? { onClick: action.onClick } : {}),
    };
  }
  return { options: opts, title, type };
}
