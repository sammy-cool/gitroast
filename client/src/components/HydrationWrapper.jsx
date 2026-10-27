"use client";


import { useEffect, useState } from "react";
import { FlameMark } from "@/components/Logo";

export default function HydrationWrapper({ children }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    document.body.classList.add("loading");

    const timer = setTimeout(() => {
      setHydrated(true);
      document.body.classList.remove("loading");
    }, 0);

    return () => {
      clearTimeout(timer);
      document.body.classList.remove("loading");
    };
  }, []);

  if (!hydrated) {
    return (
      <div className="loading-page" role="status" aria-live="polite">
        <div className="loading-glow" />

        <FlameMark size={48} />
        <p className="loading-logo">GitRoast</p>

        <div className="loading-card">
          <p
            className="font-mono loading-text"
            style={{ color: "var(--ink-2)", fontSize: "13px" }}
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
    );
  }

  return <>{children}</>;
}

