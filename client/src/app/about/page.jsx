import Link from "next/link";
import Breadcrumb from "@/components/Breadcrumb";
import "./about.css";
import { jsonLdString } from '@/utils/jsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gitroast.dev";

export const metadata = {
  title: "About GitRoast — Public code, useful satire",
  description:
    "How GitRoast reads public GitHub evidence, scores it transparently, and turns patterns into shareable, useful satire.",
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
    title: "About GitRoast — How scoring works",
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
    title: "About GitRoast — How it works",
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
    a: "We extract statistical signals from your GitHub profile (commit frequencies, star-to-repo ratios, commit message patterns, language distributions, and graveyard streaks) and pass this structured snapshot to Google Gemini AI, which writes the roast from the evidence. Humor never changes your score.",
  },
  {
    q: "What if Gemini AI or GitHub API is down?",
    a: "GitRoast operates on a zero-crash, defensive programming philosophy. If the Gemini AI API experiences high load or rate limits, our deterministic rule-based roast engine immediately takes over without failing the request.",
  },
  {
    q: "How can I add the GitRoast badge to my GitHub profile README?",
    a: "Your result page and dashboard have a one-click badge generator. Choose a Card or Shield style, copy the Markdown, and paste it into your profile README.md. The badge shows your latest score and links back to your public history.",
  },
  {
    q: "How do I remove or re-roast my profile?",
    a: "Roast snapshots are refreshed whenever you re-roast. If you want a specific roast removed or have feedback, reach out through our Contact page.",
  },
];

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(aboutJsonLd) }} />
      <main className="ab">
        <div className="gr-page ab-body">
          <Breadcrumb items={[{ label: "Home", href:"/" }, { label: "About" }]} />

          <header className="ab-head">
            <p className="gr-eyebrow">Mission and architecture</p>
            <h1 className="gr-h1">Humbling developers, one commit at a time.</h1>
            <p className="gr-lede">GitRoast is the comedy forensic lab for developers. We turn public GitHub activity — and inactivity — into entertaining, evidence-backed roasts.</p>
          </header>

          <section className="gr-card ab-sec" aria-labelledby="ab-phil">
            <h2 id="ab-phil" className="gr-h3">The philosophy</h2>
            <p>Developer portfolios are full of buzzwords: &ldquo;Passionate 10x Architect,&rdquo; &ldquo;Full-Stack Evangelist,&rdquo; &ldquo;AI Pioneer.&rdquo; GitHub, however, does not lie. Your git log knows you spent six hours debugging a missing semicolon, and remembers the repository named <code className="ab-code">nextjs-billion-dollar-startup</code> that was abandoned after two commits on a Sunday afternoon.</p>
            <p>GitRoast exists to celebrate that messy, human reality with sharp wit and deep respect for the craft.</p>
          </section>

          <section className="ab-sec" aria-labelledby="ab-how">
            <h2 id="ab-how" className="gr-h2">How it works</h2>
            <div className="ab-grid ab-grid--3">
              {[["01", "Forensic extraction", "We query the GitHub API for your public repositories, recent push dates, languages, stars and commit message hygiene."],
                ["02", "Transparent scoring", "A deterministic engine computes a 0–100 score from public signals. Humor never changes the number."],
                ["03", "AI synthesis", "Google Gemini writes the roast from your computed data and your chosen intensity and persona."]].map(([n, t, d], i) => (
                <article key={n} className={`gr-card${i === 1 ? " gr-card--dark" : ""}`}><span className="gr-eyebrow">{n}</span><h3 className="ab-h3">{t}</h3><p className="ab-p">{d}</p></article>
              ))}
            </div>
          </section>

          <section id="methodology" className="gr-card gr-card--blue ab-sec" aria-labelledby="ab-meth">
            <h2 id="ab-meth" className="gr-h3">Methodology</h2>
            <p>Every score links to the public signal, time window and weight behind it, and we show uncertainty when the evidence is thin.</p>
            <ul className="ab-list">
              <li><b>Signals:</b> public repositories and maintenance, stars, README presence, commit message quality, and public pull-request and review activity from the last 12 months.</li>
              <li><b>Score anatomy:</b> project depth, consistency, collaboration and documentation, each shown with its value on the result page.</li>
              <li><b>Sparse evidence:</b> a signal without enough public data is labeled &ldquo;insufficient evidence&rdquo; and left out. It is never penalized by assumption, because private and internal work is invisible to us.</li>
              <li><b>Roast versus evidence:</b> playful roast copy never appears in recruiter talent evidence, and humor does not affect any score.</li>
              <li><b>Versioning:</b> recruiter evidence uses a versioned model and shows its sources and weights.</li>
            </ul>
          </section>

          <section id="privacy" className="gr-card gr-card--mint ab-sec" aria-labelledby="ab-priv">
            <h2 id="ab-priv" className="gr-h3">Privacy and responsible use</h2>
            <ul className="ab-list">
              <li>Public data only. We do not infer age, gender, ethnicity, health, location or private employment data.</li>
              <li>Ghost Mode hides you from discovery, the Wall of Shame, battles and recruiter search at any time.</li>
              <li>You can ask us to remove a public roast page without a paid plan: <Link href="/contact" className="rc-link">contact us</Link>.</li>
              <li>Rankings exclude identity, geography, follower count and private activity.</li>
              <li>Recruiter evidence supports human review; it is not a hiring recommendation.</li>
            </ul>
          </section>

          <section className="gr-card ab-sec" aria-labelledby="ab-tiers">
            <h2 id="ab-tiers" className="gr-h3">The scoring guide</h2>
            <p className="gr-help">How the score maps to grades:</p>
            <div className="ab-tiers">
              {SCORING_TIERS.map((tier) => (
                <div key={tier.grade} className="ab-tier">
                  <b className="ab-tier__g">Grade {tier.grade}</b>
                  <span className="gr-mono ab-tier__s">{tier.score} pts</span>
                  <p className="ab-tier__l">{tier.label}</p>
                  <p className="ab-p">{tier.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="ab-sec" aria-labelledby="ab-arsenal">
            <h2 id="ab-arsenal" className="gr-h2">The arsenal</h2>
            <div className="ab-grid ab-grid--2">
              {[["Profile roast", "Single developer analysis with Warm-up, Crispy and Pro Nuclear intensity and a choice of voices."],
                ["Developer battles", "Head-to-head comparison on public evidence. Friendly rivalry, zero dunking down."],
                ["Wall of Shame", "A public, opt-out board of roasted profiles ranked on balanced evidence."],
                ["Shame certificate", "A shareable certificate with a QR code for framing or posting."]].map(([t, d]) => (
                <article key={t} className="gr-card"><h3 className="ab-h3">{t}</h3><p className="ab-p">{d}</p></article>
              ))}
            </div>
          </section>

          <section className="gr-card gr-card--gold ab-sec" aria-labelledby="ab-badges">
            <h2 id="ab-badges" className="gr-h3">README profile badges</h2>
            <p>Wear your roast like a badge of honor. GitRoast generates live SVG badges you can embed in your profile or repository <code className="ab-code">README.md</code>.</p>
            <div className="ab-grid ab-grid--2">
              <div><b>Card style (recommended)</b><p className="ab-p">380×112 ink card with the GitRoast mark, score, grade and a quote.</p>
                <code className="ab-block gr-mono">[![GitRoast Score](https://gitroast.dev/api/badge/your-username)](https://gitroast.dev/history/your-username)</code></div>
              <div><b>Shield style</b><p className="ab-p">Compact pill: GitRoast, score and intensity.</p>
                <code className="ab-block gr-mono">[![GitRoast Score](https://gitroast.dev/api/badge/your-username?style=shield)](https://gitroast.dev/history/your-username)</code></div>
            </div>
            <p className="gr-help">Tip: copy your personalized badge in one click from your result page or dashboard.</p>
          </section>

          <section className="ab-sec" aria-labelledby="ab-faq">
            <h2 id="ab-faq" className="gr-h2">Frequently asked questions</h2>
            <div className="ab-faq">
              {FAQS.map((faq, i) => (
                <details key={i} className="ab-faq__item">
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section className="gr-card gr-card--dark ab-cta">
            <h2 className="gr-h2 ab-cta__h">Ready to get humbled?</h2>
            <p className="ab-cta__p">Enter your GitHub handle and see what your public code says about you.</p>
            <div className="ab-cta__row">
              <Link href="/" className="gr-btn gr-btn--primary">Roast your GitHub</Link>
              <Link href="/battle" className="gr-btn gr-btn--outline">Start a battle</Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
