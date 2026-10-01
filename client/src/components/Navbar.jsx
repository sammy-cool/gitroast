'use client';

// ============================================================
// GITROAST — Unified Top Navigation Bar
// ============================================================
// WHAT: Persistent sticky navigation header across all GitRoast views.
//       Renders brand logo, primary exploration links, backend health status,
//       sound effects toggle, recruiter portal gateway, and GitHub authentication.
//
// WHY:
//   - Matches the approved next-generation design mockup (storage/assets/landing_split_mockup_1790869160854.jpg).
//   - Eliminates fragmented, inconsistent per-page sub-navigation.
//   - Gives desktop and mobile users immediate, 1-click access to all core product areas.
//   - Sticky backdrop-filter blur creates an authoritative, modern software feel.
//
// WHERE & WHEN TO USE:
//   Mounted once in client/src/app/layout.jsx directly above page children.
//   Conditionally suppressed on full-screen 3D WebGL scenes (/universe/:username).
//
// USE CASES:
//   - Seamless SPA navigation between Home, Wall of Shame, Battle, Universe, and Pricing.
//   - Checking live Render backend status via pulsing telemetry dot.
//   - Instant access to Recruiter Talent Intelligence portal.
//
// WHEN NOT TO USE:
//   - On distraction-free immersive full-screen 3D scenes where HUD controls occupy viewport top.
// ============================================================

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { checkHealth } from '@/services/roastService';
import SoundToggle from '@/components/SoundToggle';
import GitHubLoginBtn from '@/components/GitHubLoginBtn';

