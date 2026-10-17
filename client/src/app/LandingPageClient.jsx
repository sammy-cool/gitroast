"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { toast, notify } from "@/utils/toast";
import { WELCOME_CONSENT_KEY } from "@/utils/welcomeConstants";
import RateLimitBanner from "@/components/RateLimitBanner";
import { playClick, playFireSizzle } from "@/utils/soundFX";
import { useAuth } from "@/context/AuthContext";
import { getRoastStats, checkHealth, getRoastOfTheDay } from "@/services/roastService";
import { INTENSITIES, normalizeIntensity, normalizePersona } from "@/utils/vocab";
import RoastLauncher from "@/components/home/RoastLauncher";
import LiveGrillBand from "@/components/home/LiveGrillBand";
import PlansSection from "@/components/home/PlansSection";
import Faq from "@/components/home/Faq";
import "./home.css";

const ProModal = dynamic(() => import("@/components/ProModal"), { ssr: false });
const WelcomeConsentModal = dynamic(() => import("@/components/WelcomeConsentModal"), { ssr: false });

const RECRUIT_MODEL_VERSION = "v1.1"

const STEPS = [
  ["01", "Choose the heat", "Pick an intensity and a voice. Nuclear is optional; clarity is not."],
  ["02", "We read the public evidence", "Commits, repositories, cadence and collaboration signals — dated and sourced."],
  ["03", "Share the pain", "Export a card, add a README badge, compare history or keep it private."],
];

const PLAY = [
  ["Wall of Shame", "Public rankings, lovingly embarrassing.", "See the leaderboard", "/leaderboard"],
  ["Developer Battles", "Settle a rivalry with public evidence.", "Start a battle", "/battle"],
  ["Repository Universe", "Orbit your codebase in a 3D constellation.", "Enter the universe", "/universe", true],
  ["History", "Watch habits improve — or become lore.", "Open your timeline", "/dashboard"],
];

