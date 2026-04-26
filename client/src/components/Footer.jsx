// WHY no 'use client': Footer has no state, no hooks
//     pure server component — renders faster
//     BUT if you add <style jsx> so needs 'use client'

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
            href="mailto:priyanshu.alt191@gmail.com"
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

    </footer>
  )
}