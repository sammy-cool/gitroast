// WHY no 'use client': Footer has no state, no hooks
//     pure server component — renders faster
//     BUT has <style jsx> so needs 'use client'
'use client'

export default function Footer() {
    const year = new Date().getFullYear()

    return (
        <footer className="site-footer font-mono">

            <div className="footer-inner">

                {/* Brand */}
                <div className="footer-brand">
                    <span className="footer-logo">GITROAST 🔥</span>
                    <span className="footer-tagline">
                        Made with 🔥 in India
                    </span>
                </div>

                {/* Links */}
                <div className="footer-links">
                    <a href="/leaderboard" className="footer-link">
                        Wall of Shame
                    </a>
                    <a href="/pricing" className="footer-link">
                        Pricing
                    </a>
                    {/* WHY mailto: simple contact before we have a contact page */}
                    <a
                        href="mailto:hello@gitroast.dev"
                        className="footer-link"
                    >
                        Contact
                    </a>
                </div>

                {/* Copyright */}
                <p className="footer-copy">
                    © {year} GitRoast · All your repos are belong to us
                </p>

            </div>

            <style jsx>{`
        .site-footer {
          position:   fixed;
          bottom:     0;
          left:       0;
          right:      0;
          /* WHY fixed bottom: always visible, doesn't push content */
          background: rgba(7, 7, 7, 0.95);
          border-top: 1px solid var(--border);
          backdrop-filter: blur(8px);
          z-index:    50;
          padding:    10px 1.5rem;
        }
        .footer-inner {
          max-width:       900px;
          margin:          0 auto;
          display:         flex;
          align-items:     center;
          justify-content: space-between;
          gap:             1rem;
          flex-wrap:       wrap;
        }
        .footer-brand {
          display:     flex;
          align-items: center;
          gap:         10px;
        }
        .footer-logo {
          font-size:   13px;
          color:       var(--fire);
          font-weight: 700;
        }
        .footer-tagline {
          font-size: 11px;
          color:     var(--text-muted);
        }
        .footer-links {
          display: flex;
          gap:     1.25rem;
        }
        .footer-link {
          font-size:       11px;
          color:           var(--text-secondary);
          text-decoration: none;
          transition:      color 0.15s;
        }
        .footer-link:hover { color: var(--fire); }
        .footer-copy {
          font-size: 10px;
          color:     var(--text-muted);
        }

        @media (max-width: 540px) {
          .footer-inner    { flex-direction: column; align-items: center; gap: 6px; }
          .footer-tagline  { display: none; }
          .footer-copy     { display: none; }
        }
      `}</style>
        </footer>
    )
}