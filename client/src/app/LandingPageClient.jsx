"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UsernameInput from "@/components/UsernameInput";
import { toast } from "@/utils/toast";
import dynamic from 'next/dynamic';
const ProModal = dynamic(() => import('@/components/ProModal'), { ssr: false });
import GitHubLoginBtn from "@/components/GitHubLoginBtn";
import RateLimitBanner from "@/components/RateLimitBanner";
import LiveRoastFeed from "@/components/LiveRoastFeed";
import { useAuth } from "@/context/AuthContext";
import {
  getRoastStats,
  checkHealth,
  getRoastOfTheDay,
} from "@/services/roastService";

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

export default function LandingPageClient() {
  const { user, loginWithGitHub, loading: authLoading } = useAuth();
  const [showProModal, setShowProModal] = useState(false);
  const [totalRoasts, setTotalRoasts] = useState(null);
  const [dailyRoast, setDailyRoast] = useState(null);
  const [broadcastDismissed, setBroadcastDismissed] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking"); // "checking" | "online" | "offline"
  const [intensity, setIntensity] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("gitroast_intensity");
      if (saved && INTENSITIES.find((i) => i.key === saved)) {
        return saved;
      }
    }
    return "savage";
  });

  const [rateLimitSecs, setRateLimitSecs] = useState(() => {
    if (typeof window !== "undefined") {
      const rl = sessionStorage.getItem("gitroast_rate_limit");
      if (rl) {
        try {
          const { retryAfter, setAt } = JSON.parse(rl);
          const elapsed = Math.floor((Date.now() - setAt) / 1000);
          const remaining = retryAfter - elapsed;
          if (remaining > 0) return remaining;
          sessionStorage.removeItem("gitroast_rate_limit");
        } catch {
          sessionStorage.removeItem("gitroast_rate_limit");
        }
      }
    }
    return null;
  });
  const router = useRouter();

  // WHY health poll: powers the glowing status indicator dot
  //     Checks immediately on mount, then every 30s
  //     Aligned with LiveRoastFeed polling interval for efficiency
  useEffect(() => {
    async function initHealth() {
      const ok = await checkHealth();
      setServerStatus(ok ? 'online' : 'offline');
    }
    initHealth();
    const interval = setInterval(initHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // WHY broadcast toast: alert unauthenticated visitors to log in for dedicated 5,000 req/hr rate limits
  // WHY !authLoading guard: AuthContext initializes user=null while checking token.
  //     Without checking !authLoading, logged-in users falsely receive the login prompt on initial mount.
  useEffect(() => {
    if (authLoading) return;
    if (
      !user &&
      typeof window !== "undefined" &&
      !sessionStorage.getItem("gitroast_login_broadcast")
    ) {
      toast.info("⚡ Please log in with GitHub to avoid public API rate limit throttling!", {
        duration: 8000,
        cta: {
          label: "Login ↗",
          onClick: loginWithGitHub,
          autoClose: true,
        },
      });
      sessionStorage.setItem("gitroast_login_broadcast", "1");
    }
  }, [authLoading, user, loginWithGitHub]);

  useEffect(() => {
    getRoastStats().then((total) => {
      if (total > 0) setTotalRoasts(total);
    });
    getRoastOfTheDay().then((roast) => {
      if (roast) setDailyRoast(roast);
    });
  }, []);

  function handleIntensitySelect(key) {
    const selected = INTENSITIES.find((i) => i.key === key);
    if (selected.isPro && !user?.isPro) {
      toast.proNudge("☢️ Nuclear mode is a Pro feature.", () => setShowProModal(true), "See Plans ⚡");
      return;
    }
    setIntensity(key);
    sessionStorage.setItem("gitroast_intensity", key);
  }

  function handleRoast(target) {
    if (rateLimitSecs && rateLimitSecs > 0) {
      toast.rateLimit(rateLimitSecs, loginWithGitHub);
      return;
    }

    const cleanTarget = (target || "").trim().toLowerCase();
    if (!cleanTarget) {
      toast.warning("Enter a GitHub username or repo first!");
      return;
    }

    sessionStorage.setItem("gitroast_intensity", intensity);
    if (cleanTarget.includes("/")) {
      router.push(`/repo/${cleanTarget}`);
    } else {
      router.push(`/roast/${cleanTarget}`);
    }
  }

  const selectedIntensity = INTENSITIES.find((i) => i.key === intensity);

  return (
    <main className="landing-page">
      <div className="landing-glow animate-glow" />

      {/* ── Top Nav: in normal flow to prevent mobile collision ── */}
      <nav className="landing-nav" aria-label="Main Navigation">
        <div className="landing-nav-left">
          <div
            className={`status-dot status-dot--${serverStatus}`}
            title={`Backend: ${serverStatus}`}
          />
          <span className="status-label font-mono">
            {serverStatus === "online"
              ? "Systems Online"
              : serverStatus === "offline"
                ? "Connecting…"
                : "Checking…"}
          </span>
        </div>
        <GitHubLoginBtn variant="compact" />
      </nav>

      {/* ── Broadcast Notice: sleek, non-intrusive alert pill ── */}
      {!authLoading && !user && !broadcastDismissed && (
        <div className="broadcast-banner font-mono" role="status">
          <div className="broadcast-left">
            <span className="broadcast-pill">NOTICE ⚡</span>
            <p className="broadcast-text">
              Public API is rate-limited.{" "}
              <button
                type="button"
                className="broadcast-login-link"
                onClick={loginWithGitHub}
              >
                Sign in with GitHub
              </button>{" "}
              for dedicated 5,000 req/hr!
            </p>
          </div>
          <button
            type="button"
            className="broadcast-close-btn"
            onClick={() => setBroadcastDismissed(true)}
            aria-label="Dismiss banner"
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Brand Logo Header ── */}
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
              type="button"
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
              {opt.isPro && (
                <span className={`intensity-pro-tag ${user?.isPro ? "intensity-pro-tag--unlocked" : ""}`}>
                  {user?.isPro ? "PRO ✓" : "PRO"}
                </span>
              )}
            </button>
          ))}
        </div>
        <p className="intensity-desc font-mono">
          {selectedIntensity.emoji} {selectedIntensity.description}
        </p>
      </div>

      {/* Live roast feed — placed right above the username input */}
      <LiveRoastFeed />

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
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/pricing" className="btn btn-outline">
          ⚡ Pricing
        </Link>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setShowProModal(true)}
        >
          What&apos;s in Pro?
        </button>
      </div>

      <Link href="/leaderboard" className="btn btn-ghost">
        🏆 Wall of Shame
      </Link>

      <Link href="/battle" className="btn btn-ghost">
        ⚔️ Roast Battle
      </Link>

      {/* ── Community Roast of the Day ── */}
      <div className="sample-roast card">
        <div className="daily-header">
          <p className="sample-roast-label font-mono">🔥 ROAST OF THE DAY</p>
          {dailyRoast && (
            // ── Comprehensive Burn Counter ───────────────────────────
            // ── WHAT: ────────────────────────────────────────────────
            // Aggregates total community engagements across all three supported
            // reaction types: savage (🔥), destroyed (💀), and relatable (😂).
            //
            // ── WHY: ─────────────────────────────────────────────────
            // Previously omitted 'relatable', artificially deflating community interaction metrics.
            //
            // ── WHERE & WHEN TO USE: ─────────────────────────────────
            // High-visibility social proof badges and highlight cards.
            //
            // ── USE CASES: ───────────────────────────────────────────
            // Hero section "Roast of the Day" burn tally badge.
            //
            // ── WHEN NOT TO USE: ─────────────────────────────────────
            // Do not use when filtering exclusively for destructive/negative sentiment.
            <span className="daily-badge font-mono">
              🔥 {(dailyRoast.reactions?.savage || 0) + (dailyRoast.reactions?.destroyed || 0) + (dailyRoast.reactions?.relatable || 0)} BURNS
            </span>
          )}
        </div>
        {dailyRoast && (
          <div className="daily-author-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dailyRoast.avatarUrl || `https://avatars.githubusercontent.com/${dailyRoast.username}?s=96`}
              alt={`@${dailyRoast.username}`}
              className="daily-avatar"
              width={36}
              height={36}
              loading="lazy"
              crossOrigin="anonymous"
            />
            <div className="daily-author-info">
              <Link
                href={`/history/${dailyRoast.username}`}
                className="daily-username font-mono"
                title={`View @${dailyRoast.username}'s roast history`}
              >
                @{dailyRoast.username}
              </Link>
              <span className="daily-stats font-mono">
                Score: {dailyRoast.score}/100 · Grade {dailyRoast.grade}
              </span>
            </div>
          </div>
        )}
        <p className="sample-roast-text">
          &ldquo;{dailyRoast?.roastText || "This is not a developer portfolio. It is a detailed public record of every time enthusiasm lasted one weekend."}&rdquo;
        </p>
      </div>

      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}

      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 1.25rem 1rem 6.5rem;
          position: relative;
          overflow-x: hidden;
          gap: 1.25rem;
        }

        /* ── Top Nav in normal document flow ── */
        .landing-nav {
          width: 100%;
          max-width: 640px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.25rem 0;
          z-index: 20;
        }
        .landing-nav-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Health Status Indicator ── */
        .status-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
          position: relative;
        }
        .status-dot::before {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          opacity: 0.6;
        }
        .status-dot--online {
          background: #FF6B00;
          box-shadow:
            0 0 6px 2px rgba(255, 107, 0, 0.6),
            0 0 16px 4px rgba(255, 69, 0, 0.3);
          animation: statusPulse 2s ease-in-out infinite;
        }
        .status-dot--online::before {
          background: #FF6B00;
          animation: statusRing 2s ease-in-out infinite;
        }
        .status-dot--offline {
          background: #FF3D3D;
          box-shadow:
            0 0 6px 2px rgba(255, 61, 61, 0.5),
            0 0 14px 4px rgba(255, 61, 61, 0.2);
          animation: statusPulse 1.5s ease-in-out infinite;
        }
        .status-dot--offline::before {
          background: #FF3D3D;
          animation: statusRing 1.5s ease-in-out infinite;
        }
        .status-dot--checking {
          background: #FFB700;
          box-shadow:
            0 0 6px 2px rgba(255, 183, 0, 0.5),
            0 0 14px 4px rgba(255, 183, 0, 0.2);
          animation: statusPulse 1s ease-in-out infinite;
        }
        .status-dot--checking::before {
          background: #FFB700;
          animation: statusRing 1s ease-in-out infinite;
        }
        .status-label {
          font-size: 10px;
          letter-spacing: 1px;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes statusRing {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(2.2); opacity: 0; }
        }

        /* ── Broadcast Banner ── */
        .broadcast-banner {
          width: 100%;
          max-width: 640px;
          margin: 0;
          padding: 0.65rem 0.9rem;
          background: rgba(255, 69, 0, 0.08);
          border: 1px solid rgba(255, 107, 0, 0.35);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          box-shadow: 0 4px 16px rgba(255, 69, 0, 0.1);
          z-index: 10;
        }
        .broadcast-left {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex: 1;
        }
        .broadcast-pill {
          background: linear-gradient(135deg, #ff4500 0%, #ff6b00 100%);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: var(--radius-sm);
          letter-spacing: 0.5px;
          flex-shrink: 0;
        }
        .broadcast-text {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.4;
          margin: 0;
        }
        .broadcast-login-link {
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          font-size: inherit;
          color: #fff;
          font-weight: 600;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.15s ease;
        }
        .broadcast-login-link:hover {
          color: var(--fire);
        }
        .broadcast-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 13px;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: color 0.15s ease;
          flex-shrink: 0;
        }
        .broadcast-close-btn:hover {
          color: var(--text-primary);
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
          margin-top: 0.5rem;
        }
        .landing-logo h1 {
          font-size: clamp(52px, 13vw, 96px);
          letter-spacing: 4px;
          line-height: 1;
          user-select: none;
        }
        .landing-tagline {
          color: var(--text-secondary);
          font-size: 16px;
          margin-top: 8px;
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
        .intensity-pro-tag--unlocked {
          background: #27c93f;
          box-shadow: 0 0 8px rgba(39, 201, 63, 0.4);
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
          max-width: 480px;
          padding: 1.1rem 1.25rem;
          border-left: 3px solid var(--fire);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 10px;
          background: linear-gradient(135deg, #110900 0%, #0D0D0D 100%);
        }
        .daily-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sample-roast-label {
          color: var(--fire);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0;
        }
        .daily-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 69, 0, 0.12);
          border: 1px solid rgba(255, 69, 0, 0.3);
          color: var(--fire);
        }
        .daily-author-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .daily-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--fire);
        }
        .daily-author-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .daily-username {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          text-decoration: none;
        }
        .daily-username:hover {
          color: var(--fire);
        }
        .daily-stats {
          font-size: 11px;
          color: var(--text-muted);
        }
        .sample-roast-text {
          color: var(--text-secondary);
          font-size: 13px;
          font-style: italic;
          line-height: 1.6;
          margin: 0;
        }

        /* ── Mobile Viewport Optimization (<600px) ── */
        /* WHAT: Streamlined vertical layout ensuring Username Input is immediately prominent above the fold */
        /* WHY: Eliminates excess vertical padding and shrinks button heights on compact mobile displays */
        @media (max-width: 600px) {
          .landing-page {
            padding-top: 0.75rem;
            gap: 0.85rem;
          }
          .landing-logo {
            margin-top: 0.2rem;
          }
          .status-label {
            display: none;
          }
          .intensity-wrap {
            gap: 6px;
          }
          .intensity-btn {
            padding: 8px 4px;
            gap: 2px;
          }
          .intensity-emoji {
            font-size: 16px;
          }
          .intensity-name {
            font-size: 11px;
          }
          .intensity-desc {
            font-size: 11px;
            margin-top: -2px;
          }
        }
      `}</style>
    </main>
  );
}
