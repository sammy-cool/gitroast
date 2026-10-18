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
