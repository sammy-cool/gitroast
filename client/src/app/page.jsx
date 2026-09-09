"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createToast } from "customizable-toast-notification";
import UsernameInput from "@/components/UsernameInput";
import ProModal from "@/components/ProModal";
import GitHubLoginBtn from "@/components/GitHubLoginBtn";
import RateLimitBanner from "@/components/RateLimitBanner";
import LiveRoastFeed from "@/components/LiveRoastFeed";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const INTENSITIES = [
  {
    key: "mild",
    emoji: "🌶",
    label: "Mild",
    description: "Gentle observations. Still burns.",
    color: "#FFB700",
    isPro: false,
  },
  {
    key: "savage",
    emoji: "🔥",
    label: "Savage",
    description: "Brutal comedy. The default.",
    color: "#FF6B00",
    isPro: false,
  },
  {
    key: "nuclear",
    emoji: "☢️",
    label: "Nuclear",
    description: "Absolutely no mercy.",
    color: "#FF3D3D",
    isPro: true,
  },
];

export default function HomePage() {
  const [showProModal, setShowProModal] = useState(false);
  const [totalRoasts, setTotalRoasts] = useState(null);
  const [intensity, setIntensity] = useState("savage");
  const [rateLimitSecs, setRateLimitSecs] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`${API_BASE}/api/roast/stats`)
      .then((r) => r.json())
      .then((d) => {
        if (d.totalRoasts > 0) setTotalRoasts(d.totalRoasts);
      })
      .catch(() => { });

    const saved = sessionStorage.getItem("gitroast_intensity");
    if (saved && INTENSITIES.find((i) => i.key === saved)) {
      setIntensity(saved);
    }

    const rl = sessionStorage.getItem("gitroast_rate_limit");
    if (rl) {
      const { retryAfter, setAt } = JSON.parse(rl);
      const elapsed = Math.floor((Date.now() - setAt) / 1000);
      const remaining = retryAfter - elapsed;
      if (remaining > 0) {
        setRateLimitSecs(remaining);
      } else {
        sessionStorage.removeItem("gitroast_rate_limit");
      }
    }
  }, []);

  function handleIntensitySelect(key) {
    const selected = INTENSITIES.find((i) => i.key === key);
    if (selected.isPro) {
      createToast({
        type: "info",
        message: "☢️ Nuclear mode is a Pro feature.",
        position: "top-center",
        duration: 5000,
        showCloseButton: true,
        showProgressBar: true,
        cta: {
          label: "See Plans ⚡",
          onClick: () => setShowProModal(true),
          autoClose: true,
        },
      });
      return;
    }
    setIntensity(key);
    sessionStorage.setItem("gitroast_intensity", key);
  }

  function handleRoast(username) {
    if (rateLimitSecs && rateLimitSecs > 0) {
      createToast({
        type: "warning",
        message: `⏱ Rate limited. Wait ${rateLimitSecs} more seconds.`,
        position: "top-center",
      });
      return;
    }

    if (!username.trim()) {
      createToast({
        type: "warning",
        message: "Enter a GitHub username first!",
        position: "top-center",
        showProgressBar: true,
      });
      return;
    }

    sessionStorage.setItem("gitroast_intensity", intensity);
    router.push(`/roast/${username.trim().toLowerCase()}`);
  }

  const selectedIntensity = INTENSITIES.find((i) => i.key === intensity);

  return (
    <main className="landing-page">
      <div className="landing-glow animate-glow" />

      <nav className="landing-nav">
        <GitHubLoginBtn variant="compact" />
      </nav>

      <div className="landing-logo">
        <h1 className="font-display text-fire">GITROAST 🔥</h1>
        <p className="landing-tagline">
          Get your GitHub{" "}
          <span style={{ color: "var(--fire)" }}>brutally roasted.</span> Share
          the pain.
        </p>
      </div>

      {/* Intensity selector */}
      <div className="intensity-wrap">
        <p className="intensity-label font-mono">Choose your intensity:</p>
        <div className="intensity-options">
          {INTENSITIES.map((opt) => (
            <button
              key={opt.key}
              className={`intensity-btn font-mono ${intensity === opt.key ? "intensity-btn--active" : ""} ${opt.isPro ? "intensity-btn--pro" : ""}`}
              style={{
                "--intensity-color": opt.color,
                borderColor: intensity === opt.key ? opt.color : undefined,
              }}
              onClick={() => handleIntensitySelect(opt.key)}
              title={opt.isPro ? `${opt.label} — Pro only` : opt.description}
            >
              <span className="intensity-emoji">{opt.emoji}</span>
              <span className="intensity-name">{opt.label}</span>
              {opt.isPro && <span className="intensity-pro-tag">PRO</span>}
            </button>
          ))}
        </div>
        <p className="intensity-desc font-mono">
          {selectedIntensity.emoji} {selectedIntensity.description}
        </p>
      </div>

      <UsernameInput onSubmit={handleRoast} />

      {/* Rate limit banner */}
      {rateLimitSecs && (
        <RateLimitBanner
          seconds={rateLimitSecs}
          onExpired={() => {
            setRateLimitSecs(null);
            sessionStorage.removeItem("gitroast_rate_limit");
          }}
        />
      )}

      {/* Live roast feed — WHY here: right below input
          user just tried to roast → sees others getting roasted
          FOMO kicks in → more engagement */}
      <LiveRoastFeed />

      {/* Social proof count */}
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

      <button
        className="btn btn-ghost"
        onClick={() => router.push("/leaderboard")}
      >
        🏆 Wall of Shame
      </button>

      <button className="btn btn-ghost" onClick={() => router.push("/battle")}>
        ⚔️ Roast Battle
      </button>

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
          padding: 1rem 1rem 6rem;
          position: relative;
          overflow: hidden;
          gap: 1.25rem;
        }
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
        .intensity-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          width: 100%;
          max-width: 460px;
        }
        .intensity-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--text-muted);
        }
        .intensity-options {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .intensity-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
        }
        .intensity-btn:hover {
          border-color: var(--intensity-color, var(--fire));
          background: var(--bg-elevated);
        }
        .intensity-btn--active {
          border-color: var(--intensity-color, var(--fire));
          background: color-mix(
            in srgb,
            var(--intensity-color, var(--fire)) 8%,
            var(--bg-card)
          );
          box-shadow: 0 0 12px
            color-mix(
              in srgb,
              var(--intensity-color, var(--fire)) 20%,
              transparent
            );
        }
        .intensity-emoji {
          font-size: 20px;
          line-height: 1;
        }
        .intensity-name {
          font-size: 11px;
          color: var(--text-primary);
        }
        .intensity-pro-tag {
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 8px;
          padding: 1px 5px;
          background: var(--fire);
          color: #fff;
          border-radius: var(--radius-sm);
          letter-spacing: 1px;
        }
        .intensity-desc {
          font-size: 12px;
          color: var(--text-secondary);
          height: 18px;
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
