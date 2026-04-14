'use client'

// WHY no useRouter here:
//   Next.js prerenderes /_not-found at build time
//   useRouter requires router context which doesn't exist
//   during static prerendering → TypeError: Cannot read
//   properties of undefined (reading '$$typeof')
//   Fix: use plain <a href> tags — work in all contexts

export default function NotFound() {
  return (
    <main className="nf-page">

      <div className="nf-glow" />

      <p className="font-display nf-logo text-fire">GITROAST 🔥</p>

      <div className="nf-card card">

        <p className="font-display nf-code text-fire">404</p>

        <p className="font-display nf-title">
          Page Not Found
        </p>

        <p className="font-mono nf-roast">
          &ldquo;Even this URL has more abandoned commits than
          your actual repos. At least it tried.&rdquo;
        </p>

        <div className="nf-actions">
          {/* WHY <a href> not router.push:
              prerender-safe — no router context needed
              same navigation behaviour in production */}
          <a href="/" className="btn btn-primary nf-btn">
            🔥 Roast Someone Instead
          </a>
          <a href="/leaderboard" className="btn btn-ghost nf-btn-ghost">
            🏆 Wall of Shame
          </a>
        </div>

      </div>

      <style jsx>{`
        .nf-page {
          min-height:      100vh;
          display:         flex;
          flex-direction:  column;
          align-items:     center;
          justify-content: center;
          padding:         2rem 1rem;
          gap:             1.5rem;
          position:        relative;
          overflow:        hidden;
        }
        .nf-glow {
          position:       absolute;
          inset:          0;
          background:     radial-gradient(
            ellipse 60% 40% at 50% 100%,
            rgba(255, 69, 0, 0.15) 0%,
            transparent 100%
          );
          pointer-events: none;
        }
        .nf-logo { font-size: 22px; }
        .nf-card {
          width:           100%;
          max-width:       480px;
          padding:         2.5rem 2rem;
          display:         flex;
          flex-direction:  column;
          align-items:     center;
          gap:             1.25rem;
          text-align:      center;
        }
        .nf-code  { font-size: 96px; line-height: 1; }
        .nf-title { font-size: 28px; color: var(--text-primary); }
        .nf-roast {
          font-size:   13px;
          font-style:  italic;
          color:       var(--text-secondary);
          line-height: 1.7;
          padding:     0 1rem;
          border-left: 2px solid var(--fire);
          text-align:  left;
        }
        .nf-actions {
          display:        flex;
          flex-direction: column;
          gap:            10px;
          width:          100%;
          margin-top:     0.5rem;
        }
        .nf-btn       { width: 100%; padding: 13px; font-size: 15px; text-align: center; }
        .nf-btn-ghost { width: 100%; text-align: center; }
      `}</style>
    </main>
  )
}