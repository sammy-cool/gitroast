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
 * 
 * ── WHY: ─────────────────────────────────────────────────────
 * Provides a dedicated corporate talent interface featuring calm Sky Blue tones,
 * responsive mobile navigation, and strict 7rem bottom clearance above the fixed site footer.
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
    { href: '/recruiter/dashboard', label: 'Candidate Search', icon: '🔍' },
    { href: '/recruiter/dashboard/compare', label: 'Candidate Duel', icon: '⚔️' },
    { href: '/recruiter/dashboard/saved', label: 'Saved Candidates', icon: '⭐' },
  ];

  return (
    <div className="recruiter-shell">
      {/* ── Desktop Sidebar & Mobile Top Nav ── */}
      <aside className="recruiter-sidebar">
        <div className="sidebar-brand-row">
          <Link href="/recruiter/dashboard" className="sidebar-logo font-display">
            GITROAST <span className="logo-talent">TALENT ⚡</span>
          </Link>
          <div className="mobile-header-tools">
            <SoundToggle />
          </div>
        </div>

        <p className="sidebar-tagline font-mono">Candidate X-Ray · Code Signal Over Hype</p>

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

      {/* ── Main Content Area with Strict 7rem Bottom Footer Clearance ── */}
      <main className="recruiter-main">
        <div className="recruiter-content-wrap">
          {children}
        </div>
      </main>

      <style jsx>{`
        .recruiter-shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary, #FAFAFA);
          color: var(--text-primary, #0F172A);
        }

        /* ── Sidebar ── */
        .recruiter-sidebar {
          width: 280px;
          background: var(--bg-card, #FFFFFF);
          border-right: 1px solid var(--border, #E2E8F0);
          display: flex;
          flex-direction: column;
          padding: 2rem 1.5rem;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          box-shadow: 2px 0 12px rgba(15, 23, 42, 0.03);
          z-index: 20;
        }

        .sidebar-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .sidebar-logo {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary, #0F172A);
          text-decoration: none;
          letter-spacing: 0.5px;
        }

        .logo-talent {
          color: var(--recruiter-blue, #0284C7);
          font-size: 1.5rem;
        }

        .mobile-header-tools {
          display: none;
        }

        .sidebar-tagline {
          font-size: 11px;
          color: var(--text-muted, #64748B);
          margin-top: 4px;
          margin-bottom: 2rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: var(--radius-md, 10px);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          color: var(--text-secondary, #334155);
          transition: all 0.15s ease;
        }

        .sidebar-link:hover {
          background: var(--recruiter-subtle, #F0F9FF);
          color: var(--recruiter-blue, #0284C7);
        }

        .sidebar-link--active {
          background: var(--recruiter-subtle, #F0F9FF);
          color: var(--recruiter-blue, #0284C7);
          border: 1px solid var(--recruiter-border, #BAE6FD);
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border, #E2E8F0);
        }

        .recruiter-user-pill {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar-wrap {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--recruiter-border, #BAE6FD);
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
          font-size: 1.2rem;
          color: var(--recruiter-blue, #0284C7);
        }

        .user-meta {
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .user-name {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary, #0F172A);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-company {
          font-size: 11px;
          color: var(--text-muted, #64748B);
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
          color: var(--fire, #FF4500);
          text-decoration: none;
          padding: 6px 10px;
          border-radius: var(--radius-sm, 6px);
          background: rgba(255, 69, 0, 0.06);
          transition: background 0.15s;
        }

        .switch-dev-btn:hover {
          background: rgba(255, 69, 0, 0.12);
        }

        .logout-btn {
          background: transparent;
          border: none;
          color: var(--bad, #EF4444);
          font-size: 11px;
          cursor: pointer;
          padding: 6px 8px;
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
          padding: 2.5rem 2rem 7.5rem; /* Strict 7.5rem bottom clearance per Rule 2.3 */
        }

        .recruiter-content-wrap {
          max-width: 1080px;
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
            border-bottom: 1px solid var(--border, #E2E8F0);
          }

          .mobile-header-tools {
            display: block;
          }

          .sidebar-tagline {
            display: none;
          }

          .sidebar-nav {
            flex-direction: row;
            margin-top: 1rem;
            overflow-x: auto;
            padding-bottom: 4px;
          }

          .sidebar-footer {
            display: none; /* Hide on mobile sidebar; actions placed in user profile */
          }

          .recruiter-main {
            padding: 1.5rem 1rem 7.5rem;
          }
        }
      `}</style>
    </div>
  );
}
