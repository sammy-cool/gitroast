import Link from 'next/link'

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
          <Link href="/leaderboard" className="footer-link">
            Wall of Shame
          </Link>
          <Link href="/pricing" className="footer-link">
            Pricing
          </Link>
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