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
  {
    key: "classic",
    label: "Staff engineer",
    emoji: "👔",
    badge: "Dry, specific",
    desc: "Architecture, systems, edge cases. Deeply disappointed in your lifecycle choices.",
  },
  {
    key: "techbro",
    label: "Chaos intern",
    emoji: "⚡",
    badge: "Fast, feral",
    desc: "Blunt, meme-fluent, hyperactive. Wonders why you pushed secrets to master.",
  },
  {
    key: "shakespearean",
    label: "Historian",
    emoji: "📜",
    badge: "Long memory",
    desc: "Traces every tragic lineage. Speaks like a Victorian coroner reading git log.",
  },
  {
    key: "hinglish",
    label: "Desi Tech Lead",
    emoji: "🇮🇳",
    badge: "Office drama",
    desc: "Authentic Indian tech office comedy. 'Bhai production fat gaya!'",
  },
  {
    key: "ramsay",
    label: "Chef Ramsay",
    emoji: "👨‍🍳",
    badge: "Pure fury",
    desc: "IT'S RAW! Pure kitchen fury applied to software engineering.",
  },
];

const INTENSITIES = [
  {
    key: "mild",
    emoji: "🌶",
    label: "Warm-up",
    description: "Gentle observations. Still burns.",
    color: "#FFB700",
    isPro: false,
  },
  {
    key: "savage",
    emoji: "🔥",
    label: "Crispy",
    description: "Recommended. Real burns, real lessons.",
    color: "#FF6B00",
    isPro: false,
  },
  {
    key: "nuclear",
    emoji: "☢️",
    label: "Nuclear",
    description: "Uncensored existential demolition. Zero mercy.",
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
    q: "What does GitRoast analyze?",
    a: "Public GitHub profile and repository evidence: commit patterns, project depth, documentation, commit timestamps, and visible collaboration signals.",
  },
  {
    q: "Is Nuclear mode abusive?",
    a: "No. Intensity changes theatricality, not safety. We avoid identity, appearance, and protected characteristics, focusing exclusively on code architecture and Git hygiene.",
  },
  {
    q: "Can I remove or hide my profile?",
    a: "Yes. Ghost Mode controls discoverability on the Wall of Shame and Battles, and public-page removal requests are available anytime without a paid plan.",
  },
  {
    q: "Is recruiter scoring the same as a roast?",
    a: "No. Professional recruiter insights use explainable, job-relevant public evidence and never surface playful roast copy or satire.",
  },
  {
    q: "Does GitRoast roast private repositories?",
    a: "Only if you log in and explicitly authorize GitRoast Pro to review your own private repositories. We never inspect or store private code without your direct permission.",
  },
  {
    q: "How does the pricing work?",
    a: "GitRoast has no recurring subscription traps. You can use the free tier forever, or make a simple one-time payment for the Pro Roaster (₹99 / $1.99) or Historian (₹199 / $3.99) pass.",
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
  const [targetTab, setTargetTab] = useState('profile'); // 'profile' | 'repo'
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
          1. HERO SECTION (Figma "Sunlit Editorial Arcade" Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left Column: Bold Headline & Trust Proof */}
          <div className={`hero-copy-col ${mobileTab === 'recruiter' ? 'col--hidden-mobile' : ''}`}>
            <div className="fresh-receipts-badge font-mono">
              <span className="badge-sparkle">✨</span>
              <span>FRESH RECEIPTS · 18,492 ROASTS THIS WEEK</span>
            </div>

            <h1 className="hero-main-title font-serif">
              Your GitHub has a story.
              <br />
              We brought matches.
            </h1>

            <p className="hero-desc font-body">
              AI-powered satire grounded in public code. Get the laugh, see the evidence, and leave with a better developer story.
            </p>

            {/* Figma Trust Indicators */}
            <div className="hero-bullets-row font-mono">
              <span className="hero-bullet-item">
                <span className="bullet-dot" /> Public data only
              </span>
              <span className="hero-bullet-item">
                <span className="bullet-dot" /> No password needed
              </span>
              <span className="hero-bullet-item">
                <span className="bullet-dot" /> Methodology explained
              </span>
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
                ⚔️ Battles
              </Link>
              <Link href="/universe" className="hero-nav-pill hero-nav-pill--universe">
                🌌 Universe
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

          {/* Right Column: Floating Interactive Roast Card (Figma Slices 02-03) */}
          <div className={`hero-card-col ${mobileTab === 'recruiter' ? 'col--hidden-mobile' : ''}`}>
            <div className="floating-roast-card">
              {/* Card Top Pill & Health Telemetry */}
              <div className="card-top-bar font-mono">
                <span className="card-top-label">LIGHT THE GRILL</span>
                <span className="card-status-pill">
                  <span className="card-status-dot" />
                  SYSTEM HEALTHY
                </span>
              </div>

              <h2 className="card-heading font-serif">Who are we roasting?</h2>
              <p className="card-subheading font-body">
                Enter any public handle or repository to generate a full roast dossier.
              </p>

              {/* Segmented Tab Switcher: [ Profile ] | [ Repository ] */}
              <div className="target-tab-switch font-mono">
                <button
                  type="button"
                  className={`target-tab-btn ${targetTab === 'profile' ? 'target-tab-btn--active' : ''}`}
                  onClick={() => setTargetTab('profile')}
                >
                  Profile
                </button>
                <button
                  type="button"
                  className={`target-tab-btn ${targetTab === 'repo' ? 'target-tab-btn--active' : ''}`}
                  onClick={() => setTargetTab('repo')}
                >
                  Repository
                </button>
              </div>

              {/* Form Input + Nested Controls + Submit Button via UsernameInput */}
              <UsernameInput
                onSubmit={handleRoast}
                placeholder={targetTab === 'profile' ? "e.g. torvalds or octavia-labs" : "e.g. facebook/react or torvalds/linux"}
                buttonText={targetTab === 'profile' ? "🔥 Roast this profile →" : "🔥 Roast this repository →"}
              >
                {/* Intensity Selector */}
                <div className="card-control-section">
                  <div className="control-label-row font-mono">
                    <span className="control-label">Intensity</span>
                  </div>
                  <div className="intensity-pills-row font-mono">
                    {INTENSITIES.map((opt) => (
                      <button
                        type="button"
                        key={opt.key}
                        className={`intensity-pill ${intensity === opt.key ? 'intensity-pill--active' : ''} ${opt.isPro ? 'intensity-pill--pro' : ''}`}
                        onClick={() => handleIntensitySelect(opt.key)}
                        title={opt.isPro ? `${opt.label} — Pro only` : opt.description}
                      >
                        <span>{opt.label}</span>
                        {opt.isPro && (
                          <span className={`pill-pro-tag ${user?.isPro ? 'pill-pro-tag--unlocked' : ''}`}>
                            {user?.isPro ? '✓' : 'PRO'}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Persona Selector (3 Primary Figma Cards + Extended Option) */}
                <div className="card-control-section">
                  <div className="control-label-row font-mono">
                    <span className="control-label">Roast persona</span>
                  </div>
                  <div className="persona-cards-grid">
                    {PERSONAS.slice(0, 3).map((p) => (
                      <button
                        type="button"
                        key={p.key}
                        className={`persona-card ${persona === p.key ? 'persona-card--active' : ''}`}
                        onClick={() => handlePersonaSelect(p.key)}
                      >
                        <div className="persona-card-header">
                          <span className="persona-card-icon">{p.emoji}</span>
                          {persona === p.key && <span className="persona-active-dot" />}
                        </div>
                        <div className="persona-card-name font-body">{p.label}</div>
                        <div className="persona-card-badge font-mono">{p.badge}</div>
                      </button>
                    ))}
                  </div>

                  {/* Persona Description Caption */}
                  <p className="persona-caption font-mono">
                    {PERSONAS.find((p) => p.key === persona)?.desc}
                  </p>
                </div>
              </UsernameInput>

              {/* Recruiter Switch Gateway */}
              <div className="recruiter-hint-row">
                <Link href="/recruiter/login" className="recruiter-hint-link font-mono">
                  💼 Looking to hire? Try Candidate X-Ray →
                </Link>
              </div>

              {/* Card Footnote */}
              <div className="card-footnote font-mono">
                By continuing, you confirm this profile is public. Keep it playful.
              </div>
            </div>
          </div>

          {/* Recruiter Viewport Panel (Displayed when recruiter tab active on mobile) */}
          <div className={`recruiter-mobile-panel ${mobileTab === 'dev' ? 'panel--hidden-mobile' : ''}`}>
            <div className="recruiter-panel-card">
              <span className="recruiter-badge font-mono">💼 ENTERPRISE TALENT INTELLIGENCE</span>
              <h2 className="recruiter-hero-title font-serif">
                Turn public work into explainable talent signals.
              </h2>
              <p className="recruiter-hero-desc font-body">
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
            <span>LIVE FROM THE GRILL:</span>
          </div>
          <div className="ticker-content">
            <LiveRoastFeed />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. HOW IT WORKS (Figma Slice 03 Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="how-it-works-section">
        <div className="section-header">
          <span className="section-tag font-mono">HOW IT WORKS</span>
          <h2 className="section-title font-serif">The joke lands because the receipts are real.</h2>
          <p className="section-subtitle font-body">
            GitRoast analyzes public GitHub activity, explains what shaped the score, and turns patterns into shareable, useful satire.
          </p>
        </div>

        <div className="how-grid">
          <div className="how-card how-card--light">
            <span className="how-num font-mono">01</span>
            <h3 className="how-title font-serif">Choose the heat</h3>
            <p className="how-desc font-body">
              Pick an intensity and a voice. Nuclear is optional; clarity is not.
            </p>
          </div>

          <div className="how-card how-card--featured">
            <span className="how-num font-mono">02</span>
            <h3 className="how-title font-serif">We read the public evidence</h3>
            <p className="how-desc font-body">
              Commits, repositories, cadence and collaboration signals—dated and sourced.
            </p>
          </div>

          <div className="how-card how-card--light">
            <span className="how-num font-mono">03</span>
            <h3 className="how-title font-serif">Share the pain</h3>
            <p className="how-desc font-body">
              Export a card, add a README badge, compare history or keep it private.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. MORE WAYS TO PLAY (Figma Slice 03 Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="more-ways-section">
        <div className="section-header">
          <span className="section-tag font-mono">MORE WAYS TO PLAY</span>
          <h2 className="section-title font-serif">Roast once. Return for the lore.</h2>
          <p className="section-subtitle font-body">
            Progression without streak anxiety. Competition without punching down.
          </p>
        </div>

        <div className="ways-grid">
          <Link href="/leaderboard" className="way-card way-card--light">
            <div className="way-icon">🏆</div>
            <h3 className="way-title font-serif">Wall of Shame</h3>
            <p className="way-desc font-body">Public rankings, lovingly embarrassing.</p>
            <span className="way-link font-mono">See the leaderboard →</span>
          </Link>

          <Link href="/battle" className="way-card way-card--light">
            <div className="way-icon">⚔️</div>
            <h3 className="way-title font-serif">Developer Battles</h3>
            <p className="way-desc font-body">Settle a rivalry with public evidence.</p>
            <span className="way-link font-mono">Start a battle →</span>
          </Link>

          <Link href="/universe" className="way-card way-card--dark">
            <div className="way-icon">🌌</div>
            <h3 className="way-title font-serif">Repository Universe</h3>
            <p className="way-desc font-body">Orbit your codebase in a 3D constellation.</p>
            <span className="way-link font-mono">Enter the universe →</span>
          </Link>

          <Link href="/dashboard" className="way-card way-card--light">
            <div className="way-icon">📜</div>
            <h3 className="way-title font-serif">History</h3>
            <p className="way-desc font-body">Watch habits improve—or become lore.</p>
            <span className="way-link font-mono">Open your timeline →</span>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. NO MYSTERY MEAT SCORING (Figma Slice 04 Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="mystery-scoring-section">
        <div className="mystery-container">
          <div className="mystery-left">
            <span className="section-tag font-mono">BUILT FOR LAUGHS, CHECKED LIKE A TOOL</span>
            <h2 className="section-title font-serif">No mystery meat scoring.</h2>
            <p className="section-subtitle font-body">
              Every score links to the public signal, time window and weight behind it. We show uncertainty when the evidence is thin.
            </p>
            <div className="mystery-actions font-mono">
              <Link href="/about" className="btn-mystery-primary">
                Read the methodology
              </Link>
              <Link href="/about" className="btn-mystery-secondary">
                ⚡ System status
              </Link>
            </div>
          </div>

          <div className="mystery-right">
            <div className="system-pulse-card font-mono">
              <div className="pulse-header">
                <span>SYSTEM PULSE / SAMPLE</span>
              </div>
              <div className="pulse-stats-grid">
                <div className="pulse-stat">
                  <div className="pulse-val font-serif">1.28M</div>
                  <div className="pulse-lbl">All-time public analyses</div>
                </div>
                <div className="pulse-stat">
                  <div className="pulse-val font-serif pulse-val--good">99.98%</div>
                  <div className="pulse-lbl">30-day analysis availability</div>
                </div>
              </div>
              <div className="pulse-footer">
                <span className="pulse-dot-item"><span className="pulse-green-dot" /> GitHub ingestion healthy</span>
                <span className="pulse-dot-item"><span className="pulse-blue-dot" /> Scoring v3.2</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. FOR RECRUITERS BANNER (Figma Slice 04 Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="recruiter-banner-section">
        <div className="recruiter-banner-card">
          <div className="recruiter-banner-content">
            <span className="recruiter-banner-tag font-mono">FOR RECRUITERS, WITHOUT THE CIRCUS</span>
            <h2 className="recruiter-banner-title font-serif">
              Turn public work into explainable talent signals.
            </h2>
            <p className="recruiter-banner-desc font-body">
              Role-fit filters, project depth, consistency and collaboration indicators—clearly separated from playful roast copy.
            </p>
            <div className="recruiter-banner-actions font-mono">
              <Link href="/recruiter/login" className="btn-recruiter-primary">
                Explore recruiter workspace →
              </Link>
              <Link href="/about" className="btn-recruiter-secondary">
                How evidence works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          7. PRICING & PRO OVERVIEW (Figma Slice 04 Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="pricing-preview-section">
        <div className="section-header">
          <span className="section-tag font-mono">PLANS</span>
          <h2 className="section-title font-serif">Free to get roasted. Pro to remember everything.</h2>
          <p className="section-subtitle font-body">
            Clear limits, no surprise heat. Pay once or stay free forever.
          </p>
        </div>

        <div className="pricing-grid">
          {/* Free Tier */}
          <div className="pricing-plan-card">
            <h3 className="plan-name font-mono">Free</h3>
            <div className="plan-price font-serif">$0 <span className="price-sub font-mono">/ per month</span></div>
            <p className="plan-limit font-mono">3 roasts / month</p>
            <p className="plan-desc font-body">Public result · Share card · Community</p>
            <button
              type="button"
              className="plan-btn font-mono"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Start free
            </button>
          </div>

          {/* Pro Roaster (Featured Obsidian Card) */}
          <div className="pricing-plan-card pricing-plan-card--featured">
            <div className="plan-popular-tag font-mono">Most roasted</div>
            <h3 className="plan-name font-mono">Pro Roaster</h3>
            <div className="plan-price font-serif">$9 <span className="price-sub font-mono">/ per month (or ₹99)</span></div>
            <p className="plan-limit font-mono">30 roasts / month</p>
            <p className="plan-desc font-body">History · Personas · Badges · Ghost Mode</p>
            <Link href="/pricing" className="plan-btn plan-btn--fire font-mono">
              Go Pro
            </Link>
          </div>

          {/* Historian Plan */}
          <div className="pricing-plan-card">
            <h3 className="plan-name font-mono">Historian</h3>
            <div className="plan-price font-serif">$19 <span className="price-sub font-mono">/ per month (or ₹199)</span></div>
            <p className="plan-limit font-mono">Unlimited personal history</p>
            <p className="plan-desc font-body">Trend exports · Comparison · Priority analysis</p>
            <Link href="/pricing" className="plan-btn font-mono">
              Choose Historian
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. INTERACTIVE FAQ ACCORDION (Figma Slice 05 Alignment)
          ══════════════════════════════════════════════════════════════ */}
      <section className="faq-section">
        <div className="faq-container">
          <div className="faq-left-col">
            <span className="section-tag font-mono">FAQ / THE USEFUL KIND</span>
            <h2 className="faq-title font-serif">Before you hand us the matches.</h2>
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
                <div className="faq-question-row">
                  <span className="faq-q-text font-serif">{faq.q}</span>
                  <span className="faq-plus-icon font-mono">{openFaq === idx ? '−' : '+'}</span>
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
          background-color: var(--color-paper, #F7F5F0);
          color: var(--color-ink, #171717);
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
          max-width: 1240px;
          margin: 0.75rem 1.25rem 0;
          padding: 8px 16px;
          background: rgba(234, 88, 12, 0.08);
          border: 1px solid rgba(234, 88, 12, 0.25);
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
          background: var(--color-ember, #EA580C);
          color: #ffffff;
          font-weight: 700;
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
        }
        .broadcast-text {
          color: var(--color-ink, #171717);
        }
        .broadcast-login-link {
          background: none;
          border: none;
          padding: 0;
          color: var(--color-ember, #EA580C);
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
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 9999px;
          padding: 4px;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
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
          background: var(--color-ember, #EA580C);
          color: #ffffff;
        }
        .tab-switch-btn--active-recruiter {
          background: #0284c7;
          color: #ffffff;
        }

        /* ── 1. Hero Section (Figma Slices 02-03) ── */
        .hero-section {
          width: 100%;
          max-width: 1240px;
          padding: 2.75rem 1.5rem 2.25rem;
          margin: 0 auto;
        }
        .hero-container {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 3rem;
          align-items: flex-start;
        }

        /* Left Column */
        .hero-copy-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .fresh-receipts-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          align-self: flex-start;
          padding: 5px 14px;
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-secondary, #4b5563);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }
        .badge-sparkle {
          color: var(--color-gold, #F59E0B);
        }
        .hero-main-title {
          font-size: clamp(2.8rem, 5.2vw, 4.4rem);
          line-height: 1.05;
          letter-spacing: -0.5px;
          color: var(--color-ink, #171717);
          margin: 0;
          font-weight: 400;
        }
        .hero-desc {
          font-size: 16.5px;
          color: #475569;
          line-height: 1.6;
          max-width: 560px;
          margin: 0;
        }

        /* Trust Bullet Points */
        .hero-bullets-row {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          font-size: 12px;
          color: #64748b;
        }
        .hero-bullet-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .bullet-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--color-ember, #EA580C);
        }

        /* Quick Exploration Pills */
        .hero-pills-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding-top: 0.5rem;
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
          border-color: var(--color-ember, #EA580C);
          color: var(--color-ember, #EA580C);
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
          max-width: 480px;
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 16px;
          padding: 1.75rem;
          box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.07);
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
          position: relative;
        }
        .card-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .card-top-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }
        .card-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          background: #ebf8f2;
          border: 1px solid #d1fae5;
          border-radius: 9999px;
          font-size: 9.5px;
          font-weight: 700;
          color: #059669;
        }
        .card-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
        }
        .card-heading {
          font-size: 2.1rem;
          line-height: 1.1;
          color: var(--color-ink, #171717);
          margin: 0;
          font-weight: 400;
        }
        .card-subheading {
          font-size: 13px;
          color: #64748b;
          margin: -0.25rem 0 0;
          line-height: 1.5;
        }

        /* Target Tab Switcher */
        .target-tab-switch {
          display: flex;
          background: #f1ede6;
          border-radius: 8px;
          padding: 3px;
          gap: 3px;
        }
        .target-tab-btn {
          flex: 1;
          border: none;
          padding: 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .target-tab-btn--active {
          background: #ffffff;
          color: var(--color-ink, #171717);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        /* Card Form Controls */
        .card-control-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .control-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .control-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        /* Intensity Pills Row */
        .intensity-pills-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .intensity-pill {
          padding: 7px 10px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 600;
          background: #f8fafc;
          border: 1px solid var(--border, #e5e0d8);
          color: var(--text-secondary, #4b5563);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .intensity-pill:hover {
          border-color: var(--color-ember, #EA580C);
        }
        .intensity-pill--active {
          background: rgba(234, 88, 12, 0.08);
          border-color: var(--color-ember, #EA580C);
          color: var(--color-ember, #EA580C);
        }
        .pill-pro-tag {
          font-size: 8.5px;
          padding: 1px 4px;
          border-radius: 3px;
          background: #ef4444;
          color: #ffffff;
        }
        .pill-pro-tag--unlocked {
          background: #10b981;
        }

        /* Persona Cards Grid (Figma 3-card layout) */
        .persona-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .persona-card {
          padding: 10px 8px;
          border-radius: 10px;
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          display: flex;
          flex-direction: column;
          gap: 4px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .persona-card:hover {
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        .persona-card--active {
          background: #fff8f5;
          border-color: var(--color-ember, #EA580C);
        }
        .persona-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .persona-card-icon {
          font-size: 15px;
        }
        .persona-active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--color-ember, #EA580C);
        }
        .persona-card-name {
          font-size: 11.5px;
          font-weight: 700;
          color: var(--color-ink, #171717);
          margin-top: 2px;
          line-height: 1.2;
        }
        .persona-card-badge {
          font-size: 9.5px;
          color: #64748b;
        }
        .persona-caption {
          font-size: 11px;
          color: #64748b;
          margin: 2px 0 0;
          line-height: 1.4;
        }

        .recruiter-hint-row {
          padding-top: 6px;
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
        .card-footnote {
          font-size: 10.5px;
          color: #94a3b8;
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
          font-weight: 400;
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
          background: #171717;
          border-top: 1px solid #262626;
          border-bottom: 1px solid #262626;
          padding: 10px 1.5rem;
          margin: 2rem 0;
        }
        .ticker-inner {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ticker-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-ember, #EA580C);
          white-space: nowrap;
          letter-spacing: 0.5px;
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

        /* ── 3. How It Works (Figma Slice 03) ── */
        .how-it-works-section {
          width: 100%;
          max-width: 1240px;
          padding: 3rem 1.5rem;
        }
        .section-header {
          text-align: left;
          margin-bottom: 2.25rem;
        }
        .section-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-ember, #EA580C);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .section-title {
          font-size: clamp(2.2rem, 4vw, 3rem);
          color: var(--color-ink, #171717);
          margin: 0.35rem 0 0.5rem;
          font-weight: 400;
          line-height: 1.1;
        }
        .section-subtitle {
          font-size: 15px;
          color: #64748b;
          max-width: 680px;
          line-height: 1.6;
          margin: 0;
        }
        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }
        .how-card {
          padding: 2rem;
          border-radius: 14px;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .how-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.07);
        }
        .how-card--light {
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          color: var(--color-ink, #171717);
        }
        .how-card--featured {
          background: #171717;
          border: 1px solid #262626;
          color: #ffffff;
        }
        .how-num {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-ember, #EA580C);
        }
        .how-title {
          font-size: 1.65rem;
          font-weight: 400;
          line-height: 1.2;
          margin: 0;
        }
        .how-desc {
          font-size: 13.5px;
          line-height: 1.6;
          margin: 0;
          color: #64748b;
        }
        .how-card--featured .how-desc {
          color: #94a3b8;
        }

        /* ── 4. More Ways To Play (Figma Slice 03) ── */
        .more-ways-section {
          width: 100%;
          max-width: 1240px;
          padding: 2.5rem 1.5rem;
        }
        .ways-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        .way-card {
          padding: 1.75rem 1.5rem;
          border-radius: 14px;
          text-decoration: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          transition: all 0.2s ease;
        }
        .way-card--light {
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          color: var(--color-ink, #171717);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
        }
        .way-card--light:hover {
          border-color: var(--color-ember, #EA580C);
          transform: translateY(-3px);
        }
        .way-card--dark {
          background: #171717;
          border: 1px solid #262626;
          color: #ffffff;
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
        }
        .way-card--dark:hover {
          border-color: var(--color-ember, #EA580C);
          transform: translateY(-3px);
        }
        .way-icon {
          font-size: 1.75rem;
        }
        .way-title {
          font-size: 1.5rem;
          margin: 0;
          font-weight: 400;
          line-height: 1.2;
        }
        .way-desc {
          font-size: 13px;
          color: #64748b;
          line-height: 1.5;
          margin: 0;
          flex: 1;
        }
        .way-card--dark .way-desc {
          color: #94a3b8;
        }
        .way-link {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-ember, #EA580C);
          margin-top: 4px;
        }

        /* ── 5. No Mystery Meat Scoring (Figma Slice 04) ── */
        .mystery-scoring-section {
          width: 100%;
          max-width: 1240px;
          padding: 3rem 1.5rem;
        }
        .mystery-container {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 3rem;
          align-items: center;
        }
        .mystery-left {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .mystery-actions {
          display: flex;
          gap: 12px;
          margin-top: 0.5rem;
          flex-wrap: wrap;
        }
        .btn-mystery-primary {
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          color: var(--color-ink, #171717);
          padding: 9px 18px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btn-mystery-primary:hover {
          border-color: var(--color-ember, #EA580C);
          color: var(--color-ember, #EA580C);
        }
        .btn-mystery-secondary {
          background: transparent;
          border: none;
          color: var(--color-ember, #EA580C);
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
        }
        .system-pulse-card {
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 14px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
        }
        .pulse-header {
          font-size: 10.5px;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }
        .pulse-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .pulse-val {
          font-size: 2.2rem;
          line-height: 1;
          color: var(--color-ink, #171717);
        }
        .pulse-val--good {
          color: #059669;
        }
        .pulse-lbl {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
        }
        .pulse-footer {
          display: flex;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid #f1ede6;
          font-size: 11px;
          color: #64748b;
        }
        .pulse-dot-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .pulse-green-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
        }
        .pulse-blue-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #0284c7;
        }

        /* ── 6. For Recruiters Banner (Figma Slice 04) ── */
        .recruiter-banner-section {
          width: 100%;
          max-width: 1240px;
          padding: 1.5rem 1.5rem 3rem;
        }
        .recruiter-banner-card {
          background: var(--color-blue, #E0F2FE);
          border: 1px solid #bae6fd;
          border-radius: 16px;
          padding: 3rem 2.5rem;
          box-shadow: 0 4px 20px rgba(2, 132, 199, 0.05);
        }
        .recruiter-banner-content {
          max-width: 720px;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .recruiter-banner-tag {
          font-size: 11px;
          font-weight: 700;
          color: #0284c7;
          letter-spacing: 0.5px;
        }
        .recruiter-banner-title {
          font-size: clamp(2rem, 3.8vw, 2.75rem);
          color: #0f172a;
          margin: 0;
          line-height: 1.1;
          font-weight: 400;
        }
        .recruiter-banner-desc {
          font-size: 15px;
          color: #334155;
          line-height: 1.6;
          margin: 0.25rem 0 0.5rem;
        }
        .recruiter-banner-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .btn-recruiter-primary {
          background: var(--color-ember, #EA580C);
          color: #ffffff;
          padding: 10px 22px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          transition: background 0.15s ease;
        }
        .btn-recruiter-primary:hover {
          background: #c2410c;
        }
        .btn-recruiter-secondary {
          background: #ffffff;
          color: #0f172a;
          border: 1px solid #cbd5e1;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }

        /* ── 7. Pricing Preview Grid (Figma Slice 04) ── */
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
          padding: 2.25rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          position: relative;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
        }
        .pricing-plan-card--featured {
          background: #171717;
          border: 1px solid #262626;
          color: #ffffff;
          box-shadow: 0 10px 36px rgba(0, 0, 0, 0.18);
        }
        .plan-popular-tag {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: var(--color-ember, #EA580C);
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 9999px;
        }
        .plan-name {
          font-size: 1.15rem;
          margin: 0;
          font-weight: 700;
          color: inherit;
        }
        .plan-price {
          font-size: 3rem;
          line-height: 1;
          color: inherit;
          margin: 0.25rem 0;
          font-weight: 400;
        }
        .price-sub {
          font-size: 12px;
          color: #94a3b8;
          font-weight: 400;
        }
        .plan-limit {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-ember, #EA580C);
          margin: 0;
        }
        .plan-desc {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 1rem;
        }
        .pricing-plan-card--featured .plan-desc {
          color: #94a3b8;
        }
        .plan-btn {
          margin-top: auto;
          padding: 11px;
          text-align: center;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          border: 1px solid var(--border, #e5e0d8);
          background: #f8fafc;
          color: var(--color-ink, #171717);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .plan-btn:hover {
          border-color: var(--color-ember, #EA580C);
          color: var(--color-ember, #EA580C);
        }
        .plan-btn--fire {
          background: var(--color-ember, #EA580C);
          color: #ffffff;
          border: none;
        }
        .plan-btn--fire:hover {
          background: #c2410c;
          color: #ffffff;
        }

        /* ── 8. FAQ Section (Figma Slice 05) ── */
        .faq-section {
          width: 100%;
          max-width: 1240px;
          padding: 3rem 1.5rem 4rem;
        }
        .faq-container {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 3.5rem;
          align-items: flex-start;
        }
        .faq-left-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .faq-title {
          font-size: clamp(2.2rem, 3.8vw, 3rem);
          color: var(--color-ink, #171717);
          line-height: 1.05;
          margin: 0;
          font-weight: 400;
        }
        .faq-sub {
          font-size: 14.5px;
          color: #64748b;
          line-height: 1.6;
          margin: 0;
        }
        .faq-contact-link {
          font-size: 12px;
          color: var(--color-ember, #EA580C);
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
          gap: 12px;
        }
        .faq-accordion-item {
          background: #ffffff;
          border: 1px solid var(--border, #e5e0d8);
          border-radius: 10px;
          padding: 16px 20px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .faq-accordion-item:hover {
          border-color: #cbd5e1;
        }
        .faq-item--open {
          border-color: rgba(234, 88, 12, 0.4);
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.05);
        }
        .faq-question-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .faq-q-text {
          font-size: 1.35rem;
          color: var(--color-ink, #171717);
          font-weight: 400;
        }
        .faq-plus-icon {
          font-size: 16px;
          color: var(--color-ember, #EA580C);
          font-weight: 700;
        }
        .faq-a-text {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.6;
          margin: 12px 0 0;
          padding-top: 10px;
          border-top: 1px solid #f1ede6;
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
            gap: 2rem;
          }
          .recruiter-mobile-panel {
            display: block;
          }
          .how-grid, .pricing-grid {
            grid-template-columns: 1fr;
          }
          .ways-grid {
            grid-template-columns: 1fr 1fr;
          }
          .mystery-container {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .faq-container {
            grid-template-columns: 1fr;
            gap: 1.75rem;
          }
        }
        @media (max-width: 600px) {
          .ways-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
