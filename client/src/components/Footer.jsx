'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const year = new Date().getFullYear()
  const pathname = usePathname() || ''

  function isActive(href) {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

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
          <Link
            href="/leaderboard"
            className={`footer-link ${isActive('/leaderboard') ? 'footer-link--active' : ''}`}
          >
            Wall of Shame
          </Link>
          <Link
            href="/battle"
            className={`footer-link ${isActive('/battle') ? 'footer-link--active' : ''}`}
          >
            Battle
          </Link>
          <Link
            href="/universe"
            className={`footer-link ${isActive('/universe') ? 'footer-link--active' : ''}`}
          >
            3D Universe
          </Link>
          <Link
            href="/pricing"
            className={`footer-link ${isActive('/pricing') ? 'footer-link--active' : ''}`}
          >
            Pricing
          </Link>
          <Link
            href="/dashboard"
            className={`footer-link ${isActive('/dashboard') ? 'footer-link--active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            href="/about"
            className={`footer-link ${isActive('/about') ? 'footer-link--active' : ''}`}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={`footer-link ${isActive('/contact') ? 'footer-link--active' : ''}`}
          >
            Contact
          </Link>
          <a
            href="/sitemap.xml"
            className="footer-link"
            target="_blank"
            rel="noopener noreferrer"
            title="Dynamic XML Sitemap"
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