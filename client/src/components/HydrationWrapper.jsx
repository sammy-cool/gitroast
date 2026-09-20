// ============================================================
// GITROAST — Hydration Wrapper
// ============================================================
// WHAT: Light-touch wrapper that passes through children for full SSR.
// WHY: Returning a full-page loading placeholder during SSR destroys
//      FCP and LCP (measured at 4.8s in audit) and hides content from
//      search crawlers. Next.js handles route loading transitions via
//      app/loading.jsx instead.
// ============================================================

export default function HydrationWrapper({ children }) {
  return <>{children}</>;
}
