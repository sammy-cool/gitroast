'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRecruiterAuth } from '@/context/RecruiterAuthContext';
import { toast } from '@/utils/toast';
import SoundToggle from '@/components/SoundToggle';

/**
 * ── WHAT: ────────────────────────────────────────────────────
 * Master navigation and layout shell for the GitRoast Recruiter & Talent Portal.
 * Replicates the verified master Figma design in storage/figma/slices/Recruiter talent workspace — desktop.png
 * and storage/figma/slices/Recruiter candidate profile — desktop.png.
 * 
 * ── WHY: ─────────────────────────────────────────────────────
 * Provides a dedicated corporate talent interface featuring obsidian navigation,
 * warm editorial paper backgrounds, responsive mobile collapse, and strict 7.5rem bottom clearance
 * above the fixed site footer.
 * 
 * ── WHERE & WHEN TO USE: ─────────────────────────────────────
 * Wraps all routes under /recruiter/dashboard/*.
 * 
 * ── USE CASES: ───────────────────────────────────────────────
 * Technical recruiters and engineering managers reviewing candidates.
 * 
 * ── WHEN NOT TO USE: ─────────────────────────────────────────
 * Do not use for developer roast screens (use root layout).
 */
export default function RecruiterDashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { recruiterUser, logout } = useRecruiterAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('Logged out from recruiter session.');
      router.push('/recruiter/login');
    } catch {
      router.push('/recruiter/login');
    }
  };

  const navLinks = [
    { href: '/recruiter/dashboard', label: 'Talent', icon: '👤' },
    { href: '/recruiter/dashboard/saved', label: 'Saved talent', icon: '⭐' },
    { href: '/recruiter/dashboard/compare', label: 'Compare', icon: '⚔️' },
    { href: '/about', label: 'Methodology', icon: '📖' },
  ];

  return (
    <div className="recruiter-shell">
      {/* ── Desktop Sidebar & Mobile Top Nav ── */}
      <aside className="recruiter-sidebar">
        <div className="sidebar-brand-row">
          <Link href="/recruiter/dashboard" className="sidebar-logo font-display">
            GITROAST <span className="logo-burn">🔥</span>
          </Link>
          <div className="mobile-header-tools">
            <SoundToggle />
          </div>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`sidebar-link font-mono ${isActive ? 'sidebar-link--active' : ''}`}
              >
                <span className="link-icon">{link.icon}</span>
                <span className="link-label">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Pro Tier Box */}
        <div className="sidebar-pro-box">
          <span className="sidebar-pro-badge font-mono">PRO ROASTER</span>
          <p className="sidebar-pro-sub font-mono">18 of 30 roasts left this month</p>
        </div>

        <div className="sidebar-footer">
          {recruiterUser && (
            <div className="recruiter-user-pill">
              <div className="user-avatar-wrap">
                {recruiterUser.avatarUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={recruiterUser.avatarUrl}
                    alt={recruiterUser.name || 'Recruiter'}
                    className="user-avatar-img"
                    crossOrigin="anonymous"
                    loading="eager"
                  />
                ) : (
                  <div className="user-avatar-fallback font-display">
                    {(recruiterUser.name || 'R').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-meta">
                <span className="user-name">{recruiterUser.name || 'Corporate Recruiter'}</span>
                <span className="user-company font-mono">{recruiterUser.company || 'Talent Scout'}</span>
              </div>
            </div>
          )}

          <div className="sidebar-actions">
            <Link href="/" className="switch-dev-btn font-mono">
              🔥 Developer Mode
            </Link>
            <button type="button" onClick={handleLogout} className="logout-btn font-mono">
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area with Strict 7.5rem Bottom Footer Clearance ── */}
      <main className="recruiter-main">
        <div className="recruiter-content-wrap">
          {children}
        </div>
      </main>

      <style jsx>{`
        .recruiter-shell {
          display: flex;
          min-height: 100vh;
          background: #F7F5F0;
          color: #171717;
        }

        /* ── Sidebar ── */
        .recruiter-sidebar {
          width: 250px;
          background: #171717;
          color: #ffffff;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          flex-direction: column;
          padding: 2rem 1.25rem;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 20;
        }

        .sidebar-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1.5rem;
        }

        .sidebar-logo {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ffffff;
          text-decoration: none;
          letter-spacing: 0.05em;
        }

        .logo-burn {
          color: #EA580C;
        }

        .mobile-header-tools {
          display: none;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.15s ease;
        }

        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .sidebar-link--active {
          background: #EA580C;
          color: #ffffff;
          font-weight: 700;
        }

        .link-icon {
          font-size: 14px;
        }

        .link-label {
          letter-spacing: 0.02em;
        }

        /* ── Sidebar Pro Box ── */
        .sidebar-pro-box {
          margin-top: auto;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 1.5rem;
        }

        .sidebar-pro-badge {
          font-size: 10px;
          font-weight: 700;
          color: #EA580C;
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 4px;
        }

        .sidebar-pro-sub {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.35;
        }

        .sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .recruiter-user-pill {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar-wrap {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .user-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-avatar-fallback {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
        }

        .user-meta {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-name {
          font-size: 12px;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-company {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sidebar-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .switch-dev-btn {
          font-size: 11px;
          color: #FF8A4C;
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(234, 88, 12, 0.15);
          border: 1px solid rgba(234, 88, 12, 0.25);
          transition: background 0.15s;
        }

        .switch-dev-btn:hover {
          background: rgba(234, 88, 12, 0.25);
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: #F87171;
          font-size: 11px;
          cursor: pointer;
          padding: 4px 6px;
        }

        .logout-btn:hover {
          text-decoration: underline;
        }

        /* ── Main Workspace ── */
        .recruiter-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 2.5rem 2.5rem 7.5rem; /* Strict 7.5rem bottom clearance per Rule 2.3 */
        }

        .recruiter-content-wrap {
          max-width: 1240px;
          width: 100%;
          margin: 0 auto;
        }

        /* ── Responsive Mobile Collapse ── */
        @media (max-width: 860px) {
          .recruiter-shell {
            flex-direction: column;
          }

          .recruiter-sidebar {
            width: 100%;
            height: auto;
            position: relative;
            padding: 1rem 1.5rem;
            box-shadow: none;
            border-right: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }

          .mobile-header-tools {
            display: block;
          }

          .sidebar-pro-box {
            display: none;
          }

          .sidebar-nav {
            flex-direction: row;
            margin-top: 0.5rem;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .sidebar-footer {
            display: none;
          }

          .recruiter-main {
            padding: 1.5rem 1rem 7.5rem;
          }
        }
      `}</style>
    </div>
  );
}
