"use client";

// ============================================================
// GITROAST — Hydration Wrapper & App Loader
// ============================================================
// WHAT: Provides a branded initial hydration experience with smooth
//       fade-out transition.
// WHY:
//   - Brand consistency: Displays the fiery GitRoast loader on initial load.
//   - SEO & Performance: Renders children in the DOM underneath so search
//     engine bots (Googlebot, Bing) and OpenGraph crawlers receive full SSR markup.
//   - Smooth transition: Avoids jarring layout shifts by smoothly fading out
//     the loader overlay once the client hydrates.
// ============================================================

import { useEffect, useState } from "react";

export default function HydrationWrapper({ children }) {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Keep scroll locked while initial loader is active
    document.body.classList.add("loading");

    // Allow branded loader animation to display cleanly before fading
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 400);

    const finishTimer = setTimeout(() => {
      setMounted(true);
      document.body.classList.remove("loading");
    }, 700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
      document.body.classList.remove("loading");
    };
  }, []);

  return (
    <>
      {!mounted && (
        <div
          className={`hydration-overlay ${fading ? "hydration-overlay--fade" : ""}`}
          aria-hidden="true"
        >
          <div className="loading-page">
            <div className="loading-glow" />

            <p className="font-display loading-logo gitroast-loader-text-fire">
              GITROAST 🔥
            </p>

            <div className="loading-card">
              <p
                className="font-mono loading-text"
                style={{ color: "var(--text-secondary)", fontSize: "13px" }}
              >
                Loading
                <span className="loading-dot">.</span>
                <span className="loading-dot">.</span>
                <span className="loading-dot">.</span>
              </p>

              <div className="loading-track">
                <div className="loading-fill" />
              </div>
            </div>
          </div>
        </div>
      )}

      {children}

      <style jsx>{`
        .hydration-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: #070707;
          opacity: 1;
          transition: opacity 0.3s ease-out;
          pointer-events: all;
        }
        .hydration-overlay--fade {
          opacity: 0;
          pointer-events: none;
        }
      `}</style>
    </>
  );
}
