'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardStats } from '@/services/recruiterService';
import { playClick } from '@/utils/soundFX';
import { toast } from '@/utils/toast';

/**
 * ── WHAT: ────────────────────────────────────────────────────
 * Corporate Recruiter Command Center & Candidate Search Hub.
 * 
 * ── WHY: ─────────────────────────────────────────────────────
 * Enables technical recruiters to evaluate developer candidates based on raw
 * commit hygiene, testing coverage, and abandonment rates rather than resume claims.
 * 
 * ── WHERE & WHEN TO USE: ─────────────────────────────────────
 * Mounted at route /recruiter/dashboard.
 */
export default function DashboardClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getDashboardStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        // fail-open
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanUser = searchQuery.trim().replace(/^@/, '').replace(/^https?:\/\/github\.com\//, '');
    if (!cleanUser) {
      toast.warning('Please enter a valid GitHub username to evaluate.');
      return;
    }
    playClick();
    router.push(`/recruiter/dashboard/analyze/${encodeURIComponent(cleanUser)}`);
  };

  const handleQuickSuggest = (username) => {
    playClick();
    router.push(`/recruiter/dashboard/analyze/${username}`);
  };

  return (
    <div className="recruiter-dash">
      {/* ── Header ── */}
      <header className="dash-header">
        <h1 className="dash-title font-display">CANDIDATE COMMAND CENTER</h1>
        <p className="dash-subtitle">
          Evaluate technical talent by their hard code commits, test suites, and project completion habits.
        </p>
      </header>

      {/* ── Search Hero Card ── */}
      <section className="card search-card">
        <h2 className="search-label font-display">ANALYZE A DEVELOPER CANDIDATE</h2>
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrap">
            <span className="input-at-sign font-mono">@</span>
            <input
              type="text"
              placeholder="e.g. torvalds or paste GitHub profile URL"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input font-mono"
            />
          </div>
          <button type="submit" className="btn btn-search font-mono">
            GENERATE BRIEF ⚡
          </button>
        </form>

        <div className="quick-suggestions font-mono">
          <span className="suggestions-label">Try famous candidates:</span>
          {['torvalds', 'gaearon', 'yyx990803', 'tj'].map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => handleQuickSuggest(u)}
              className="suggestion-chip"
            >
              @{u}
            </button>
          ))}
        </div>
      </section>

      {/* ── Metrics Grid ── */}
      <section className="metrics-grid">
        <div className="card metric-card">
          <div className="metric-header font-mono">
            <span className="metric-tag">BOOKMARKED</span>
            <span className="metric-icon">⭐</span>
          </div>
          <div className="metric-value font-display">
            {loadingStats ? '—' : stats?.savedCount || 0}
          </div>
          <p className="metric-desc">Candidates saved in your private recruiter vault</p>
          <Link href="/recruiter/dashboard/saved" className="metric-link font-mono">
            View Saved List →
          </Link>
        </div>

        <div className="card metric-card">
          <div className="metric-header font-mono">
            <span className="metric-tag">SIGNAL CONFIDENCE</span>
            <span className="metric-icon">🔍</span>
          </div>
          <div className="metric-value font-display">GEMINI 3.1</div>
          <p className="metric-desc">Real-time AST commit hygiene and test coverage extraction</p>
          <span className="metric-status font-mono">✓ High Signal Engine Active</span>
        </div>
      </section>

      {/* ── Signal Value Proposition Pillars ── */}
      <section className="pillars-grid">
        <div className="card pillar-card">
          <div className="pillar-icon">🧪</div>
          <h3 className="pillar-title font-display">TEST SUITE DETECTION</h3>
          <p className="pillar-text">
            Heuristic analysis checks for real test suites (`jest`, `pytest`, `go test`) vs projects running on pure faith.
          </p>
        </div>

        <div className="card pillar-card">
          <div className="pillar-icon">📉</div>
          <h3 className="pillar-title font-display">ABANDONMENT RATIO</h3>
          <p className="pillar-text">
            Detects tutorial hoppers with 30 repos abandoned within 48 hours vs engineers who maintain long-term code.
          </p>
        </div>

        <div className="card pillar-card">
          <div className="pillar-icon">📜</div>
          <h3 className="pillar-title font-display">COMMIT HYGIENE</h3>
          <p className="pillar-text">
            Evaluates descriptive semantic commits vs single-word hotfixes (&quot;fix&quot;, &quot;wip&quot;, &quot;done&quot;) pushed at 3 AM.
          </p>
        </div>
      </section>

      <style jsx>{`
        .recruiter-dash {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .dash-header {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .dash-title {
          font-size: 2.25rem;
          color: var(--text-primary, #0F172A);
          letter-spacing: 0.5px;
          margin: 0;
        }

        .dash-subtitle {
          font-size: 14px;
          color: var(--text-secondary, #475569);
          margin: 0;
        }

        /* ── Search Card ── */
        .search-card {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--recruiter-border, #BAE6FD);
          border-radius: var(--radius-lg, 16px);
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(2, 132, 199, 0.06);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .search-label {
          font-size: 1.25rem;
          color: var(--recruiter-blue, #0284C7);
          margin: 0;
          letter-spacing: 0.5px;
        }

        .search-form {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-input-wrap {
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
          background: var(--bg-subtle, #F1F5F9);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-md, 10px);
          padding: 0 1rem;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .search-input-wrap:focus-within {
          border-color: var(--recruiter-blue, #0284C7);
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.12);
        }

        .input-at-sign {
          font-size: 15px;
          color: var(--text-muted, #94A3B8);
          margin-right: 6px;
        }

        .search-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 14px 0;
          font-size: 15px;
          color: var(--text-primary, #0F172A);
          outline: none;
        }

        .btn-search {
          background: var(--recruiter-grad, linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%));
          color: #FFFFFF;
          padding: 14px 24px;
          border-radius: var(--radius-md, 10px);
          font-size: 14px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .btn-search:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(2, 132, 199, 0.25);
        }

        .quick-suggestions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 12px;
        }

        .suggestions-label {
          color: var(--text-muted, #64748B);
        }

        .suggestion-chip {
          background: var(--recruiter-subtle, #F0F9FF);
          border: 1px solid var(--recruiter-border, #BAE6FD);
          color: var(--recruiter-blue, #0284C7);
          border-radius: var(--radius-pill, 9999px);
          padding: 4px 10px;
          cursor: pointer;
          font-size: 11px;
          transition: background 0.15s;
        }

        .suggestion-chip:hover {
          background: #E0F2FE;
        }

        /* ── Metrics Grid ── */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-lg, 16px);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
          box-shadow: var(--shadow-sm, 0 2px 4px rgba(15, 23, 42, 0.05));
        }

        .metric-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted, #64748B);
        }

        .metric-value {
          font-size: 2.5rem;
          line-height: 1;
          color: var(--recruiter-blue, #0284C7);
          margin: 6px 0;
        }

        .metric-desc {
          font-size: 13px;
          color: var(--text-secondary, #475569);
          margin: 0;
        }

        .metric-link {
          font-size: 12px;
          font-weight: 600;
          color: var(--recruiter-blue, #0284C7);
          text-decoration: none;
          margin-top: auto;
          padding-top: 8px;
        }

        .metric-link:hover {
          text-decoration: underline;
        }

        .metric-status {
          font-size: 11px;
          color: var(--state-success, #10B981);
          margin-top: auto;
          padding-top: 8px;
        }

        /* ── Pillars ── */
        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.25rem;
        }

        .pillar-card {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-md, 12px);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .pillar-icon {
          font-size: 28px;
        }

        .pillar-title {
          font-size: 1.15rem;
          color: var(--text-primary, #0F172A);
          margin: 0;
        }

        .pillar-text {
          font-size: 13px;
          color: var(--text-secondary, #475569);
          line-height: 1.5;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
