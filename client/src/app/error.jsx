'use client'

// WHY 'use client': error.jsx MUST be a client component
//     Next.js App Router requirement — it receives
//     error and reset as props which are client-side

// WHY error.jsx: catches runtime errors in any page/layout
//     without it — any crash = white screen
//     with it — branded error + user can recover

export default function GlobalError({ error, reset }) {
  return (
    <main className="err-page">

      <div className="err-glow" />

      <p className="font-display err-logo text-fire">GITROAST 🔥</p>

      <div className="err-card card">

        <p className="font-display err-title" style={{ color: 'var(--bad)' }}>
          Something Broke
        </p>

        {/* WHY on-brand error message: consistent voice throughout app */}
        <p className="font-mono err-roast">
          &ldquo;Even our error page is more polished
          than your GitHub. Something went wrong on our end.&rdquo;
        </p>

        {/* WHY show error message in dev: helps debugging
            WHY hide in production: don't expose internals */}
        {process.env.NODE_ENV === 'development' && error?.message && (
          <p className="err-dev font-mono">
            {error.message}
          </p>
        )}

        <div className="err-actions">
          {/* WHY reset: Next.js provides this to re-render the segment
              user can recover without full page reload */}
          <button
            className="btn btn-primary err-btn"
            onClick={() => reset()}
          >
            Try Again
          </button>
          <button
            className="btn btn-ghost err-btn-ghost"
            onClick={() => window.location.href = '/'}
          >
            ← Go Home
          </button>
        </div>

      </div>

      <style jsx>{`
        .err-page {
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
        .err-glow {
          position:   absolute;
          inset:      0;
          background: radial-gradient(
            ellipse 60% 40% at 50% 100%,
            rgba(255, 61, 61, 0.1) 0%,
            transparent 100%
          );
          pointer-events: none;
        }
        .err-logo { font-size: 22px; }
        .err-card {
          width:           100%;
          max-width:       480px;
          padding:         2.5rem 2rem;
          display:         flex;
          flex-direction:  column;
          align-items:     center;
          gap:             1.25rem;
          text-align:      center;
          border-color:    var(--bad);
        }
        .err-title { font-size: 32px; line-height: 1; }
        .err-roast {
          font-size:   13px;
          font-style:  italic;
          color:       var(--text-secondary);
          line-height: 1.7;
          padding:     0 1rem;
          border-left: 2px solid var(--bad);
          text-align:  left;
        }
        .err-dev {
          font-size:     11px;
          color:         var(--bad);
          background:    rgba(255, 61, 61, 0.08);
          border:        1px solid rgba(255, 61, 61, 0.2);
          border-radius: var(--radius-sm);
          padding:       8px 12px;
          width:         100%;
          text-align:    left;
          word-break:    break-all;
          line-height:   1.6;
        }
        .err-actions {
          display:        flex;
          flex-direction: column;
          gap:            10px;
          width:          100%;
          margin-top:     0.5rem;
        }
        .err-btn      { width: 100%; padding: 13px; font-size: 15px; }
        .err-btn-ghost{ width: 100%; }
      `}</style>
    </main>
  )
}
