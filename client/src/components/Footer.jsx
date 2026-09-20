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
          <Link href="/battle" className="footer-link">
            Battle
          </Link>
          <Link href="/pricing" className="footer-link">
            Pricing
          </Link>
          <Link href="/about" className="footer-link">
            About
          </Link>
          <Link href="/contact" className="footer-link">
            Contact
          </Link>
          <a
            href="/sitemap.xml"
            className="footer-link"
            target="_blank"
            rel="noopener noreferrer"
            title="XML Sitemap"
          >
            Sitemap
          </a>
        </div>

        {/* Copyright & reCAPTCHA */}
        <div className="footer-meta">
          <p className="footer-copy">
            © {year} GitRoast · All your repos are belong to us
          </p>
          <span className="footer-recaptcha font-mono">
            Protected by reCAPTCHA (
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-legal-link"
            >
              Privacy
            </a>
            {" · "}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-legal-link"
            >
              Terms
            </a>
            )
          </span>
        </div>

      </div>

    </footer>
  )
}