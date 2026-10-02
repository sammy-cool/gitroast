"use client";

// ============================================================
// GITROAST — Next-Gen Landing Page Client (Project Luminous & Figma Alignment)
// ============================================================
// ── WHAT: ────────────────────────────────────────────────────
// Master interactive landing page component for GitRoast.
// Implements the approved Figma design system layout:
//   1. Dual Hero: High-impact editorial copy + Floating interactive roast card.
//   2. Black Live Ticker: Real-time community roast feed band.
//   3. Recent Savage Burns: 3-card showcase (with central featured obsidian card).
//   4. Community & Social: Wall of Shame & Battle arena launch banner.
//   5. Transparent Pricing Grid: Free vs Roaster vs Historian tier overview.
//   6. Interactive FAQ Accordion: Two-column collapsible knowledge base.
//   7. Recruiter Portal Gateway: Candidate X-Ray quick search and metrics.
//
// ── WHY: ─────────────────────────────────────────────────────
// Aligns 100% with the user's Figma canvas (Ja03bGrZxXUVD1fCYxGOMZ, node-id=3-32450)
// providing a cohesive, human-crafted, warm sand luminous visual experience
// with high conversion, clear navigation, and zero layout shift.
//
// ── WHERE & WHEN TO USE: ─────────────────────────────────────
// Rendered on the root route `/` via `client/src/app/page.jsx`.
//
// ── USE CASES: ───────────────────────────────────────────────
// - Developer first-visit roast generation (username or repo input).
// - Burn intensity and persona tone personalization.
// - Real-time viral live roast discovery.
// - Recruiter talent intelligence candidate audits.
// - Pro subscription upgrades and FAQ discovery.
//
// ── WHEN NOT TO USE: ─────────────────────────────────────────
// Do not render inside internal iframe embeds or headless crawler routes.
// ============================================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UsernameInput from "@/components/UsernameInput";
import { toast } from "@/utils/toast";
import dynamic from 'next/dynamic';
const ProModal = dynamic(() => import('@/components/ProModal'), { ssr: false });
const WelcomeConsentModal = dynamic(() => import('@/components/WelcomeConsentModal'), { ssr: false });
import { WELCOME_CONSENT_KEY } from "@/utils/welcomeConstants";
import RateLimitBanner from "@/components/RateLimitBanner";
import LiveRoastFeed from "@/components/LiveRoastFeed";
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

const RECENT_BURNS = [
  {
    username: "dan_abramov",
    score: 74,
    grade: "B+",
    featured: false,
    quote: "You write React components like someone being charged by the hook count. 14 useState hooks for a toggle button.",
    topLang: "TypeScript",
  },
  {
    username: "torvalds",
    score: 24,
    grade: "F 🔥",
    featured: true,
    shameTags: ["#wip", "#force-push", "#fix-3am"],
    quote: "This repository is a digital crime scene of 3 AM force pushes and zero documentation. We are genuinely terrified.",
    topLang: "C",
  },
  {
    username: "devjane",
    score: 81,
    grade: "A-",
    featured: false,
    quote: "Suspiciously clean. We had to dig through your 2021 tutorial forks just to find an embarrassing commit message.",
    topLang: "Rust",
  },
];

const FAQS = [
  {
    q: "Does GitRoast roast private repositories?",
    a: "No. By default, GitRoast only inspects public repositories using GitHub's public REST API. If you log in with GitHub and hold a Pro membership, you can optionally analyze your own private repositories.",
  },
  {
    q: "Can organizations or companies be roasted?",
    a: "GitRoast is built specifically for individual developers. Attempting to roast an organization account will return a friendly error directing you to individual contributors.",
  },
  {
    q: "How does the AI work?",
    a: "We extract statistical signals from your GitHub profile (commit frequencies, star-to-repo ratios, commit message patterns, language distributions, and graveyard streaks) and pass this structured snapshot to Google Gemini AI to assemble a savage, context-aware roast.",
  },
  {
    q: "What if Gemini AI or GitHub API is down?",
    a: "GitRoast operates on a zero-crash, defensive programming philosophy. If the Gemini AI API experiences high load or rate limits, our deterministic rule-based roast engine immediately takes over without failing the request.",
  },
  {
    q: "How can I add the GitRoast badge to my GitHub profile README?",
    a: "Every roast page and history page features a 1-click '🛡️ Copy GitHub README Badge' button! You can choose between a fiery dark card style (320×78px) or a sleek shield/pill style. Paste the Markdown snippet into your GitHub profile README.md and it will dynamically update with your score!",
  },
];

