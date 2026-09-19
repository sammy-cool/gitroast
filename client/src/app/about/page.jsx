// ============================================================
// GITROAST — About Page
// ============================================================
// WHAT: Explains the GitRoast mission, forensics engine, scoring
//       tiers, architecture, and developer FAQ.
// WHY: Builds trust, boosts SEO, gives context to the comedy,
//      and educates developers on how we evaluate their code.
// ============================================================

import Link from "next/link";

export const metadata = {
  title: "About GitRoast 🔥 — The Brutal GitHub Code Roast Machine",
  description:
    "Learn how GitRoast analyzes your GitHub profile, commit habits, repo graveyards, and stack choices to generate savagely accurate developer roasts.",
  openGraph: {
    title: "About GitRoast 🔥 — How It Works & Scoring Guide",
    description:
      "Deep dive into the GitRoast forensic analysis engine, AI prompts, and scoring tiers.",
    type: "website",
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
    q: "How do I remove or re-roast my profile?",
    a: "Roast snapshots are refreshed whenever you re-roast. If you want a specific roast removed or have feedback, reach out through our Contact page.",
  },
];

export default function AboutPage() {
  return (
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

      {/* ── Hero ── */}
      <header className="about-hero">
        <span className="badge font-mono">MISSION & ARCHITECTURE</span>
        <h1 className="font-display hero-title text-fire">
          HUMBLING DEVELOPERS, ONE COMMIT AT A TIME
        </h1>
        <p className="hero-lead font-mono">
          GitRoast is the comedy forensic lab for developers. We turn your
          GitHub activity—and inactivity—into savagely entertaining roasts.
        </p>
      </header>

      {/* ── Philosophy & Story ── */}
      <section className="card content-card">
        <h2 className="font-display section-title text-fire">THE PHILOSOPHY</h2>
        <p className="section-text">
          Developer portfolios on LinkedIn are full of buzzwords: &ldquo;Passionate
          10x Architect,&rdquo; &ldquo;Full-Stack Evangelist,&rdquo; and &ldquo;AI Pioneer.&rdquo;
        </p>
        <p className="section-text">
          GitHub, however, does not lie. Your git log knows you spent six hours
          debugging a missing semicolon. Your commit history remembers the repo
          named <code className="code-inline">nextjs-billion-dollar-startup</code>{" "}
          that was abandoned after 2 commits on a Sunday afternoon.
        </p>
        <p className="section-text">
          GitRoast exists to celebrate that messy, human reality with sharp
          wit, brutal accuracy, and deep respect for the craft of coding.
        </p>
      </section>

      {/* ── How it works pipeline ── */}
      <section className="card content-card">
        <h2 className="font-display section-title text-fire">HOW IT WORKS</h2>
        <div className="pipeline-grid">
          <div className="pipeline-step">
            <span className="step-num font-mono">01</span>
            <h3 className="step-title font-display">FORENSIC EXTRACTION</h3>
            <p className="step-desc font-mono">
              We query the GitHub REST API for your repos, recent push dates,
              language breakdowns, star counts, and commit message hygiene.
            </p>
          </div>
          <div className="pipeline-step">
            <span className="step-num font-mono">02</span>
            <h3 className="step-title font-display">SHAME INDEX SCORING</h3>
            <p className="step-desc font-mono">
              Our deterministic scoring engine computes a composite score (0–100)
              penalizing graveyard ratios, low stars, and abandoned experiments.
            </p>
          </div>
          <div className="pipeline-step">
            <span className="step-num font-mono">03</span>
            <h3 className="step-title font-display">AI SYNTHESIS</h3>
            <p className="step-desc font-mono">
              Google Gemini Flash crafts personalized comedic insults based on
              your exact stack tropes (Python indents, Rust borrow checkers, JavaScript framework churn).
            </p>
          </div>
        </div>
      </section>

      {/* ── Scoring Guide ── */}
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
        .code-inline {
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
          font-family: var(--font-mono, monospace);
          font-size: 12px;
          color: var(--fire-warm);
        }

        .pipeline-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .pipeline-step {
          background: #0d0d0d;
          border: 1px solid var(--border);
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
          background: #0d0d0d;
          border: 1px solid var(--border);
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
          background: #0d0d0d;
          border: 1px solid var(--border);
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
          background: linear-gradient(135deg, #120800 0%, #0c0c0c 100%);
          border-color: rgba(255, 69, 0, 0.35);
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
  );
}
