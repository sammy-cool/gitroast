// ============================================================
// GITROAST — About Page
// ============================================================
// WHAT: Explains the GitRoast mission, forensics engine, scoring
//       tiers, architecture, and developer FAQ.
// WHY: Builds trust, boosts SEO, gives context to the comedy,
//      and educates developers on how we evaluate their code.
// ============================================================

import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gitroast.dev";

export const metadata = {
  title: "About GitRoast 🔥 — The Brutal GitHub Code Roast Machine",
  description:
    "Learn how GitRoast analyzes your GitHub profile, commit habits, repo graveyards, and stack choices to generate savagely accurate developer roasts.",
  keywords: [
    "about gitroast",
    "how gitroast works",
    "github audit tool",
    "github profile analysis",
    "code roasting engine",
  ],
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
  openGraph: {
    title: "About GitRoast 🔥 — How It Works & Scoring Guide",
    description:
      "Deep dive into the GitRoast forensic analysis engine, AI prompts, and scoring tiers.",
    url: `${SITE_URL}/about`,
    siteName: "GitRoast",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "About GitRoast Philosophy and Architecture",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About GitRoast 🔥 — How It Works",
    description: "Deep dive into the GitRoast forensic analysis engine.",
    images: ["/og-default.png"],
    creator: "@gitroast",
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About GitRoast",
  url: `${SITE_URL}/about`,
  description:
    "Mission, forensics engine, scoring tiers, and philosophy behind GitRoast.",
  mainEntity: {
    "@type": "Organization",
    name: "GitRoast",
    url: SITE_URL,
    logo: `${SITE_URL}/apple-touch-icon.png`,
    description: "Developer comedy and code forensics platform.",
  },
};

const SCORING_TIERS = [
  {
    grade: "S+ / A",
    score: "70 – 100",
    label: "Suspiciously Competent",
    color: "var(--good)",
    desc: "Active commits, clean READMEs, reasonable test coverage. We had to dig through your 2021 forks just to find something embarrassing.",
  },
  {
    grade: "B / C",
    score: "40 – 69",
    label: "Technically a Developer",
    color: "var(--warn)",
    desc: "You know Git, but your commit messages are 'wip', 'fix bug', and 'asdf'. Enthusiastic starts followed by abandoned repos after day 3.",
  },
  {
    grade: "D / F",
    score: "0 – 39",
    label: "Certified Disaster",
    color: "var(--bad)",
    desc: "A sprawling digital graveyard of todo apps, half-baked tutorial clones, 0 stars, and commits pushed exclusively at 3:17 AM.",
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
  {
    q: "How do I remove or re-roast my profile?",
    a: "Roast snapshots are refreshed whenever you re-roast. If you want a specific roast removed or have feedback, reach out through our Contact page.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <main className="about-page">
      <div className="about-glow" />

      {/* ── Top Navigation ── */}
      <nav className="about-nav">
        <Link href="/" className="font-display nav-logo text-fire" title="GitRoast Home">
          GITROAST 🔥
        </Link>
        <div className="nav-links">
          <Link href="/leaderboard" className="btn btn-ghost nav-btn">
            🏆 Wall of Shame
          </Link>
          <Link href="/" className="btn btn-ghost nav-btn">
            ← Home
          </Link>
        </div>
      </nav>

      {/* ── Breadcrumb ── */}
      <div className="breadcrumb-wrap">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />
      </div>

      {/* ── Hero Matching Approved Mockup ── */}
      <header className="about-hero">
        <h1 className="font-display hero-title">
          ABOUT GITROAST
        </h1>
        <p className="hero-lead font-mono">
          Why we build software that roasts your code with brutal honesty
        </p>
      </header>

      {/* ── The Origin Story (Mockup Matching) ── */}
      <section className="card content-card origin-story-card">
        <h2 className="font-display section-title">The Origin Story</h2>
        <p className="section-text">
          A 3 AM force push into production inspired my first roast. I was inspired to build an automated
          reality check for developers. We said to eliminate artificial sycophancy of traditional tech reviews:
          we are too automated towards false praise.
        </p>
        <p className="section-text">
          This is for authentic human-crafted product design over generic AI visuals and meaningless LinkedIn accolades.
        </p>
      </section>

      {/* ── Engineering Philosophy (Mockup Matching 3 Cards) ── */}
      <section className="philosophy-section">
        <h2 className="font-display philosophy-main-title">Engineering Philosophy</h2>
        <div className="philosophy-grid">
          <div className="card philosophy-card">
            <h3 className="font-display philosophy-card-title">Empirical GitHub Signals</h3>
            <p className="philosophy-card-text">
              Empirical GitHub signals measured and combined to build an automated reality check for developers.
            </p>
          </div>
          <div className="card philosophy-card">
            <h3 className="font-display philosophy-card-title">Zero AI Sycophancy</h3>
            <p className="philosophy-card-text">
              Zero AI sycophancy or fake compliments. Inno-solutions for authentic and honest code reviews.
            </p>
          </div>
          <div className="card philosophy-card">
            <h3 className="font-display philosophy-card-title">Humor with Technical Empathy</h3>
            <p className="philosophy-card-text">
              We are practitioners of humor with technical empathy. Brutal honesty delivered with care.
            </p>
          </div>
        </div>
      </section>

      {/* ── Tech Stack & Architecture (Mockup Matching Pills) ── */}
      <section className="tech-stack-section">
        <h2 className="font-display tech-stack-title">Tech Stack & Architecture</h2>
        <div className="tech-stack-pills">
          <span className="tech-pill font-mono"><span>▲</span> Next.js 16</span>
          <span className="tech-pill font-mono"><span>🟢</span> Node.js</span>
          <span className="tech-pill font-mono"><span>⚡</span> Express</span>
          <span className="tech-pill font-mono"><span>🍃</span> MongoDB</span>
          <span className="tech-pill font-mono"><span>✨</span> Google Gemini</span>
          <span className="tech-pill font-mono"><span>🔴</span> Upstash Redis</span>
          <span className="tech-pill font-mono"><span>📦</span> customizable-toast-notification</span>
        </div>
      </section>

      {/* ── Creator Profile Card (Mockup Matching) ── */}
      <section className="card creator-card">
        <div className="creator-avatar-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://avatars.githubusercontent.com/priyanshuchaudhary?s=160"
            alt="Creator Avatar"
            className="creator-avatar-img"
            crossOrigin="anonymous"
            loading="eager"
          />
        </div>
        <div className="creator-info">
          <h3 className="font-display creator-title">Creator</h3>
          <a
            href="https://github.com/priyanshuchaudhary"
            target="_blank"
            rel="noopener noreferrer"
            className="creator-handle font-mono"
          >
            🐙 github.com/priyanshuchaudhary
          </a>
          <p className="creator-bio">
            Hi! I build developer tools with a focus on code forensics, high-fidelity UI/UX, and authentic comedic reality checks. Made with passion for developers worldwide. 👋
          </p>
        </div>
      </section>

      {/* ── The Scoring Guide ── */}
      <section className="card content-card">
        <h2 className="font-display section-title text-fire">THE SCORING GUIDE</h2>
        <p className="section-sub font-mono">
          How our Shame Authority grades your digital footprint:
        </p>
        <div className="tiers-list">
          {SCORING_TIERS.map((tier) => (
            <div key={tier.grade} className="tier-row">
              <div className="tier-header">
                <span className="tier-grade font-display" style={{ color: tier.color }}>
                  Grade {tier.grade}
                </span>
                <span className="tier-score font-mono">{tier.score} pts</span>
              </div>
              <p className="tier-label font-mono text-fire">{tier.label}</p>
              <p className="tier-desc">{tier.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Breakdown ── */}
      <section className="card content-card">
        <h2 className="font-display section-title text-fire">THE ARSENAL</h2>
        <div className="features-grid">
          <div className="feature-box">
            <div className="feature-icon">🔥</div>
            <h3 className="feature-title font-display">PROFILE ROAST</h3>
            <p className="feature-desc font-mono">
              Single developer analysis with Mild, Savage, and Pro Nuclear intensity modes.
            </p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">⚔️</div>
            <h3 className="feature-title font-display">ROAST BATTLE</h3>
            <p className="feature-desc font-mono">
              Head-to-head developer comparison. See who abandoned more repos and declare the loser.
            </p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">🏆</div>
            <h3 className="feature-title font-display">WALL OF SHAME</h3>
            <p className="feature-desc font-mono">
              Global leaderboard tracking the most roasted GitHub profiles on the planet.
            </p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">📜</div>
            <h3 className="feature-title font-display">SHAME CERTIFICATE</h3>
            <p className="feature-desc font-mono">
              Official verifiable certificate with QR code for framing or sharing on LinkedIn.
            </p>
          </div>
        </div>
      </section>

      {/* ── Badges Section ── */}
      <section className="card content-card">
        <h2 className="font-display section-title text-fire">🛡️ GITHUB README PROFILE BADGES</h2>
        <p className="section-text">
          Wear your roast like a badge of honor! GitRoast generates live, auto-updating SVG badges you can embed directly into your GitHub profile or repository <code className="code-inline">README.md</code>.
        </p>
        <div className="badge-guide-grid">
          <div className="badge-guide-card">
            <h3 className="font-display badge-guide-title">🔥 CARD STYLE (RECOMMENDED)</h3>
            <p className="font-mono badge-guide-sub">Eye-catching 320×78px fiery dark card with avatar, score &amp; grade.</p>
            <code className="code-block font-mono">
              [![GitRoast Score](https://gitroast.dev/api/badge/your-username)](https://gitroast.dev/history/your-username)
            </code>
          </div>
          <div className="badge-guide-card">
            <h3 className="font-display badge-guide-title">🛡️ SHIELD STYLE</h3>
            <p className="font-mono badge-guide-sub">Clean, compact shields.io pill badge matching popular open-source badges.</p>
            <code className="code-block font-mono">
              [![GitRoast Score](https://gitroast.dev/api/badge/your-username?style=shield)](https://gitroast.dev/history/your-username)
            </code>
          </div>
        </div>
        <p className="section-text-sub font-mono">
          💡 Tip: You can also copy your personalized badge with 1 click directly from your roast result card or profile history page!
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="card content-card">
        <h2 className="font-display section-title text-fire">FREQUENTLY ASKED QUESTIONS</h2>
        <div className="faqs-list">
          {FAQS.map((faq, i) => (
            <div key={i} className="faq-item">
              <h3 className="faq-q font-mono text-fire">Q: {faq.q}</h3>
              <p className="faq-a">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <div className="about-cta-card card">
        <h2 className="font-display cta-heading text-fire">READY TO GET HUMBLED?</h2>
        <p className="cta-sub font-mono">
          Enter your GitHub handle and find out what your code really says about you.
        </p>
        <div className="cta-buttons">
          <Link href="/" className="btn btn-primary cta-btn">
            🔥 Roast Your GitHub
          </Link>
          <Link href="/battle" className="btn btn-ghost cta-btn">
            ⚔️ Start a Roast Battle
          </Link>
        </div>
      </div>

      <style>{`
        .about-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem 7rem;
          gap: 1.75rem;
          max-width: 780px;
          margin: 0 auto;
          position: relative;
          color: var(--text-primary);
        }

        .about-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 70% 35% at 50% 0%,
            rgba(255, 69, 0, 0.12) 0%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 0;
        }

        .about-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        .nav-logo {
          font-size: 22px;
          text-decoration: none;
          letter-spacing: 0.5px;
        }
        .nav-links {
          display: flex;
          gap: 8px;
        }
        .nav-btn {
          font-size: 13px;
          text-decoration: none;
        }
        .breadcrumb-wrap {
          width: 100%;
          position: relative;
          z-index: 1;
          margin-top: -0.5rem;
        }

        .about-hero {
          text-align: center;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          margin-top: 0.5rem;
        }
        .badge {
          font-size: 10px;
          letter-spacing: 2px;
          padding: 3px 10px;
          background: rgba(255, 69, 0, 0.12);
          border: 1px solid rgba(255, 69, 0, 0.28);
          border-radius: var(--radius-sm);
          color: var(--fire);
        }
        .hero-title {
          font-size: clamp(34px, 8vw, 54px);
          line-height: 1.05;
          letter-spacing: 0.5px;
        }
        .hero-lead {
          max-width: 600px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .content-card {
          width: 100%;
          padding: 1.75rem 2rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: relative;
          z-index: 1;
        }

        .section-title {
          font-size: 24px;
          letter-spacing: 0.5px;
        }
        .section-sub {
          font-size: 12px;
          color: var(--text-secondary);
          margin-top: -6px;
        }
        .section-text {
          font-size: 14px;
          line-height: 1.7;
          color: var(--text-secondary);
        }

        /* ── Origin Story Card ── */
        .origin-story-card {
          background: #FEF9F3;
          border: 1px solid #FED7AA;
          border-radius: var(--radius-lg);
        }

        /* ── Philosophy Grid ── */
        .philosophy-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .philosophy-main-title {
          font-size: 26px;
          color: var(--text-primary);
        }
        .philosophy-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1rem;
        }
        .philosophy-card {
          padding: 1.5rem;
          background: #FEFBF6;
          border: 1px solid #FDE68A;
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .philosophy-card-title {
          font-size: 18px;
          color: var(--text-primary);
        }
        .philosophy-card-text {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* ── Tech Stack Pills ── */
        .tech-stack-section {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tech-stack-title {
          font-size: 24px;
          color: var(--text-primary);
        }
        .tech-stack-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .tech-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #FFFFFF;
          border: 1px solid var(--border);
          border-radius: 9999px;
          font-size: 13px;
          color: var(--text-primary);
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }

        /* ── Creator Profile Card ── */
        .creator-card {
          width: 100%;
          padding: 1.5rem 1.75rem;
          background: #FEFBF6;
          border: 1px solid #FDE68A;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .creator-avatar-wrap {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid #F97316;
        }
        .creator-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .creator-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .creator-title {
          font-size: 22px;
          color: var(--text-primary);
          margin: 0;
        }
        .creator-handle {
          font-size: 13px;
          color: #EA580C;
          text-decoration: none;
          font-weight: 600;
        }
        .creator-handle:hover {
          text-decoration: underline;
        }
        .creator-bio {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.55;
          margin: 4px 0 0;
        }
        @media (max-width: 600px) {
          .creator-card {
            flex-direction: column;
            text-align: center;
          }
        }

        .code-inline {
          background: var(--bg-muted, #f1f5f9);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          color: var(--fire-warm);
        }

        /*
          ── WHAT: ──────────────────────────────────────────────────────────
          Project Luminous step cards, tier rows, and feature boxes.
          ── WHY: ───────────────────────────────────────────────────────────
          Replaces hardcoded #0d0d0d and #050505 with light elevated card tokens.
          ── WHERE & WHEN TO USE: ───────────────────────────────────────────
          Technical pipeline and methodology section cards on the About page.
          ── USE CASES: ─────────────────────────────────────────────────────
          Explaining GitHub AST ingestion, heuristics, and rubric matrix.
          ── WHEN NOT TO USE: ───────────────────────────────────────────────
          Non-card surfaces.
        */
        .pipeline-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .pipeline-step {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          box-shadow: var(--shadow-sm);
          border-radius: var(--radius-md);
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .step-num {
          font-size: 20px;
          font-weight: 700;
          color: var(--fire);
        }
        .step-title {
          font-size: 16px;
          color: var(--text-primary);
        }
        .step-desc {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .tiers-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 0.5rem;
        }
        .tier-row {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          box-shadow: var(--shadow-sm);
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .tier-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .tier-grade {
          font-size: 20px;
          letter-spacing: 0.5px;
        }
        .tier-score {
          font-size: 12px;
          color: var(--text-muted);
        }
        .tier-label {
          font-size: 12px;
          font-weight: 600;
        }
        .tier-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-top: 0.5rem;
        }
        .feature-box {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          box-shadow: var(--shadow-sm);
          border-radius: var(--radius-md);
          padding: 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .feature-icon {
          font-size: 22px;
        }
        .feature-title {
          font-size: 18px;
          color: var(--text-primary);
        }
        .feature-desc {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .badge-guide-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 1rem;
        }
        .badge-guide-card {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          box-shadow: var(--shadow-sm);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .badge-guide-title {
          font-size: 18px;
          color: #ffaa55;
          letter-spacing: 0.5px;
        }
        .badge-guide-sub {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .code-block {
          background: var(--bg-muted, #f8fafc);
          border: 1px solid var(--border, #e2e8f0);
          padding: 8px 10px;
          border-radius: 6px;
          font-size: 11px;
          color: var(--text-primary, #0f172a);
          word-break: break-all;
          margin-top: 4px;
        }
        .section-text-sub {
          font-size: 12px;
          color: #ffb700;
          margin-top: 1rem;
        }

        .faqs-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 0.5rem;
        }
        .faq-item {
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        .faq-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .faq-q {
          font-size: 13px;
          margin-bottom: 6px;
        }
        .faq-a {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .about-cta-card {
          width: 100%;
          text-align: center;
          padding: 2.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          border: 1px solid rgba(255, 69, 0, 0.25);
          box-shadow: var(--shadow-md);
        }
        .cta-heading {
          font-size: clamp(28px, 6vw, 38px);
        }
        .cta-sub {
          font-size: 13px;
          color: var(--text-secondary);
          max-width: 480px;
        }
        .cta-buttons {
          display: flex;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .cta-btn {
          padding: 12px 24px;
          font-size: 14px;
          text-decoration: none;
        }

        @media (max-width: 640px) {
          .pipeline-grid {
            grid-template-columns: 1fr;
          }
          .features-grid {
            grid-template-columns: 1fr;
          }
          .content-card {
            padding: 1.25rem 1rem;
          }
          .cta-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </main>
    </>
  );
}
