// ============================================================
// GITROAST — Master Toast API Export Alias
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Canonical developer-friendly export module for GitRoast toast notifications.
// Re-exports all primitives (`toast`, `createToast`, `toastPromise`, `dismiss`,
// `setDefaultColors`, `setDefaultMessages`, `TOAST_COLORS`) from `toastUtils.js`.
//
// ── WHY: ─────────────────────────────────────────────────────
// Provides a clean, standardized import path `@/utils/toast` alongside
// `@/utils/toastUtils` for optimal DX across all pages and components.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// Import in any frontend React component or utility:
//   import { toast, createToast, toastPromise } from '@/utils/toast'
//
// ── USE CASES: ───────────────────────────────────────────────
// Any UI action needing visual notification feedback.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// Do not call in server-side Next.js components or API routes.
// ============================================================

export {
  toast,
  createToast,
  toastPromise,
  dismiss,
  setDefaultColors,
  setDefaultMessages,
  TOAST_COLORS,
  default,
} from "./toastUtils";