export default function LandingPageClient() {
  const { user, loginWithGitHub, loading: authLoading } = useAuth();
  const [showProModal, setShowProModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [totalRoasts, setTotalRoasts] = useState(null);
  const [dailyRoast, setDailyRoast] = useState(null);
  const [broadcastDismissed, setBroadcastDismissed] = useState(false);
  const [, setServerStatus] = useState("checking");
  const [openFaq, setOpenFaq] = useState(null);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [mobileTab, setMobileTab] = useState('dev'); // 'dev' | 'recruiter'
  const router = useRouter();

  const [intensity, setIntensity] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("gitroast_intensity");
        if (saved && INTENSITIES.find((i) => i.key === saved)) {
          return saved;
        }
      } catch {
        // Ignored in strict private browsing
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
        // Ignored in strict private browsing
      }
    }
    return null;
  });

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
        // Ignored in strict private browsing
      }
    }
    return null;
  });

  // Welcome modal trigger for first-time visitors
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
      // Ignored in strict private browsing
    }
  }, []);

  // Health poll on mount
  useEffect(() => {
    async function initHealth() {
      const ok = await checkHealth();
      setServerStatus(ok ? 'online' : 'offline');
    }
    initHealth();
    const interval = setInterval(initHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Rate limit broadcast nudge for unauthenticated visitors
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

  // Load stats & roast of the day
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

  function toggleFaq(index) {
    playClick();
    setOpenFaq((prev) => (prev === index ? null : index));
  }

  const selectedIntensity = INTENSITIES.find((i) => i.key === intensity);

  return (
    <main className="landing-page">
      {/* ── Broadcast Notice: Rate limit alert strip ── */}
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

      {/* ── Mobile Viewport Switcher (<900px) ── */}
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

      {/* ══════════════════════════════════════════════════════════════
          1. HERO SECTION (Figma Dual Split Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left Column: Bold Headline & Social Proof */}
          <div className={`hero-copy-col ${mobileTab === 'recruiter' ? 'col--hidden-mobile' : ''}`}>
            <div className="hero-badge font-mono">
              <span className="badge-pulse-dot" />
              <span>LIVE GITHUB DEV FORENSICS</span>
            </div>

            <h1 className="hero-main-title font-display">
              TURN PUBLIC COMMITS INTO <span className="text-fire">BRUTAL REALITY.</span>
            </h1>

            <p className="hero-desc font-body">
              Real GitHub commits analyzed, architectural sins exposed, and developer egos dismantled.
              No AI sycophancy. Zero mercy.
            </p>

            {/* Social Proof Metric Chips */}
            <div className="hero-metrics-row font-mono">
              <div className="metric-chip">
                <span className="metric-val">{totalRoasts ? `${totalRoasts.toLocaleString()}+` : '42,890+'}</span>
                <span className="metric-label">Devs Roasted</span>
              </div>
              <div className="metric-chip">
                <span className="metric-val">4.9 / 5</span>
                <span className="metric-label">Savage Rating</span>
              </div>
              <div className="metric-chip">
                <span className="metric-val">180k+</span>
                <span className="metric-label">Repos Abandoned</span>
              </div>
            </div>

            {/* Quick Exploration Navigation Pills */}
            <div className="hero-pills-row font-mono">
              <Link href="/pricing" className="hero-nav-pill">
                ⚡ Pricing &amp; Perks
              </Link>
              <Link href="/leaderboard" className="hero-nav-pill">
                🏆 Wall of Shame
              </Link>
              <Link href="/battle" className="hero-nav-pill">
                ⚔️ Battle
              </Link>
              <Link href="/universe" className="hero-nav-pill hero-nav-pill--universe">
                🌌 3D Universe
              </Link>
              <button
                type="button"
                className="hero-nav-pill hero-nav-pill--rules"
                onClick={() => setShowWelcomeModal(true)}
              >
                Rules ℹ️
              </button>
            </div>
          </div>

          {/* Right Column: Floating Interactive Roast Card */}
          <div className={`hero-card-col ${mobileTab === 'recruiter' ? 'col--hidden-mobile' : ''}`}>
            <div className="floating-roast-card">
              <div className="roast-card-header font-mono">
                <span className="card-header-icon">🔥</span>
                <span className="card-header-title">ROAST MY GITHUB</span>
                <span className="card-header-badge font-mono">INSTANT</span>
              </div>

              {/* Username / Repo Input Component */}
              <div className="input-wrap">
                <UsernameInput onSubmit={handleRoast} />
              </div>

              {/* Intensity Selector */}
              <div className="selector-block">
                <span className="selector-title font-mono">BURN INTENSITY:</span>
                <div className="intensity-pills-wrap">
                  {INTENSITIES.map((opt) => (
                    <button
                      type="button"
                      key={opt.key}
                      className={`intensity-pill font-mono ${intensity === opt.key ? 'intensity-pill--active' : ''} ${opt.isPro ? 'intensity-pill--pro' : ''}`}
                      onClick={() => handleIntensitySelect(opt.key)}
                      title={opt.isPro ? `${opt.label} — Pro only` : opt.description}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                      {opt.isPro && (
                        <span className={`pill-pro-tag ${user?.isPro ? 'pill-pro-tag--unlocked' : ''}`}>
                          {user?.isPro ? 'PRO ✓' : 'PRO'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="selector-caption font-mono">
                  {selectedIntensity.emoji} {selectedIntensity.description}
                </p>
              </div>

              {/* Persona Selector */}
              <div className="selector-block">
                <span className="selector-title font-mono">ROAST PERSONA:</span>
                <div className="persona-chips-wrap">
                  {PERSONAS.map((p) => (
                    <button
                      type="button"
                      key={p.key}
                      className={`persona-chip font-mono ${persona === p.key ? 'persona-chip--active' : ''}`}
                      onClick={() => handlePersonaSelect(p.key)}
                      title={p.desc}
                    >
                      <span>{p.emoji}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
                <p className="selector-caption font-mono">
                  {PERSONAS.find((p) => p.key === persona)?.desc}
                </p>
              </div>

              {/* Recruiter Switch Gateway */}
              <div className="recruiter-hint-row">
                <Link href="/recruiter/login" className="recruiter-hint-link font-mono">
                  💼 Looking to hire? Try Candidate X-Ray →
                </Link>
              </div>

              {/* Trust Footnote */}
              <div className="card-trust-footer font-mono">
                🔒 100% Read-Only Public API · Free &amp; Instant · 5,000 req/hr with GitHub Auth
              </div>
            </div>
          </div>

          {/* Recruiter Viewport Panel (Displayed when recruiter tab active on mobile) */}
          <div className={`recruiter-mobile-panel ${mobileTab === 'dev' ? 'panel--hidden-mobile' : ''}`}>
            <div className="recruiter-panel-card">
              <span className="recruiter-badge font-mono">💼 ENTERPRISE TALENT INTELLIGENCE</span>
              <h2 className="recruiter-hero-title font-display text-recruiter">
                SPOT REAL ENGINEERING TALENT
              </h2>
              <p className="recruiter-hero-desc">
                Cut through resume fluff. Uncover real code hygiene, abandonment velocity, and architecture depth directly from commit logs.
              </p>

              {/* Quick Candidate Audit Form */}
              <form className="recruiter-search-form" onSubmit={handleCandidateSubmit}>
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
              </form>

              {/* Recruiter Login */}
              <div className="recruiter-login-actions">
                <Link href="/recruiter/login" className="btn-recruiter-login font-mono">
                  Sign in to Recruiter Portal 💼
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. BLACK LIVE ROAST TICKER BAND (Figma Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="live-ticker-band">
        <div className="ticker-inner">
          <div className="ticker-label font-mono">
            <span className="ticker-dot animate-pulse" />
            <span>LIVE BURNS:</span>
          </div>
          <div className="ticker-content">
            <LiveRoastFeed />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. RECENT SAVAGE BURNS SHOWCASE (Figma 3-Card Grid)
          ══════════════════════════════════════════════════════════════ */}
      <section className="burns-showcase-section">
        <div className="section-header">
          <h2 className="section-title font-display">RECENT SAVAGE BURNS</h2>
          <p className="section-subtitle font-mono">
            Real profiles roasted in the last 15 minutes. Pure unfiltered truth.
          </p>
        </div>

        <div className="burns-grid">
          {RECENT_BURNS.map((item, idx) => (
            <div
              key={idx}
              className={`burn-card ${item.featured ? 'burn-card--featured' : 'burn-card--light'}`}
            >
              <div className="burn-card-top">
                <div className="burn-author-info">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://avatars.githubusercontent.com/${item.username}?s=96`}
                    alt={`@${item.username}`}
                    className="burn-avatar"
                    width={42}
                    height={42}
                    crossOrigin="anonymous"
                    loading="lazy"
                  />
                  <div>
                    <h3 className="burn-handle font-mono">@{item.username}</h3>
                    <span className="burn-lang font-mono">{item.topLang}</span>
                  </div>
                </div>
                <div className="burn-grade-badge font-mono">
                  {item.grade}
                </div>
              </div>

              {item.shameTags && (
                <div className="burn-tags-row font-mono">
                  {item.shameTags.map((t, i) => (
                    <span key={i} className="burn-tag-pill">{t}</span>
                  ))}
                </div>
              )}

              <p className="burn-quote font-mono">
                &ldquo;{item.quote}&rdquo;
              </p>

              <div className="burn-card-bottom">
                <span className="burn-score-pill font-mono">
                  Score: {item.score}/100
                </span>
                <Link href={`/history/${item.username}`} className="burn-view-link font-mono">
                  View Roast ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. COMMUNITY & SOCIAL BANNER (Figma Pastel Blue Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="community-banner-section">
        <div className="community-card">
          <div className="community-content">
            <span className="community-badge font-mono">🏆 COMMUNITY &amp; COMPETITION</span>
            <h2 className="community-title font-display">
              JOIN 40,000+ DEVELOPERS ON THE WALL OF SHAME
            </h2>
            <p className="community-desc">
              Compare your commit crimes with top open source contributors or duel your coworkers in Head-to-Head Roast Battles.
            </p>
            <div className="community-actions font-mono">
              <Link href="/leaderboard" className="btn btn-community-primary">
                🏆 Explore Wall of Shame
              </Link>
              <Link href="/battle" className="btn btn-community-secondary">
                ⚔️ Start a Roast Battle
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. PRICING & PRO OVERVIEW (Figma 3-Tier Grid Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="pricing-preview-section">
        <div className="section-header">
          <h2 className="section-title font-display">TRANSPARENT POWER. ZERO SUBSCRIPTION TRAPS.</h2>
          <p className="section-subtitle font-mono">
            Pay once or stay free forever. No recurring credit card traps.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="pricing-plan-card">
            <h3 className="plan-name font-display">FREE TIER</h3>
            <div className="plan-price font-display">₹0 <span className="price-sub font-mono">forever</span></div>
            <p className="plan-desc font-mono">Standard code burns and public wall ranking.</p>
            <ul className="plan-features font-mono">
              <li>✓ Public GitHub profile roasts</li>
              <li>✓ Deterministic comedy rule engine</li>
              <li>✓ Global Wall of Shame ranking</li>
              <li>✓ 60 req/hr IP rate limit</li>
            </ul>
            <button
              type="button"
              className="plan-btn font-mono"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Get Roasted Free 🔥
            </button>
          </div>

          {/* Roaster Plan (Featured) */}
          <div className="pricing-plan-card pricing-plan-card--featured">
            <div className="plan-popular-tag font-mono">MOST POPULAR</div>
            <h3 className="plan-name font-display text-fire">ROASTER PLAN</h3>
            <div className="plan-price font-display">₹99 <span className="price-sub font-mono">/ $1.99</span></div>
            <p className="plan-desc font-mono">Unlimited Gemini AI burns and Nuclear mode.</p>
            <ul className="plan-features font-mono">
              <li>✓ Unlimited Gemini 2.5 Flash burns</li>
              <li>✓ Nuclear ☢️ Intensity mode unlocked</li>
              <li>✓ Zero watermarks on 2× HD downloads</li>
              <li>✓ 5,000 req/hr dedicated quota</li>
            </ul>
            <Link href="/pricing" className="plan-btn plan-btn--fire font-mono">
              Upgrade to Roaster ⚡
            </Link>
          </div>

          {/* Historian Plan */}
          <div className="pricing-plan-card">
            <h3 className="plan-name font-display">HISTORIAN PLAN</h3>
            <div className="plan-price font-display">₹199 <span className="price-sub font-mono">/ $3.99</span></div>
            <p className="plan-desc font-mono">Lifetime trend analysis and private repo audits.</p>
            <ul className="plan-features font-mono">
              <li>✓ All Roaster plan benefits</li>
              <li>✓ Deep private repository reviews</li>
              <li>✓ Monthly GitHub audit reports</li>
              <li>✓ Permanent lifetime score tracking</li>
            </ul>
            <Link href="/pricing" className="plan-btn font-mono">
              Upgrade to Historian 📜
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. INTERACTIVE FAQ ACCORDION (Figma Two-Column Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-left-col">
            <span className="faq-badge font-mono">KNOWLEDGE BASE</span>
            <h2 className="faq-title font-display">FREQUENTLY ASKED QUESTIONS</h2>
            <p className="faq-sub font-body">
              Everything you need to know about roast accuracy, data privacy, and Pro benefits.
            </p>
            <Link href="/contact" className="faq-contact-link font-mono">
              Need more help? Contact pit crew ↗
            </Link>
          </div>

          <div className="faq-right-col">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className={`faq-accordion-item ${openFaq === idx ? 'faq-item--open' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="faq-question-row font-mono">
                  <span className="faq-q-text">{faq.q}</span>
                  <span className="faq-chevron">{openFaq === idx ? '▲' : '▼'}</span>
                </div>
                {openFaq === idx && (
                  <p className="faq-a-text font-body animate-fadeUp">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modals */}
      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      {showWelcomeModal && (
        <WelcomeConsentModal
          isOpen={showWelcomeModal}
          onClose={() => setShowWelcomeModal(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════
          STYLES (Project Luminous Warm Sand & Figma Geometry)
          ══════════════════════════════════════════════════════════════ */}
      <style jsx>{`
        .landing-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--bg-primary, #F7F5F0);
          color: var(--text-primary, #111827);
          padding-bottom: 7.5rem;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Broadcast Banner ── */
        .broadcast-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1200px;
          margin: 0.75rem 1.25rem 0;
          padding: 8px 16px;
          background: rgba(255, 183, 0, 0.12);
          border: 1px solid rgba(255, 183, 0, 0.35);
          border-radius: var(--radius-md, 10px);
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
          font-weight: 700;
        }
        .broadcast-close-btn {
          background: none;
          border: none;
          color: var(--text-muted, #9ca3af);
          font-size: 13px;
          cursor: pointer;
        }

        /* ── Mobile Tab Switcher (<900px) ── */
        .mobile-tab-switch {
          display: none;
          width: 90%;
          max-width: 400px;
          margin: 1rem auto 0;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 9999px;
          padding: 4px;
          gap: 4px;
          box-shadow: var(--shadow-soft, 0 2px 8px rgba(0, 0, 0, 0.04));
          z-index: 10;
        }
        .tab-switch-btn {
          flex: 1;
          padding: 8px 12px;
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
        }
        .tab-switch-btn--active-recruiter {
          background: linear-gradient(135deg, #0284c7 0%, #00bcd4 100%);
          color: #ffffff;
        }

        /* ── 1. Hero Section ── */
        .hero-section {
          width: 100%;
          max-width: 1240px;
          padding: 2.5rem 1.5rem 2rem;
          margin: 0 auto;
        }
        .hero-container {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 2.5rem;
          align-items: center;
        }

        /* Left Column */
        .hero-copy-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          padding: 4px 12px;
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #4b5563);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .badge-pulse-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .hero-main-title {
          font-size: clamp(2.8rem, 5.5vw, 4.2rem);
          line-height: 1.02;
          letter-spacing: 0.5px;
          color: var(--text-primary, #111827);
          margin: 0;
        }
        .hero-desc {
          font-size: 16px;
          color: var(--text-secondary, #4b5563);
          line-height: 1.6;
          max-width: 580px;
          margin: 0;
        }

        /* Hero Metrics Row */
        .hero-metrics-row {
          display: flex;
          gap: 1.25rem;
          padding: 1rem 0;
          flex-wrap: wrap;
        }
        .metric-chip {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 8px 14px;
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        .metric-val {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--fire, #ff4500);
        }
        .metric-label {
          font-size: 11px;
          color: var(--text-muted, #9ca3af);
        }

        /* Quick Pills */
        .hero-pills-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .hero-nav-pill {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: #ffffff;
          color: var(--text-secondary, #4b5563);
          border: 1px solid var(--border, #e5e0d8);
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .hero-nav-pill:hover {
          border-color: var(--fire, #ff4500);
          color: var(--fire, #ff4500);
          transform: translateY(-1px);
        }
        .hero-nav-pill--universe {
          border-color: #3b82f6;
          color: #2563eb;
        }
        .hero-nav-pill--rules {
          cursor: pointer;
        }

        /* Right Column: Floating Roast Card */
        .hero-card-col {
          display: flex;
          justify-content: center;
        }
        .floating-roast-card {
          width: 100%;
          max-width: 460px;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 16px;
          padding: 1.75rem;
          box-shadow: 0 12px 36px -6px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: relative;
        }
        .roast-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .card-header-icon {
          font-size: 1.2rem;
        }
        .card-header-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary, #111827);
          letter-spacing: 0.5px;
        }
        .card-header-badge {
          margin-left: auto;
          font-size: 9px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(255, 69, 0, 0.1);
          color: var(--fire, #ff4500);
        }
        .input-wrap {
          width: 100%;
        }

        /* Selector Blocks */
        .selector-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .selector-title {
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted, #9ca3af);
          letter-spacing: 0.5px;
        }
        .intensity-pills-wrap, .persona-chips-wrap {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .intensity-pill, .persona-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          background: #f8fafc;
          border: 1px solid var(--border, #e5e0d8);
          color: var(--text-secondary, #4b5563);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .intensity-pill:hover, .persona-chip:hover {
          border-color: var(--fire, #ff4500);
        }
        .intensity-pill--active, .persona-chip--active {
          background: rgba(255, 69, 0, 0.08);
          border-color: var(--fire, #ff4500);
          color: var(--fire, #ff4500);
        }
        .pill-pro-tag {
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 3px;
          background: #ef4444;
          color: #ffffff;
        }
        .pill-pro-tag--unlocked {
          background: #10b981;
        }
        .selector-caption {
          font-size: 10px;
          color: var(--text-muted, #9ca3af);
          margin: 0;
        }
        .recruiter-hint-row {
          padding-top: 4px;
          border-top: 1px dashed var(--border, #e5e0d8);
        }
        .recruiter-hint-link {
          font-size: 11px;
          color: #0284c7;
          text-decoration: none;
          font-weight: 600;
        }
        .recruiter-hint-link:hover {
          text-decoration: underline;
        }
        .card-trust-footer {
          font-size: 10px;
          color: var(--text-muted, #9ca3af);
          text-align: center;
        }

        /* Recruiter Mobile Viewport Panel */
        .recruiter-mobile-panel {
          display: none;
        }
        .recruiter-panel-card {
          background: #ffffff;
          border: 1px solid rgba(2, 132, 199, 0.25);
          border-radius: 16px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 8px 30px rgba(2, 132, 199, 0.06);
        }
        .recruiter-badge {
          font-size: 10px;
          font-weight: 700;
          color: #0284c7;
        }
        .recruiter-hero-title {
          font-size: 2rem;
          color: #0284c7;
          margin: 0;
        }
        .recruiter-hero-desc {
          font-size: 13px;
          color: var(--text-secondary, #4b5563);
          margin: 0;
        }
        .search-input-box {
          display: flex;
          align-items: center;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 4px 6px;
          background: #f0f9ff;
        }
        .search-prefix {
          padding: 0 8px;
          color: #0284c7;
          font-weight: 700;
        }
        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 13px;
          outline: none;
        }
        .search-submit-btn {
          background: #0284c7;
          color: #ffffff;
          border: none;
          padding: 8px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-recruiter-login {
          display: block;
          text-align: center;
          background: #0284c7;
          color: #ffffff;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        }

        /* ── 2. Black Live Roast Ticker Band ── */
        .live-ticker-band {
          width: 100%;
          background: #111827;
          border-top: 1px solid #1f2937;
          border-bottom: 1px solid #1f2937;
          padding: 8px 1.5rem;
          margin: 1.5rem 0;
        }
        .ticker-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ticker-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: #ff4500;
          white-space: nowrap;
        }
        .ticker-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #ef4444;
        }
        .ticker-content {
          flex: 1;
          overflow: hidden;
        }

        /* ── 3. Recent Savage Burns Showcase ── */
        .burns-showcase-section {
          width: 100%;
          max-width: 1240px;
          padding: 2.5rem 1.5rem;
        }
        .section-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .section-title {
          font-size: clamp(2rem, 4vw, 2.8rem);
          color: var(--text-primary, #111827);
          letter-spacing: 0.5px;
          margin: 0;
        }
        .section-subtitle {
          font-size: 13px;
          color: var(--text-secondary, #4b5563);
          margin-top: 6px;
        }
        .burns-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .burn-card {
          padding: 1.5rem;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .burn-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }
        .burn-card--light {
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          color: var(--text-primary, #111827);
        }
        .burn-card--featured {
          background: #111827;
          border: 2px solid #ff4500;
          color: #ffffff;
          box-shadow: 0 8px 30px rgba(255, 69, 0, 0.15);
        }
        .burn-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .burn-author-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .burn-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          border: 2px solid var(--border, #e5e0d8);
          object-fit: cover;
        }
        .burn-card--featured .burn-avatar {
          border-color: #ff4500;
        }
        .burn-handle {
          font-size: 13px;
          font-weight: 700;
          margin: 0;
        }
        .burn-lang {
          font-size: 11px;
          color: var(--text-muted, #9ca3af);
        }
        .burn-grade-badge {
          font-size: 1.2rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          background: rgba(255, 69, 0, 0.1);
          color: var(--fire, #ff4500);
          border: 1px solid rgba(255, 69, 0, 0.25);
        }
        .burn-tags-row {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .burn-tag-pill {
          background: #dc2626;
          color: #ffffff;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .burn-quote {
          font-size: 12.5px;
          line-height: 1.5;
          margin: 0;
          flex: 1;
        }
        .burn-card--light .burn-quote {
          color: var(--text-secondary, #4b5563);
        }
        .burn-card--featured .burn-quote {
          color: #e5e7eb;
        }
        .burn-card-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid rgba(0,0,0,0.06);
        }
        .burn-card--featured .burn-card-bottom {
          border-top-color: rgba(255,255,255,0.1);
        }
        .burn-score-pill {
          font-size: 11px;
          color: var(--text-muted, #9ca3af);
        }
        .burn-view-link {
          font-size: 11px;
          font-weight: 600;
          color: var(--fire, #ff4500);
          text-decoration: none;
        }
        .burn-view-link:hover {
          text-decoration: underline;
        }

        /* ── 4. Community & Social Banner ── */
        .community-banner-section {
          width: 100%;
          max-width: 1240px;
          padding: 1rem 1.5rem 2.5rem;
        }
        .community-card {
          background: #eef5ff;
          border: 1px solid #bae6fd;
          border-radius: 16px;
          padding: 2.5rem 2rem;
          text-align: center;
          box-shadow: 0 4px 20px rgba(2, 132, 199, 0.05);
        }
        .community-content {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .community-badge {
          font-size: 11px;
          font-weight: 700;
          color: #0284c7;
          letter-spacing: 0.5px;
        }
        .community-title {
          font-size: clamp(1.8rem, 3.5vw, 2.4rem);
          color: #0f172a;
          margin: 0;
          line-height: 1.1;
        }
        .community-desc {
          font-size: 14px;
          color: #475569;
          margin: 0;
          line-height: 1.5;
        }
        .community-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn-community-primary {
          background: #0284c7;
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s;
        }
        .btn-community-primary:hover {
          background: #0369a1;
        }
        .btn-community-secondary {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s;
        }
        .btn-community-secondary:hover {
          border-color: #0284c7;
          color: #0284c7;
        }

        /* ── 5. Pricing Preview Grid ── */
        .pricing-preview-section {
          width: 100%;
          max-width: 1240px;
          padding: 2.5rem 1.5rem;
        }
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          align-items: stretch;
        }
        .pricing-plan-card {
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 14px;
          padding: 2rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        }
        .pricing-plan-card--featured {
          border: 2px solid #ff4500;
          box-shadow: 0 8px 30px rgba(255, 69, 0, 0.12);
        }
        .plan-popular-tag {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          background: #ff4500;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
        }
        .plan-name {
          font-size: 1.6rem;
          margin: 0;
          color: var(--text-primary, #111827);
        }
        .plan-price {
          font-size: 2.4rem;
          font-weight: 700;
          color: var(--text-primary, #111827);
          line-height: 1;
        }
        .price-sub {
          font-size: 12px;
          color: var(--text-muted, #9ca3af);
          font-weight: 400;
        }
        .plan-desc {
          font-size: 12px;
          color: var(--text-secondary, #4b5563);
          margin: 0;
        }
        .plan-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 12px;
          color: var(--text-secondary, #4b5563);
          margin: 0.5rem 0 auto;
          padding: 0;
        }
        .plan-btn {
          margin-top: 1rem;
          padding: 10px;
          text-align: center;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid var(--border, #e5e0d8);
          background: #f8fafc;
          color: var(--text-primary, #111827);
          cursor: pointer;
          transition: all 0.15s;
        }
        .plan-btn:hover {
          border-color: var(--fire, #ff4500);
          color: var(--fire, #ff4500);
        }
        .plan-btn--fire {
          background: var(--fire-grad);
          color: #ffffff;
          border: none;
        }
        .plan-btn--fire:hover {
          opacity: 0.95;
          transform: translateY(-1px);
        }

        /* ── 6. FAQ Section ── */
        .faq-section {
          width: 100%;
          max-width: 1240px;
          padding: 2.5rem 1.5rem 4rem;
        }
        .faq-container {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 3rem;
          align-items: flex-start;
        }
        .faq-left-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .faq-badge {
          font-size: 11px;
          font-weight: 700;
          color: var(--fire, #ff4500);
          letter-spacing: 0.5px;
        }
        .faq-title {
          font-size: clamp(2rem, 3.5vw, 2.8rem);
          color: var(--text-primary, #111827);
          line-height: 1.05;
          margin: 0;
        }
        .faq-sub {
          font-size: 14px;
          color: var(--text-secondary, #4b5563);
          line-height: 1.6;
          margin: 0;
        }
        .faq-contact-link {
          font-size: 12px;
          color: var(--fire, #ff4500);
          text-decoration: none;
          font-weight: 600;
          margin-top: 8px;
        }
        .faq-contact-link:hover {
          text-decoration: underline;
        }
        .faq-right-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .faq-accordion-item {
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 10px;
          padding: 14px 18px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .faq-accordion-item:hover {
          border-color: #cbd5e1;
        }
        .faq-item--open {
          border-color: rgba(255, 69, 0, 0.35);
          box-shadow: 0 4px 14px rgba(255, 69, 0, 0.05);
        }
        .faq-question-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 13.5px;
          font-weight: 600;
          color: var(--text-primary, #111827);
        }
        .faq-chevron {
          font-size: 10px;
          color: var(--text-muted, #9ca3af);
        }
        .faq-a-text {
          font-size: 13px;
          color: var(--text-secondary, #4b5563);
          line-height: 1.6;
          margin: 10px 0 0;
          padding-top: 8px;
          border-top: 1px solid #f1f5f9;
        }

        /* ── Responsive Adaptations ── */
        @media (max-width: 900px) {
          .mobile-tab-switch {
            display: flex;
          }
          .col--hidden-mobile {
            display: none !important;
          }
          .hero-container {
            grid-template-columns: 1fr;
            gap: 1.75rem;
          }
          .recruiter-mobile-panel {
            display: block;
          }
          .burns-grid, .pricing-grid {
            grid-template-columns: 1fr;
          }
          .faq-container {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
        }
      `}</style>
    </main>
  );
}
