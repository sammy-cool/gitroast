"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createToast } from "customizable-toast-notification";
import UsernameInput from "@/components/UsernameInput";
import ProModal from "@/components/ProModal";
import GitHubLoginBtn from "@/components/GitHubLoginBtn";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function HomePage() {
  const [showProModal, setShowProModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [totalRoasts, setTotalRoasts] = useState(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    // WHY: fetch real roast count for social proof
    //      fake number = kills trust
    //      real number = authentic even if small
    fetch(`${API_BASE}/api/roast/stats`)
      .then((r) => r.json())
      .then((d) => {
        if (d.totalRoasts > 0) setTotalRoasts(d.totalRoasts);
      })
      .catch((err) => {
        // WHY: stats failing silently is fine
        //      social proof just stays hidden
      });
  }, []);

  function handleRoast(username) {
    if (!username.trim()) {
      createToast({
        type: "warning",
        message: "Enter a GitHub username first!",
        position: "top-center",
        showProgressBar: true,
      });
      return;
    }
    router.push(`/roast/${username.trim().toLowerCase()}`);
  }

  if (!mounted) return null;

  return (
    <main className="landing-page animate-fadeIn">
      {/* Ambient glow */}
      <div className="landing-glow animate-glow" />

      {/* WHY nav: GitHub login accessible from landing
          reduces friction for Pro conversion */}
      <nav className="landing-nav">
        <div />
        {/* WHY compact: nav should not dominate the landing page */}
        <GitHubLoginBtn variant="compact" />
      </nav>

      {/* Logo */}
      <div className="landing-logo">
        <h1 className="font-display text-fire">GITROAST 🔥</h1>
        <p className="landing-tagline">
          Get your GitHub{" "}
          <span style={{ color: "var(--fire)" }}>brutally roasted.</span> Share
          the pain.
        </p>
      </div>

      {/* Input */}
      <UsernameInput onSubmit={handleRoast} />

      {/* WHY real count: social proof must be real
          show only if count > 0, hide otherwise */}
      {totalRoasts && (
        <p className="landing-social-proof font-mono">
          <span style={{ color: "var(--fire)" }}>
            {totalRoasts.toLocaleString()}
          </span>{" "}
          devs roasted and counting
        </p>
      )}

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          className="btn btn-outline"
          onClick={() => router.push("/pricing")}
        >
          ⚡ Pricing
        </button>
        <button className="btn btn-ghost" onClick={() => setShowProModal(true)}>
          What&apos;s in Pro?
        </button>
      </div>

      {/* Leaderboard link */}
      <button
        className="btn btn-ghost"
        onClick={() => router.push("/leaderboard")}
      >
        🏆 Wall of Shame
      </button>

      {/* Sample roast */}
      <div className="sample-roast card">
        <p className="sample-roast-label font-mono">SAMPLE ROAST</p>
        <p className="sample-roast-text">
          &ldquo;This is not a developer portfolio. It is a detailed public
          record of every time enthusiasm lasted one weekend.&rdquo;
        </p>
      </div>

      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1rem 1rem 6rem; /* WHY 6rem bottom: footer space */
          position: relative;
          overflow: hidden;
          gap: 1.5rem;
        }
        /* WHY absolute nav: doesn't affect centering of content */
        .landing-nav {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
        }
        .landing-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 80% 40% at 50% 100%,
            rgba(255, 69, 0, 0.2) 0%,
            transparent 100%
          );
          pointer-events: none;
        }
        .landing-logo {
          text-align: center;
        }
        .landing-logo h1 {
          font-size: clamp(56px, 14vw, 96px);
          letter-spacing: 4px;
          line-height: 1;
          user-select: none;
        }
        .landing-tagline {
          color: var(--text-secondary);
          font-size: 17px;
          margin-top: 10px;
        }
        .landing-social-proof {
          color: var(--text-secondary);
          font-size: 13px;
        }
        .sample-roast {
          width: 100%;
          max-width: 460px;
          padding: 1.1rem 1.25rem;
          border-left: 3px solid var(--fire);
          border-radius: var(--radius-md);
        }
        .sample-roast-label {
          color: var(--text-muted);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        .sample-roast-text {
          color: var(--text-muted);
          font-size: 13px;
          font-style: italic;
          line-height: 1.7;
        }
      `}</style>
    </main>
  );
}