export default function Navbar() {
  const pathname = usePathname() || '';
  const { user } = useAuth();
  const [serverStatus, setServerStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Poll backend health status aligned with Render keep-alive
  useEffect(() => {
    let mounted = true;

    async function probeServer() {
      try {
        const isHealthy = await checkHealth();
        if (mounted) setServerStatus(isHealthy ? 'online' : 'offline');
      } catch {
        if (mounted) setServerStatus('offline');
      }
    }

    probeServer();
    const interval = setInterval(probeServer, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close mobile drawer on route change without cascading renders per React 19 guidelines
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  function isActive(href) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Suppress on full-screen 3D cosmic solar system scene
  if (pathname.startsWith('/universe/') && pathname !== '/universe') {
    return null;
  }

  return (
    <header className="site-navbar font-mono">
      <div className="navbar-container">
        {/* ── Brand Logo & Backend Status ── */}
        <div className="navbar-left">
          <Link href="/" className="navbar-brand" title="GitRoast Home">
            <span className="brand-logo font-display text-fire">GITROAST</span>
            <span className="brand-fire" aria-hidden="true">🔥</span>
          </Link>

          {/* Telemetry Status Indicator */}
          <div
            className={`status-pill status-pill--${serverStatus}`}
            title={`Render Backend Status: ${serverStatus}`}
            role="status"
            aria-live="polite"
          >
            <span className="status-dot" />
            <span className="status-text">
              {serverStatus === 'online'
                ? 'SYSTEMS ONLINE'
                : serverStatus === 'offline'
                ? 'CONNECTING…'
                : 'CHECKING…'}
            </span>
          </div>
        </div>

        {/* ── Desktop Primary Navigation Links ── */}
        <nav className="navbar-links" aria-label="Main Navigation">
          <Link
            href="/leaderboard"
            className={`nav-item ${isActive('/leaderboard') ? 'nav-item--active' : ''}`}
          >
            🏆 Wall of Shame
          </Link>
          <Link
            href="/battle"
            className={`nav-item ${isActive('/battle') ? 'nav-item--active' : ''}`}
          >
            ⚔️ Battle
          </Link>
          <Link
            href="/universe"
            className={`nav-item ${isActive('/universe') ? 'nav-item--active' : ''}`}
          >
            🌌 3D Universe
          </Link>
          <Link
            href="/pricing"
            className={`nav-item ${isActive('/pricing') ? 'nav-item--active' : ''}`}
          >
            ⚡ Pricing
          </Link>
          <Link
            href="/about"
            className={`nav-item ${isActive('/about') ? 'nav-item--active' : ''}`}
          >
            📖 About
          </Link>
        </nav>

        {/* ── Right Action Controls ── */}
        <div className="navbar-right">
          {/* Recruiter Portal Link */}
          <Link
            href="/recruiter/login"
            className="btn-recruiter-pill"
            title="Recruiter Portal & Candidate X-Ray"
          >
            💼 Recruiters
          </Link>

          {/* Sound FX Toggle */}
          <SoundToggle />

          {/* Authenticated Dashboard / Login */}
          {user ? (
            <Link
              href="/dashboard"
              className="navbar-dashboard-link"
              title="Personal Dashboard & Vault"
            >
              <span className="dash-icon">⚡</span>
              <span className="dash-user">@{user.username}</span>
            </Link>
          ) : (
            <GitHubLoginBtn variant="compact" />
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="menu-icon">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fadeUp">
          <Link
            href="/leaderboard"
            className={`mobile-nav-item ${isActive('/leaderboard') ? 'mobile-nav-item--active' : ''}`}
          >
            🏆 Wall of Shame
          </Link>
          <Link
            href="/battle"
            className={`mobile-nav-item ${isActive('/battle') ? 'mobile-nav-item--active' : ''}`}
          >
            ⚔️ Roast Battle
          </Link>
          <Link
            href="/universe"
            className={`mobile-nav-item ${isActive('/universe') ? 'mobile-nav-item--active' : ''}`}
          >
            🌌 3D Code Solar System
          </Link>
          <Link
            href="/pricing"
            className={`mobile-nav-item ${isActive('/pricing') ? 'mobile-nav-item--active' : ''}`}
          >
            ⚡ Pricing & Pro
          </Link>
          <Link
            href="/recruiter/login"
            className={`mobile-nav-item ${isActive('/recruiter/login') ? 'mobile-nav-item--active' : ''}`}
            style={{ color: 'var(--recruiter-blue, #0284c7)' }}
          >
            💼 Recruiter Portal
          </Link>
          <Link
            href="/about"
            className={`mobile-nav-item ${isActive('/about') ? 'mobile-nav-item--active' : ''}`}
          >
            📖 About & Origin Story
          </Link>
          <Link
            href="/contact"
            className={`mobile-nav-item ${isActive('/contact') ? 'mobile-nav-item--active' : ''}`}
          >
            📬 Contact & Support
          </Link>
        </div>
      )}

      <style jsx>{`
        .site-navbar {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border, #e5e7eb);
          transition: background-color 0.2s, border-color 0.2s;
        }

        .navbar-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0.65rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
        }

        .brand-logo {
          font-size: 1.6rem;
          letter-spacing: 1px;
          line-height: 1;
        }

        .brand-fire {
          font-size: 1.2rem;
          line-height: 1;
        }

        /* Status Pill */
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.5px;
          background: var(--bg-input, #f3f4f6);
          border: 1px solid var(--border, #e5e7eb);
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .status-pill--online .status-dot {
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
        }

        .status-pill--online .status-text {
          color: #065f46;
        }

        .status-pill--offline .status-dot {
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
        }

        .status-pill--offline .status-text {
          color: #991b1b;
        }

        .status-pill--checking .status-dot {
          background: #f59e0b;
        }

        .status-pill--checking .status-text {
          color: #92400e;
        }

        /* Nav links */
        .navbar-links {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .nav-item {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-secondary, #4b5563);
          text-decoration: none;
          padding: 6px 10px;
          border-radius: var(--radius-sm, 6px);
          transition: all 0.15s ease;
        }

        .nav-item:hover {
          color: var(--fire, #ff4500);
          background: rgba(255, 69, 0, 0.05);
        }

        .nav-item--active {
          color: var(--fire, #ff4500) !important;
          font-weight: 700;
          background: rgba(255, 69, 0, 0.08);
        }

        /* Navbar Right */
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-recruiter-pill {
          font-size: 11px;
          font-weight: 600;
          padding: 5px 11px;
          border-radius: 9999px;
          background: rgba(2, 132, 199, 0.08);
          border: 1px solid rgba(2, 132, 199, 0.25);
          color: #0284c7;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .btn-recruiter-pill:hover {
          background: #0284c7;
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(2, 132, 199, 0.25);
        }

        .navbar-dashboard-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: var(--fire, #ff4500);
          background: rgba(255, 69, 0, 0.08);
          border: 1px solid rgba(255, 69, 0, 0.2);
          padding: 5px 10px;
          border-radius: var(--radius-sm, 6px);
          text-decoration: none;
          transition: all 0.15s;
        }

        .navbar-dashboard-link:hover {
          background: rgba(255, 69, 0, 0.15);
          transform: translateY(-1px);
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-sm, 6px);
          padding: 4px 8px;
          font-size: 15px;
          cursor: pointer;
          color: var(--text-primary, #111827);
        }

        /* Mobile Drawer */
        .mobile-drawer {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0.75rem 1.25rem 1rem;
          background: var(--bg-card, #ffffff);
          border-bottom: 1px solid var(--border, #e5e7eb);
          box-shadow: var(--shadow-deep, 0 10px 25px rgba(0, 0, 0, 0.06));
        }

        .mobile-nav-item {
          padding: 8px 12px;
          font-size: 13px;
          color: var(--text-secondary, #4b5563);
          text-decoration: none;
          border-radius: var(--radius-sm, 6px);
          transition: background-color 0.15s;
        }

        .mobile-nav-item:hover,
        .mobile-nav-item--active {
          background: rgba(255, 69, 0, 0.08);
          color: var(--fire, #ff4500);
          font-weight: 600;
        }

        @media (max-width: 900px) {
          .navbar-links {
            display: none;
          }

          .mobile-menu-btn {
            display: block;
          }

          .status-text {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .btn-recruiter-pill {
            display: none;
          }
        }
      `}</style>
    </header>
  );
}
