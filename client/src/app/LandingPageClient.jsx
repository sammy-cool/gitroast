"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UsernameInput from "@/components/UsernameInput";
import { toast } from "@/utils/toast";
import dynamic from 'next/dynamic';
const ProModal = dynamic(() => import('@/components/ProModal'), { ssr: false });
const WelcomeConsentModal = dynamic(() => import('@/components/WelcomeConsentModal'), { ssr: false });
import { WELCOME_CONSENT_KEY } from "@/utils/welcomeConstants";
import GitHubLoginBtn from "@/components/GitHubLoginBtn";
import RateLimitBanner from "@/components/RateLimitBanner";
import LiveRoastFeed from "@/components/LiveRoastFeed";
import SoundToggle from "@/components/SoundToggle";
import { playClick, playFireSizzle } from "@/utils/soundFX";
import { useAuth } from "@/context/AuthContext";
import {
  getRoastStats,
  checkHealth,
  getRoastOfTheDay,
} from "@/services/roastService";

const PERSONAS = [
  { key: "classic", label: "Classic", emoji: "💀", desc: "Sharp, cynical code review" },
  { key: "hinglish", label: "Hinglish", emoji: "🇮🇳", desc: "Desi Tech Lead office comedy" },
  { key: "techbro", label: "Tech Bro", emoji: "👔", desc: "Silicon Valley Web3/AI lingo" },
  { key: "ramsay", label: "Chef Ramsay", emoji: "👨‍🍳", desc: "IT'S RAW! Pure kitchen fury" },
  { key: "shakespearean", label: "Shakespeare", emoji: "🎭", desc: "Elizabethan tragic verse" },
];

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
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [totalRoasts, setTotalRoasts] = useState(null);
  const [dailyRoast, setDailyRoast] = useState(null);
  const [broadcastDismissed, setBroadcastDismissed] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking"); // "checking" | "online" | "offline"
  const [intensity, setIntensity] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("gitroast_intensity");
        if (saved && INTENSITIES.find((i) => i.key === saved)) {
          return saved;
        }
      } catch {
        // Ignored in strict private browsing environments
      }
    }
    return "savage";
  });

  const [selectedPersona, setSelectedPersona] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("gitroast_persona");
        if (saved && PERSONAS.find((p) => p.key === saved)) {
          return saved;
        }
      } catch {
        // Ignored in strict private browsing environments
      }
    }
    return null;
  });

  // Derived persona: user-selected > account default > 'classic'
  const persona = selectedPersona || user?.customPreferences?.defaultPersona || "classic";

  const [rateLimitSecs, setRateLimitSecs] = useState(() => {
    if (typeof window !== "undefined") {
      try {
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
      } catch {
        // Ignored in strict private browsing environments
      }
    }
    return null;
  });
  const router = useRouter();

  /* 
    ── WHAT: ────────────────────────────────────────────────────────
    First-time visitor welcome & satirical consent modal onboarding check.
    ── WHY: ─────────────────────────────────────────────────────────
    Ensures new users understand GitRoast's public data safety & comedic
    satire. Uses a soft 350ms timeout to allow initial SSR hydration and
    hero paints to settle without incurring any Core Web Vitals (LCP) penalty.
    ── WHERE & WHEN TO USE: ─────────────────────────────────────────
    Fires exclusively on initial client-side landing page mount.
    ── USE CASES: ───────────────────────────────────────────────────
    First-time visitors on any device/viewport.
    ── WHEN NOT TO USE: ─────────────────────────────────────────────
    Returning visitors who have already established consent in localStorage.
  */
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const consented = localStorage.getItem(WELCOME_CONSENT_KEY);
        if (!consented) {
          const timer = setTimeout(() => {
            setShowWelcomeModal(true);
          }, 350);
          return () => clearTimeout(timer);
        }
      }
    } catch {
      // Ignored in strict private browsing environments
    }
  }, []);

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

  /**
   * WHAT: Evaluates whether an unauthenticated guest visitor should receive a GitHub login nudge toast, debounced by 5000ms.
   * WHY: Alerts unauthenticated visitors to log in for dedicated 5,000 req/hr rate limits; 5000ms debounce avoids colliding with the 4000ms welcome toast.
   * WHERE & WHEN TO USE: Landing page effect triggered after auth loading completes and when welcome modal is closed and consent granted.
   * USE CASES: First-time or returning guest visitors exploring the landing page without an active session.
   * WHEN NOT TO USE: When user is authenticated (`user !== null`), when auth is still verifying (`authLoading === true`), or when welcome modal is open.
   */
  useEffect(() => {
    if (authLoading) return;
    if (
      !user &&
      !showWelcomeModal &&
      typeof window !== "undefined" &&
      !sessionStorage.getItem("gitroast_login_broadcast") &&
      localStorage.getItem(WELCOME_CONSENT_KEY)
    ) {
      const timer = setTimeout(() => {
        if (!sessionStorage.getItem("gitroast_login_broadcast")) {
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
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [authLoading, user, loginWithGitHub, showWelcomeModal]);

  useEffect(() => {
    getRoastStats().then((total) => {
      if (total > 0) setTotalRoasts(total);
    });
    getRoastOfTheDay().then((roast) => {
      if (roast) setDailyRoast(roast);
    });
  }, []);

  function handleIntensitySelect(key) {
    playClick();
    const selected = INTENSITIES.find((i) => i.key === key);
    if (selected.isPro && !user?.isPro) {
      toast.proNudge("☢️ Nuclear mode is a Pro feature.", () => setShowProModal(true), "See Plans ⚡");
      return;
    }
    setIntensity(key);
    sessionStorage.setItem("gitroast_intensity", key);
  }

  function handlePersonaSelect(key) {
    playClick();
    setSelectedPersona(key);
    sessionStorage.setItem("gitroast_persona", key);
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

    playFireSizzle();
    sessionStorage.setItem("gitroast_intensity", intensity);
    sessionStorage.setItem("gitroast_persona", persona);
    if (cleanTarget.includes("/")) {
      router.push(`/repo/${cleanTarget}`);
    } else {
      router.push(`/roast/${cleanTarget}?intensity=${intensity}&persona=${persona}`);
    }
  }

  const selectedIntensity = INTENSITIES.find((i) => i.key === intensity);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [mobileTab, setMobileTab] = useState('dev'); // 'dev' | 'recruiter'

  /* 
    ── WHAT: ────────────────────────────────────────────────────────
    Candidate X-Ray search submit handler for recruiter panel.
    
    ── WHY: ─────────────────────────────────────────────────────────
    Allows recruiters to immediately analyze any GitHub candidate
    directly from the homepage hero without prior navigation.
    
    ── WHERE & WHEN TO USE: ─────────────────────────────────────────
    In the recruiter panel quick-audit form on landing page.
    
    ── USE CASES: ───────────────────────────────────────────────────
    Typing 'torvalds' -> redirects to /recruiter/dashboard/analyze/torvalds.
    
    ── WHEN NOT TO USE: ─────────────────────────────────────────────
    When user is submitting a developer roast (use handleRoast).
  */
  function handleCandidateSubmit(e) {
    e.preventDefault();
    const clean = (candidateSearch || '')
      .trim()
      .replace(/^https?:\/\/(?:www\.)?github\.com\//i, '')
      .replace(/^(?:www\.)?github\.com\//i, '')
      .replace(/^\/+|\/+$/g, '');
    if (!clean) {
      toast.warning('Please enter a candidate GitHub username to audit!');
      return;
    }
    router.push(`/recruiter/dashboard/analyze/${clean}`);
  }

  return (
    <main className="landing-page">
      {/* Ambient gradient glow backdrop */}
      <div className="landing-ambient-glow" aria-hidden="true">
        <div className="glow-dev" />
        <div className="glow-recruiter" />
      </div>

      {/* ── Broadcast Notice: non-intrusive alert pill for rate-limited public API ── */}
      {!authLoading && !user && !broadcastDismissed && (
        <div className="broadcast-banner font-mono" role="status">
          <div className="broadcast-left">
            <span className="broadcast-pill">NOTICE ⚡</span>
            <p className="broadcast-text">
              Public API is rate-limited (60 req/hr).{" "}
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

      {/* ── Mobile Viewport Segmented Switcher (<900px) ── */}
      <div className="mobile-tab-switch font-mono">
        <button
          type="button"
          className={`tab-switch-btn ${mobileTab === 'dev' ? 'tab-switch-btn--active-dev' : ''}`}
          onClick={() => setMobileTab('dev')}
        >
          ⚡ For Developers
        </button>
        <button
          type="button"
          className={`tab-switch-btn ${mobileTab === 'recruiter' ? 'tab-switch-btn--active-recruiter' : ''}`}
          onClick={() => setMobileTab('recruiter')}
        >
          💼 For Recruiters
        </button>
      </div>

      {/* ── 50/50 Dual-Panel Split Grid Container (Mockup Matching) ── */}
      <div className="split-grid-container">

        {/* ── LEFT PANEL: For Developers ── */}
        <div className={`split-panel dev-panel ${mobileTab === 'recruiter' ? 'panel--hidden-mobile' : ''}`}>
          {/* Developer Badge */}
          <div className="panel-badge-wrap">
            <span className="panel-badge dev-badge font-mono">⚡ FOR DEVELOPERS</span>
            <button
              type="button"
              className="satire-rules-btn font-mono"
              onClick={() => setShowWelcomeModal(true)}
              title="How GitRoast works & Satire Rules"
            >
              Rules ℹ️
            </button>
          </div>

          {/* Hero Headline */}
          <div className="panel-hero">
            <h1 className="hero-title font-display text-fire">
              GET YOUR CODE ROASTED
            </h1>
            <p className="hero-subtitle">
              Brutal code reviews powered by empirical GitHub commits. No sycophancy, no mercy.
            </p>
          </div>

          {/* Intensity Selector Pills */}
          <div className="selector-group">
            <p className="selector-header font-mono">CHOOSE BURN INTENSITY:</p>
            <div className="intensity-pills">
              {INTENSITIES.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  className={`intensity-pill font-mono ${intensity === opt.key ? 'intensity-pill--active' : ''} ${opt.isPro ? 'intensity-pill--pro' : ''}`}
                  style={{
                    '--accent-color': opt.color,
                  }}
                  onClick={() => handleIntensitySelect(opt.key)}
                  title={opt.isPro ? `${opt.label} — Pro only` : opt.description}
                >
                  <span className="pill-emoji">{opt.emoji}</span>
                  <span className="pill-label">{opt.label}</span>
                  {opt.isPro && (
                    <span className={`pill-pro-tag ${user?.isPro ? 'pill-pro-tag--unlocked' : ''}`}>
                      {user?.isPro ? 'PRO ✓' : 'PRO'}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p className="selector-hint font-mono">
              {selectedIntensity.emoji} {selectedIntensity.description}
            </p>
          </div>

          {/* Persona Selector Chips */}
          <div className="selector-group">
            <p className="selector-header font-mono">🎭 SELECT ROAST PERSONA:</p>
            <div className="persona-chips">
              {PERSONAS.map((p) => (
                <button
                  type="button"
                  key={p.key}
                  className={`persona-chip font-mono ${persona === p.key ? 'persona-chip--active' : ''}`}
                  onClick={() => handlePersonaSelect(p.key)}
                  title={p.desc}
                >
                  <span className="chip-emoji">{p.emoji}</span>
                  <span className="chip-label">{p.label}</span>
                </button>
              ))}
            </div>
            <p className="selector-hint font-mono">
              {PERSONAS.find((p) => p.key === persona)?.desc}
            </p>
          </div>

          {/* Live Roast Feed ticker */}
          <div className="feed-container">
            <LiveRoastFeed />
          </div>

          {/* Roast Input Box */}
          <div className="input-container">
            <UsernameInput onSubmit={handleRoast} />
          </div>

          {/* Social Proof */}
          {totalRoasts && (
            <p className="social-proof-line font-mono">
              <span className="highlight-num">{totalRoasts.toLocaleString()}</span> devs roasted and counting
            </p>
          )}

          {/* Developer Navigation CTAs */}
          <div className="quick-actions-row">
            <Link href="/pricing" className="action-pill-btn font-mono">
              ⚡ Pricing &amp; Perks
            </Link>
            <button
              type="button"
              className="action-pill-btn font-mono"
              onClick={() => setShowProModal(true)}
            >
              What&apos;s in Pro?
            </button>
            <Link href="/leaderboard" className="action-pill-btn font-mono">
              🏆 Wall of Shame
            </Link>
            <Link href="/battle" className="action-pill-btn font-mono">
              ⚔️ Battle
            </Link>
            <Link href="/universe" className="action-pill-btn action-pill-btn--universe font-mono">
              🌌 3D Universe
            </Link>
          </div>

          {/* Community Roast of the Day */}
          <div className="sample-roast-card">
            <div className="sample-card-header">
              <span className="sample-header-tag font-mono">🔥 ROAST OF THE DAY</span>
              {dailyRoast && (
                <span className="sample-burn-count font-mono">
                  🔥 {(dailyRoast.reactions?.savage || 0) + (dailyRoast.reactions?.destroyed || 0) + (dailyRoast.reactions?.relatable || 0)} BURNS
                </span>
              )}
            </div>
            {dailyRoast && (
              <div className="sample-author-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dailyRoast.avatarUrl || `https://avatars.githubusercontent.com/${dailyRoast.username}?s=96`}
                  alt={`@${dailyRoast.username}`}
                  className="sample-avatar"
                  width={34}
                  height={34}
                  loading="eager"
                  crossOrigin="anonymous"
                />
                <div className="sample-author-meta">
                  <Link
                    href={`/history/${dailyRoast.username}`}
                    className="sample-author-handle font-mono"
                    title={`View @${dailyRoast.username}'s roast history`}
                  >
                    @{dailyRoast.username}
                  </Link>
                  <span className="sample-score-pill font-mono">
                    Score: {dailyRoast.score}/100 · Grade {dailyRoast.grade}
                  </span>
                </div>
              </div>
            )}
            <p className="sample-quote font-mono">
              &ldquo;{dailyRoast?.roastText || "This is not a developer portfolio. It is a detailed public record of every time enthusiasm lasted one weekend."}&rdquo;
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: For Recruiters ── */}
        <div className={`split-panel recruiter-panel ${mobileTab === 'dev' ? 'panel--hidden-mobile' : ''}`}>
          {/* Recruiter Badge */}
          <div className="panel-badge-wrap">
            <span className="panel-badge recruiter-badge font-mono">💼 ENTERPRISE TALENT INTELLIGENCE</span>
          </div>

          {/* Recruiter Hero Headline */}
          <div className="panel-hero">
            <h2 className="hero-title font-display text-recruiter">
              SPOT REAL ENGINEERING TALENT
            </h2>
            <p className="hero-subtitle">
              Cut through resume fluff. Uncover real code hygiene, abandonment velocity, and architecture depth directly from commit logs.
            </p>
          </div>

          {/* Candidate X-Ray Quick Search Box */}
          <form className="candidate-search-card" onSubmit={handleCandidateSubmit}>
            <p className="search-card-header font-mono">🔍 AUDIT A CANDIDATE INSTANTLY:</p>
            <div className="search-input-box">
              <span className="search-prefix font-mono">@</span>
              <input
                type="text"
                className="search-input font-mono"
                placeholder="candidate GitHub handle... e.g. torvalds"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
              <button type="submit" className="search-submit-btn font-mono">
                Analyze ↗
              </button>
            </div>
            <p className="search-help-text font-mono">
              Instant forensic audit of commit hygiene, test presence, and code health.
            </p>
          </form>

          {/* Three Tactile Signal Preview Cards (Mockup Matching) */}
          <div className="signals-preview-group">
            <div className="signal-preview-card">
              <div className="signal-card-header">
                <span className="signal-icon">💀</span>
                <span className="signal-title font-mono">Abandonment Rate</span>
                <span className="signal-metric-pill metric--good font-mono">12% Low</span>
              </div>
              <p className="signal-description">
                Detect ghost commits, abandoned side-projects, and tutorial forks before making an offer.
              </p>
            </div>

            <div className="signal-preview-card">
              <div className="signal-card-header">
                <span className="signal-icon">📊</span>
                <span className="signal-title font-mono">Commit Hygiene</span>
                <span className="signal-metric-pill metric--high font-mono">94% High</span>
              </div>
              <p className="signal-description">
                Empirical signal on message clarity, squash consistency, and branch sanity.
              </p>
            </div>

            <div className="signal-preview-card">
              <div className="signal-card-header">
                <span className="signal-icon">⚡</span>
                <span className="signal-title font-mono">Architecture Depth</span>
                <span className="signal-metric-pill metric--verified font-mono">A+ Verified</span>
              </div>
              <p className="signal-description">
                Verify microservices, test presence, and real-world system complexity vs toy projects.
              </p>
            </div>
          </div>

          {/* Recruiter Authentication & Portal CTAs */}
          <div className="recruiter-ctas-wrap">
            <button
              type="button"
              className="google-sso-btn font-mono"
              onClick={() => router.push('/recruiter/login')}
            >
              <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </button>

            <Link href="/recruiter/dashboard" className="recruiter-portal-btn font-mono">
              Recruiter Portal &amp; Saved Talent →
            </Link>
          </div>

          {/* Recruiter Trust Note */}
          <p className="recruiter-trust-note font-mono">
            🛡️ Used by technical hiring managers, engineering directors &amp; lead architects.
          </p>
        </div>

      </div>

      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}

      {showWelcomeModal && (
        <WelcomeConsentModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}

      <style jsx>{`
        .landing-page {
          min-height: calc(100vh - 60px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 1.5rem 1.25rem 7rem;
          position: relative;
          overflow-x: hidden;
          gap: 1.5rem;
          background-color: var(--bg-primary, #f8fafc);
        }

        /* Ambient Glow Background */
        .landing-ambient-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .glow-dev {
          position: absolute;
          top: -10%;
          left: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255, 69, 0, 0.07) 0%, transparent 70%);
          filter: blur(60px);
        }

        .glow-recruiter {
          position: absolute;
          top: -10%;
          right: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(2, 132, 199, 0.08) 0%, transparent 70%);
          filter: blur(60px);
        }

        /* ── Broadcast Banner ── */
        .broadcast-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          width: 100%;
          max-width: 1240px;
          background: rgba(255, 183, 0, 0.09);
          border: 1px solid rgba(255, 183, 0, 0.3);
          border-radius: var(--radius-md, 10px);
          padding: 7px 14px;
          font-size: 12px;
          z-index: 10;
        }

        .broadcast-left {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .broadcast-pill {
          background: #ffb700;
          color: #000;
          font-weight: 700;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          letter-spacing: 0.5px;
        }

        .broadcast-text {
          color: var(--text-primary, #111827);
        }

        .broadcast-login-link {
          background: none;
          border: none;
          padding: 0;
          color: var(--fire, #ff4500);
          text-decoration: underline;
          cursor: pointer;
          font-family: inherit;
          font-size: inherit;
          font-weight: 700;
        }

        .broadcast-close-btn {
          background: none;
          border: none;
          color: var(--text-muted, #9ca3af);
          font-size: 13px;
          cursor: pointer;
          padding: 2px 6px;
        }

        /* ── Mobile Tab Switcher (<900px) ── */
        .mobile-tab-switch {
          display: none;
          width: 100%;
          max-width: 440px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 9999px;
          padding: 4px;
          gap: 4px;
          box-shadow: var(--shadow-soft, 0 2px 8px rgba(0, 0, 0, 0.04));
          z-index: 10;
        }

        .tab-switch-btn {
          flex: 1;
          padding: 8px 14px;
          border-radius: 9999px;
          border: none;
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary, #4b5563);
          cursor: pointer;
          transition: all 0.18s ease;
        }

        .tab-switch-btn--active-dev {
          background: var(--fire-grad);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(255, 69, 0, 0.3);
        }

        .tab-switch-btn--active-recruiter {
          background: linear-gradient(135deg, #0284c7 0%, #00bcd4 100%);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(2, 132, 199, 0.3);
        }

        /* ── 50/50 Dual-Panel Split Grid Container ── */
        .split-grid-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.75rem;
          width: 100%;
          max-width: 1240px;
          margin: 0 auto;
          align-items: stretch;
          z-index: 5;
        }

        .split-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 2rem 2.25rem;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-xl, 20px);
          box-shadow: 0 4px 24px -2px rgba(0, 0, 0, 0.05);
          transition: box-shadow 0.2s, border-color 0.2s;
        }

        .split-panel:hover {
          box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.08);
        }

        .dev-panel {
          border-top: 3px solid #ff4500;
        }

        .recruiter-panel {
          border-top: 3px solid #0284c7;
        }

        /* Panel Badges */
        .panel-badge-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .panel-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .dev-badge {
          background: rgba(255, 69, 0, 0.08);
          border: 1px solid rgba(255, 69, 0, 0.25);
          color: #ff4500;
        }

        .recruiter-badge {
          background: rgba(2, 132, 199, 0.08);
          border: 1px solid rgba(2, 132, 199, 0.25);
          color: #0284c7;
        }

        .satire-rules-btn {
          background: var(--bg-input, #f3f4f6);
          border: 1px solid var(--border, #e5e7eb);
          color: var(--text-secondary, #4b5563);
          font-size: 11px;
          padding: 3px 8px;
          border-radius: var(--radius-sm, 6px);
          cursor: pointer;
          transition: all 0.15s;
        }

        .satire-rules-btn:hover {
          color: var(--fire, #ff4500);
          border-color: rgba(255, 69, 0, 0.4);
        }

        /* Panel Hero Typography */
        .panel-hero {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .hero-title {
          font-size: clamp(2.2rem, 3.8vw, 3.4rem);
          line-height: 0.95;
          letter-spacing: 1px;
          margin: 0;
        }

        .text-recruiter {
          background: linear-gradient(135deg, #0284c7 0%, #00bcd4 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          color: var(--text-secondary, #4b5563);
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }

        /* Selectors (Intensity & Persona) */
        .selector-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .selector-header {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-secondary, #4b5563);
          letter-spacing: 0.5px;
        }

        .intensity-pills {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .intensity-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 8px 6px;
          border-radius: var(--radius-md, 10px);
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
        }

        .intensity-pill:hover {
          border-color: var(--accent-color, #ff4500);
          transform: translateY(-1px);
        }

        .intensity-pill--active {
          border-color: var(--accent-color, #ff4500) !important;
          background: rgba(255, 69, 0, 0.05);
          box-shadow: 0 0 14px rgba(255, 69, 0, 0.18);
        }

        .pill-emoji {
          font-size: 18px;
        }

        .pill-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary, #111827);
        }

        .pill-pro-tag {
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 3px;
          background: #ff3d3d;
          color: #fff;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .pill-pro-tag--unlocked {
          background: #10b981;
        }

        .selector-hint {
          font-size: 11px;
          color: var(--text-muted, #9ca3af);
          margin-top: 2px;
        }

        /* Persona Chips */
        .persona-chips {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .persona-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 9px;
          border-radius: 9999px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          font-size: 11px;
          color: var(--text-secondary, #4b5563);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .persona-chip:hover {
          border-color: var(--fire, #ff4500);
          color: var(--fire, #ff4500);
        }

        .persona-chip--active {
          background: rgba(255, 69, 0, 0.08);
          border-color: var(--fire, #ff4500);
          color: var(--fire, #ff4500);
          font-weight: 700;
        }

        /* Feed & Input */
        .feed-container {
          width: 100%;
        }

        .input-container {
          width: 100%;
        }

        .social-proof-line {
          font-size: 12px;
          color: var(--text-secondary, #4b5563);
          text-align: center;
        }

        .highlight-num {
          color: var(--fire, #ff4500);
          font-weight: 700;
        }

        /* Quick Action Pills */
        .quick-actions-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .action-pill-btn {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #4b5563);
          background: var(--bg-input, #f3f4f6);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-sm, 6px);
          padding: 5px 9px;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-pill-btn:hover {
          border-color: var(--border-hover, #d1d5db);
          color: var(--fire, #ff4500);
          background: #ffffff;
        }

        .action-pill-btn--universe {
          color: #0284c7;
          border-color: rgba(2, 132, 199, 0.25);
        }

        /* Sample Roast of the Day Card */
        .sample-roast-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px 16px;
          background: #ffffff;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-lg, 14px);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
          margin-top: auto;
        }

        .sample-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10px;
        }

        .sample-header-tag {
          color: var(--fire, #ff4500);
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .sample-burn-count {
          color: var(--text-muted, #9ca3af);
        }

        .sample-author-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sample-avatar {
          border-radius: 50%;
          border: 1px solid var(--border, #e5e7eb);
        }

        .sample-author-meta {
          display: flex;
          flex-direction: column;
        }

        .sample-author-handle {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary, #111827);
          text-decoration: none;
        }

        .sample-author-handle:hover {
          color: var(--fire, #ff4500);
        }

        .sample-score-pill {
          font-size: 11px;
          color: var(--text-secondary, #4b5563);
        }

        .sample-quote {
          font-size: 12px;
          font-style: italic;
          color: var(--text-secondary, #4b5563);
          line-height: 1.5;
          margin: 0;
        }

        /* ── Recruiter Panel Styles ── */
        .candidate-search-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          background: rgba(2, 132, 199, 0.04);
          border: 1px solid rgba(2, 132, 199, 0.2);
          border-radius: var(--radius-lg, 14px);
        }

        .search-card-header {
          font-size: 11px;
          font-weight: 700;
          color: #0284c7;
          letter-spacing: 0.5px;
          margin: 0;
        }

        .search-input-box {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-md, 10px);
          overflow: hidden;
          transition: border-color 0.18s;
        }

        .search-input-box:focus-within {
          border-color: #0284c7;
          box-shadow: 0 0 10px rgba(2, 132, 199, 0.15);
        }

        .search-prefix {
          padding: 0 12px;
          color: var(--text-muted, #9ca3af);
          font-size: 14px;
          font-weight: 700;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 12px 4px;
          font-size: 13px;
          color: var(--text-primary, #111827);
          outline: none;
          min-width: 0;
        }

        .search-submit-btn {
          background: #0284c7;
          color: #ffffff;
          border: none;
          padding: 12px 16px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s;
          white-space: nowrap;
        }

        .search-submit-btn:hover {
          background: #0369a1;
        }

        .search-help-text {
          font-size: 11px;
          color: var(--text-muted, #9ca3af);
          margin: 0;
        }

        /* Signal Preview Cards (Exact 3 Cards from Mockup) */
        .signals-preview-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .signal-preview-card {
          padding: 12px 14px;
          background: #ffffff;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-md, 10px);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
          transition: transform 0.15s, border-color 0.15s;
        }

        .signal-preview-card:hover {
          border-color: rgba(2, 132, 199, 0.3);
          transform: translateX(2px);
        }

        .signal-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }

        .signal-icon {
          font-size: 16px;
        }

        .signal-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary, #111827);
          flex: 1;
        }

        .signal-metric-pill {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 9999px;
        }

        .metric--good {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }

        .metric--high {
          background: rgba(2, 132, 199, 0.1);
          color: #0284c7;
          border: 1px solid rgba(2, 132, 199, 0.3);
        }

        .metric--verified {
          background: rgba(139, 92, 246, 0.1);
          color: #7c3aed;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .signal-description {
          font-size: 12px;
          color: var(--text-secondary, #4b5563);
          line-height: 1.4;
          margin: 0;
        }

        /* Recruiter CTAs */
        .recruiter-ctas-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
          width: 100%;
          margin-top: auto;
        }

        .google-sso-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 13px 20px;
          background: #ffffff;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-md, 10px);
          color: #1e293b;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .google-sso-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .recruiter-portal-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 12px 20px;
          background: linear-gradient(135deg, #0284c7 0%, #00bcd4 100%);
          border: none;
          border-radius: var(--radius-md, 10px);
          color: #ffffff;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
        }

        .recruiter-portal-btn:hover {
          opacity: 0.94;
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.35);
        }

        .recruiter-trust-note {
          font-size: 11px;
          color: var(--text-muted, #9ca3af);
          text-align: center;
          margin: 0;
        }

        /* ── Responsive Viewports ── */
        @media (max-width: 900px) {
          .mobile-tab-switch {
            display: flex;
          }

          .split-grid-container {
            grid-template-columns: 1fr;
            gap: 1.25rem;
          }

          .panel--hidden-mobile {
            display: none !important;
          }

          .split-panel {
            padding: 1.5rem 1.25rem;
          }
        }

        @media (max-width: 480px) {
          .landing-page {
            padding: 1rem 0.85rem 7rem;
          }

          .hero-title {
            font-size: 2.1rem;
          }

          .intensity-pills {
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
          }

          .intensity-pill {
            padding: 6px 2px;
          }

          .pill-label {
            font-size: 11px;
          }
        }
      `}</style>
    </main>
  );
}