function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export default function LandingPageClient() {
  const { user, loginWithGitHub, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showProModal, setShowProModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [totalRoasts, setTotalRoasts] = useState(null);
  const [dailyRoast, setDailyRoast] = useState(null);
  const [serverStatus, setServerStatus] = useState("checking");
  const [intensity, setIntensity] = useState(() => normalizeIntensity(readSession("gitroast_intensity")));
  const [selectedPersona, setSelectedPersona] = useState(() => {
    const saved = readSession("gitroast_persona");
    return saved ? normalizePersona(saved) : null;
  });
  const persona = selectedPersona || normalizePersona(user?.customPreferences?.defaultPersona);

  const [rateLimitSecs, setRateLimitSecs] = useState(() => {
    try {
      const rl = readSession("gitroast_rate_limit");
      if (rl) {
        const { retryAfter, setAt } = JSON.parse(rl);
        const remaining = retryAfter - Math.floor((Date.now() - setAt) / 1000);
        if (remaining > 0) return remaining;
        sessionStorage.removeItem("gitroast_rate_limit");
      }
    } catch {
      try { sessionStorage.removeItem("gitroast_rate_limit"); } catch {}
    }
    return null;
  });

  // First-visit consent
  useEffect(() => {
    try {
      if (!localStorage.getItem(WELCOME_CONSENT_KEY)) {
        const t = setTimeout(() => setShowWelcomeModal(true), 350);
        return () => clearTimeout(t);
      }
    } catch {}
  }, []);

  // Backend health (drives the "System healthy" status)
  useEffect(() => {
    const run = async () => setServerStatus((await checkHealth()) ? "online" : "offline");
    run();
    const t = setInterval(run, 30000);
    return () => clearInterval(t);
  }, []);

  // One calm sign-in nudge per session
  useEffect(() => {
    if (authLoading || user || showWelcomeModal) return;
    try {
      if (sessionStorage.getItem("gitroast_login_broadcast") || !localStorage.getItem(WELCOME_CONSENT_KEY)) return;
    } catch { return; }
    const t = setTimeout(() => {
      try {
        if (sessionStorage.getItem("gitroast_login_broadcast")) return;
        sessionStorage.setItem("gitroast_login_broadcast", "1");
      } catch {}
      toast.info("Sign in with GitHub for a higher request quota", {
        description: "Public requests can be throttled during busy hours.",
        action: { label: "Sign in", onClick: loginWithGitHub },
        duration: 8000,
      });
    }, 5000);
    return () => clearTimeout(t);
  }, [authLoading, user, loginWithGitHub, showWelcomeModal]);

  useEffect(() => {
    getRoastStats().then((n) => n > 0 && setTotalRoasts(n));
    getRoastOfTheDay().then((r) => r && setDailyRoast(r));
  }, []);

  function handleIntensity(key) {
    playClick();
    const sel = INTENSITIES.find((i) => i.key === key);
    if (sel?.isPro && !user?.isPro) {
      toast.proNudge("Nuclear is a Pro feature", () => setShowProModal(true), "See plans");
      return;
    }
    setIntensity(key);
    try { sessionStorage.setItem("gitroast_intensity", key); } catch {}
  }

  function handlePersona(key) {
    playClick();
    setSelectedPersona(key);
    try { sessionStorage.setItem("gitroast_persona", key); } catch {}
  }

  function handleRoast(target) {
    if (rateLimitSecs > 0) return toast.rateLimit(rateLimitSecs, loginWithGitHub);
    const clean = String(target || "").trim().toLowerCase();
    if (!clean) return notify.profileNotFound({ onAction: () => document.getElementById("roast-target")?.focus() });
    playFireSizzle();
    try {
      sessionStorage.setItem("gitroast_intensity", intensity);
      sessionStorage.setItem("gitroast_persona", persona);
    } catch {}
    if (clean.includes("/")) router.push(`/repo/${clean}`);
    else router.push(`/roast/${clean}?intensity=${intensity}&persona=${persona}`);
  }

  const burns = dailyRoast ? (dailyRoast.reactions?.savage || 0) + (dailyRoast.reactions?.destroyed || 0) + (dailyRoast.reactions?.relatable || 0) : 0;

  return (
    <main className="home">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero__copy">
          {totalRoasts && <span className="gr-pill gr-pill--gold home-hero__pill">Fresh receipts • {totalRoasts.toLocaleString()} roasts</span>}
          <h1 className="gr-h1">Your GitHub has a story. We brought matches.</h1>
          <p className="gr-lede">AI-powered satire grounded in public code. Get the laugh, see the evidence, and leave with a better developer story.</p>
          <ul className="home-hero__facts">
            <li>Public data only</li>
            <li>No password needed</li>
            <li><Link href="/about#methodology">Methodology explained</Link></li>
          </ul>
        </div>
        <div className="home-hero__panel">
          <RoastLauncher
            intensity={intensity}
            persona={persona}
            user={user}
            onIntensity={handleIntensity}
            onPersona={handlePersona}
            onSubmit={handleRoast}
          />
          {rateLimitSecs && (
            <RateLimitBanner
              seconds={rateLimitSecs}
              onExpired={() => {
                setRateLimitSecs(null);
                try { sessionStorage.removeItem("gitroast_rate_limit"); } catch {}
              }}
            />
          )}
        </div>
      </section>

      <LiveGrillBand />

      {/* HOW IT WORKS */}
      <section className="home-section">
        <div className="gr-page">
          <p className="gr-eyebrow">How it works</p>
          <h2 className="gr-h2 home-section__title">The joke lands because the receipts are real.</h2>
          <p className="gr-lede">GitRoast analyzes public GitHub activity, explains what shaped the score, and turns patterns into shareable, useful satire.</p>
          <div className="home-grid home-grid--3">
            {STEPS.map(([n, t, d], i) => (
              <article key={n} className={`gr-card${i === 1 ? " gr-card--dark" : ""}`}>
                <span className="gr-eyebrow">{n}</span>
                <h3 className="gr-h3 home-card__title">{t}</h3>
                <p className="home-card__text">{d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* MORE WAYS TO PLAY */}
      <section className="home-section home-section--tint">
        <div className="gr-page">
          <div className="home-section__row">
            <div>
              <p className="gr-eyebrow">More ways to play</p>
              <h2 className="gr-h2 home-section__title">Roast once. Return for the lore.</h2>
            </div>
            <p className="home-section__aside">Progression without streak anxiety. Competition without punching down.</p>
          </div>
          <div className="home-grid home-grid--4">
            {PLAY.map(([t, d, cta, href, dark]) => (
              <Link key={t} href={href} className={`gr-card gr-card--interactive home-play${dark ? " gr-card--dark" : ""}`}>
                <h3 className="home-play__title">{t}</h3>
                <p className="home-card__text">{d}</p>
                <span className="home-play__cta">{cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ROAST OF THE DAY */}
      {dailyRoast && (
        <section className="home-section">
          <div className="gr-page home-daily">
            <p className="gr-eyebrow">Roast of the day</p>
            <blockquote className="home-daily__quote">&ldquo;{dailyRoast.roastText}&rdquo;</blockquote>
            <p className="home-daily__meta">
              <Link href={`/history/${dailyRoast.username}`}>@{dailyRoast.username}</Link> · Score {dailyRoast.score}/100 · Grade {dailyRoast.grade}
              {burns > 0 && <> · {burns} reactions</>}
            </p>
          </div>
        </section>
      )}

      {/* NO MYSTERY MEAT */}
      <section className="home-section">
        <div className="gr-page home-split">
          <div>
            <p className="gr-eyebrow">Built for laughs, checked like a tool</p>
            <h2 className="gr-h2 home-section__title">No mystery meat scoring.</h2>
            <p className="gr-lede">Every score links to the public signal, time window and weight behind it. We show uncertainty when the evidence is thin.</p>
            <div className="home-actions">
              <Link href="/about#methodology" className="gr-btn gr-btn--outline">Read the methodology</Link>
            </div>
          </div>
          <aside className="gr-card" aria-label="System pulse">
            <p className="gr-eyebrow">System pulse</p>
            <dl className="home-pulse">
              <div><dt>Profiles roasted</dt><dd>{totalRoasts ? totalRoasts.toLocaleString() : "—"}</dd></div>
              <div><dt>Status</dt><dd>{serverStatus === "online" ? "Online" : serverStatus === "offline" ? "Waking up" : "Checking"}</dd></div>
            </dl>
            <ul className="home-pulse__list">
              <li><span className={`home-pulse__dot home-pulse__dot--${serverStatus}`} aria-hidden="true" />GitHub ingestion {serverStatus === "online" ? "healthy" : serverStatus === "offline" ? "recovering" : "checking"}</li>
              <li><span className="home-pulse__dot home-pulse__dot--online" aria-hidden="true" />Scoring {RECRUIT_MODEL_VERSION}</li>
            </ul>
          </aside>
        </div>
      </section>

      {/* RECRUITERS */}
      <section className="home-section home-section--blue">
        <div className="gr-page home-recruit">
          <Image src="/images/recruiter-workspace.png" alt="A hiring team reviewing public project evidence around a table" width={430} height={300} className="home-recruit__img" />
          <div>
            <p className="gr-eyebrow">For recruiters, without the circus</p>
            <h2 className="gr-h2 home-section__title">Turn public work into explainable talent signals.</h2>
            <p className="gr-lede">Role-fit filters, project depth, consistency and collaboration indicators — clearly separated from playful roast content.</p>
            <div className="home-actions">
              <Link href="/auth?role=recruiter" className="gr-btn gr-btn--primary">Explore recruiter workspace</Link>
              <Link href="/about#methodology" className="gr-btn gr-btn--outline">How evidence works</Link>
            </div>
          </div>
        </div>
      </section>

      {/* PLANS */}
      <section className="home-section">
        <div className="gr-page">
          <p className="gr-eyebrow">Plans</p>
          <h2 className="gr-h2 home-section__title">Free to get roasted. Pro to remember everything.</h2>
          <p className="gr-lede">Clear limits, no surprise heat.</p>
          <PlansSection onChoose={() => (user ? router.push("/pricing") : setShowProModal(true))} />
        </div>
      </section>

      {/* FAQ */}
      <section className="home-section">
        <div className="gr-page home-split home-split--faq">
          <div>
            <p className="gr-eyebrow">FAQ / The useful kind</p>
            <h2 className="gr-h2">Before you hand us the matches.</h2>
          </div>
          <Faq />
        </div>
      </section>

      {showProModal && <ProModal onClose={() => setShowProModal(false)} />}
      {showWelcomeModal && <WelcomeConsentModal isOpen={showWelcomeModal} onClose={() => setShowWelcomeModal(false)} />}
    </main>
  );
}
