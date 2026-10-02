'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboardStats } from '@/services/recruiterService';
import { playClick } from '@/utils/soundFX';
import { toast } from '@/utils/toast';

/**
 * ── WHAT: ────────────────────────────────────────────────────
 * Corporate Recruiter Talent Workspace & Candidate Command Center.
 * Replicates the verified master Figma design in storage/figma/slices/Recruiter talent workspace — desktop.png.
 * 
 * ── WHY: ─────────────────────────────────────────────────────
 * Enables technical recruiters to evaluate developer candidates based on raw
 * commit hygiene, testing coverage, and abandonment rates rather than resume claims.
 * 
 * ── WHERE & WHEN TO USE: ─────────────────────────────────────
 * Mounted at route /recruiter/dashboard.
 * 
 * ── USE CASES: ───────────────────────────────────────────────
 * Technical recruiters filtering by role fit, reviewing candidate public evidence,
 * and building shortlists for hiring managers.
 * 
 * ── WHEN NOT TO USE: ─────────────────────────────────────────
 * Developer GitHub users roasting profiles (routed at /dashboard).
 */
export default function DashboardClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFit, setRoleFit] = useState('Senior IC');
  const [evidenceWindow, setEvidenceWindow] = useState('Last 12 months');
  const [stats, setStats] = useState(null);
  const router = useRouter();

  // Candidates list matching Figma workspace
  const [candidates, setCandidates] = useState([
    {
      id: 'aria-moon',
      username: 'aria-moon',
      name: 'Aria Moon',
      initials: 'AM',
      avatarBg: '#FDE68A',
      role: 'Systems • TypeScript',
      evidence: 'Depth 94 • Collaboration 88',
      score: 91,
      badge: 'Strong',
      badgeType: 'strong',
      checked: true,
      saved: true,
    },
    {
      id: 'octavia-labs',
      username: 'octavia-labs',
      name: 'Octavia Labs',
      initials: 'octavia-labs',
      avatarBg: '#FED7AA',
      role: 'Compilers • Rust',
      evidence: 'Depth 92 • Consistency 81',
      score: 87,
      badge: 'Strong',
      badgeType: 'strong',
      checked: true,
      saved: true,
    },
    {
      id: 'nora-p',
      username: 'nora-p',
      name: 'Nora Patel',
      initials: 'NP',
      avatarBg: '#E2E8F0',
      role: 'Platform • Go',
      evidence: 'Tests 94 • Documentation 86',
      score: 84,
      badge: 'Good',
      badgeType: 'good',
      checked: false,
      saved: false,
    },
    {
      id: 'kai-shin',
      username: 'kai-shin',
      name: 'Kai Shin',
      initials: 'KS',
      avatarBg: '#FEF08A',
      role: 'Frontend systems',
      evidence: 'Collaboration 89 • Momentum +18%',
      score: 82,
      badge: 'Good',
      badgeType: 'good',
      checked: false,
      saved: false,
    },
  ]);

  useEffect(() => {
    let cancelled = false;
    getDashboardStats()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        // fail-open
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanUser = searchQuery.trim().replace(/^@/, '').replace(/^https?:\/\/github\.com\//, '');
    if (!cleanUser) {
      toast.warning('Please enter a GitHub username to evaluate.');
      return;
    }
    playClick();
    router.push(`/recruiter/dashboard/analyze/${encodeURIComponent(cleanUser)}`);
  };

  const handleToggleCheck = (id) => {
    playClick();
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
    );
  };

  const handleToggleBookmark = (id, username) => {
    playClick();
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextSaved = !c.saved;
          if (nextSaved) {
            toast.success(`@${username} saved to your recruiter vault! ⭐`);
          } else {
            toast.info(`@${username} removed from vault.`);
          }
          return { ...c, saved: nextSaved };
        }
        return c;
      })
    );
  };

  return (
    <div className="talent-workspace">
      {/* ── Top Eyebrow & Editorial Header ── */}
      <div className="workspace-eyebrow font-mono">
        NORTHSTAR LABS • RECRUITER WORKSPACE • SAMPLE DATA
      </div>

      <header className="workspace-header">
        <h1 className="workspace-title font-serif">
          Talent evidence, without the theater.
        </h1>
        <div className="workspace-header-actions">
          <Link href="/about" className="btn-outline-editorial font-mono">
            📖 Methodology
          </Link>
          <button
            type="button"
            className="btn-new-shortlist font-mono"
            onClick={() => toast.success('New shortlist created! Add candidates below.')}
          >
            + New shortlist
          </button>
        </div>
      </header>

      {/* ── Search & Filter Controls Bar ── */}
      <section className="search-filter-bar">
        <form onSubmit={handleSearch} className="search-form-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search public profiles or repositories (e.g. torvalds or rust engineer)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-field font-mono"
          />
        </form>

        <div className="filter-selects">
          <div className="select-pill-wrap font-mono">
            <span className="select-label">Role fit</span>
            <select
              value={roleFit}
              onChange={(e) => setRoleFit(e.target.value)}
              className="select-element"
            >
              <option value="Senior IC">Senior IC</option>
              <option value="Staff+ IC">Staff+ IC</option>
              <option value="Tech Lead">Tech Lead</option>
              <option value="All Roles">All Roles</option>
            </select>
          </div>

          <div className="select-pill-wrap font-mono">
            <span className="select-label">Evidence window</span>
            <select
              value={evidenceWindow}
              onChange={(e) => setEvidenceWindow(e.target.value)}
              className="select-element"
            >
              <option value="Last 12 months">Last 12 months</option>
              <option value="Last 6 months">Last 6 months</option>
              <option value="All-time">All-time</option>
            </select>
          </div>

          <button
            type="button"
            className="btn-more-filters font-mono"
            onClick={() => toast.info('Additional AST signal filters are active.')}
          >
            <span>⊞</span> More filters · 3
          </button>
        </div>
      </section>

      {/* ── 4 Stat Metric Cards ── */}
      <section className="workspace-stats-grid">
        <div className="stat-card">
          <span className="stat-tag font-mono">EVIDENCE PROFILES</span>
          <span className="stat-num font-serif">1,284</span>
          <span className="stat-sub font-mono">Matched current filters</span>
        </div>

        <div className="stat-card">
          <span className="stat-tag font-mono">SAVED TALENT</span>
          <span className="stat-num font-serif">{stats?.savedCount ?? 38}</span>
          <span className="stat-sub font-mono">12 ready for review</span>
        </div>

        <div className="stat-card">
          <span className="stat-tag font-mono">SHORTLISTS</span>
          <span className="stat-num font-serif">6</span>
          <span className="stat-sub font-mono">2 shared this week</span>
        </div>

        <div className="stat-card">
          <span className="stat-tag font-mono">METHOD COVERAGE</span>
          <span className="stat-num font-serif">High</span>
          <span className="stat-sub font-mono">86% with enough evidence</span>
        </div>
      </section>

      {/* ── Main Area: Results Table (Left) & Shortlist / Comparison (Right) ── */}
      <div className="workspace-layout-grid">
        {/* Left Column: Role-fit Results Table */}
        <section className="results-table-card">
          <div className="results-card-header">
            <div>
              <h2 className="results-card-title font-sans">Role-fit results</h2>
              <p className="results-card-desc font-mono">
                Ranked by selected public evidence signals, not identity or popularity.
              </p>
            </div>
            <div className="results-header-actions">
              <span className="explain-pill font-mono">Explain ranking</span>
              <button
                type="button"
                className="btn-compare-selected font-mono"
                onClick={() => router.push('/recruiter/dashboard/compare')}
              >
                Compare selected
              </button>
            </div>
          </div>

          {/* Table Header Row */}
          <div className="results-thead font-mono">
            <span className="col-candidate">CANDIDATE</span>
            <span className="col-evidence">ROLE EVIDENCE</span>
            <span className="col-fit">FIT</span>
            <span className="col-actions">ACTIONS</span>
          </div>

          {/* Candidate Table Rows */}
          <div className="results-tbody">
            {candidates.map((cand) => (
              <div key={cand.id} className="candidate-row">
                <div className="cand-info-col">
                  <input
                    type="checkbox"
                    checked={cand.checked}
                    onChange={() => handleToggleCheck(cand.id)}
                    className="cand-checkbox"
                  />
                  <div
                    className="cand-avatar-initials font-mono"
                    style={{ background: cand.avatarBg }}
                  >
                    {cand.initials}
                  </div>
                  <div className="cand-meta">
                    <span className="cand-name font-sans">{cand.name}</span>
                    <span className="cand-handle font-mono">@{cand.username}</span>
                  </div>
                </div>

                <div className="cand-evidence-col">
                  <span className="evidence-primary font-mono">{cand.role}</span>
                  <span className="evidence-secondary font-mono">{cand.evidence}</span>
                </div>

                <div className="cand-fit-col">
                  <span className="fit-score font-serif">{cand.score}</span>
                  <span className={`fit-badge font-mono fit-badge--${cand.badgeType}`}>
                    {cand.badge}
                  </span>
                </div>

                <div className="cand-actions-col">
                  <button
                    type="button"
                    className="btn-bookmark"
                    onClick={() => handleToggleBookmark(cand.id, cand.username)}
                    title={cand.saved ? 'Saved to vault' : 'Save candidate'}
                  >
                    {cand.saved ? '⭐' : '🔖'}
                  </button>
                  <Link
                    href={`/recruiter/dashboard/analyze/${cand.username}`}
                    className="btn-view-profile font-mono"
                  >
                    Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Shortlist & Comparison Sidecards */}
        <aside className="workspace-side-column">
          {/* Obsidian Shortlist Card */}
          <div className="obsidian-shortlist-card">
            <div className="shortlist-header">
              <span className="shortlist-tag font-mono">SHORTLIST</span>
              <span className="shortlist-count font-mono">4 people</span>
            </div>
            <h3 className="shortlist-title font-serif">Senior systems IC</h3>

            <div className="shortlist-people-list">
              <div className="shortlist-person-item">
                <div className="person-avatar font-mono" style={{ background: '#FDE68A' }}>AM</div>
                <span className="person-name font-mono">Aria Moon</span>
                <button type="button" className="btn-remove-person" onClick={() => toast.info('Removed from shortlist')}>×</button>
              </div>

              <div className="shortlist-person-item">
                <div className="person-avatar font-mono" style={{ background: '#FED7AA' }}>OL</div>
                <span className="person-name font-mono">Octavia Labs</span>
                <button type="button" className="btn-remove-person" onClick={() => toast.info('Removed from shortlist')}>×</button>
              </div>

              <div className="shortlist-person-item">
                <div className="person-avatar font-mono" style={{ background: '#E2E8F0' }}>NP</div>
                <span className="person-name font-mono">Nora Patel</span>
                <button type="button" className="btn-remove-person" onClick={() => toast.info('Removed from shortlist')}>×</button>
              </div>
            </div>

            <button
              type="button"
              className="btn-open-shortlist font-mono"
              onClick={() => router.push('/recruiter/dashboard/saved')}
            >
              Open shortlist →
            </button>
          </div>

          {/* Comparison Snapshot Card */}
          <div className="comparison-snapshot-card">
            <span className="comparison-tag font-mono">COMPARISON SNAPSHOT</span>
            <h4 className="comparison-title font-sans">Aria vs Octavia</h4>

            <div className="comparison-bars-group">
              <div className="comparison-metric">
                <div className="metric-header font-mono">
                  <span>Project depth</span>
                  <span>94 / 92</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: '94%', background: '#EA580C' }} />
                </div>
              </div>

              <div className="comparison-metric">
                <div className="metric-header font-mono">
                  <span>Collaboration</span>
                  <span>88 / 81</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: '88%', background: '#059669' }} />
                </div>
              </div>

              <div className="comparison-metric">
                <div className="metric-header font-mono">
                  <span>Documentation</span>
                  <span>90 / 74</span>
                </div>
                <div className="bar-track">
                  <div className="bar-fill" style={{ width: '84%', background: '#EAB308' }} />
                </div>
              </div>
            </div>

            <p className="comparison-note font-mono">
              Comparison supports review; it does not recommend a hiring decision.
            </p>

            <Link
              href="/recruiter/dashboard/compare"
              className="btn-compare-evidence font-mono"
            >
              Compare evidence
            </Link>
          </div>
        </aside>
      </div>

      {/* ── Bottom Side-by-Side Cards: Methodology & Privacy Boundaries ── */}
      <section className="workspace-bottom-cards">
        <div className="bottom-info-card bottom-info-card--method">
          <div className="bottom-card-icon">⌖</div>
          <h3 className="bottom-card-title font-sans">Transparent methodology</h3>
          <p className="bottom-card-desc">
            Signals show source, date range, weight and confidence. Sparse public activity is labeled—not penalized by assumption.
          </p>
          <Link href="/about" className="bottom-card-link font-mono">
            Review methodology →
          </Link>
        </div>

        <div className="bottom-info-card bottom-info-card--privacy">
          <div className="bottom-card-icon">🛡</div>
          <h3 className="bottom-card-title font-sans">Privacy boundaries</h3>
          <p className="bottom-card-desc">
            Public work only. No inferred age, gender, ethnicity, health, location or private employment data. Opt-outs are honored.
          </p>
          <Link href="/about" className="bottom-card-link font-mono">
            View ethical-use policy →
          </Link>
        </div>
      </section>

      <style jsx>{`
        .talent-workspace {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .workspace-eyebrow {
          font-size: 11px;
          font-weight: 700;
          color: #EA580C;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .workspace-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .workspace-title {
          font-size: 2.5rem;
          line-height: 1.15;
          color: #171717;
          margin: 0;
        }

        .workspace-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-outline-editorial {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          padding: 8px 16px;
          font-size: 12px;
          font-weight: 600;
          color: #171717;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btn-outline-editorial:hover {
          background: #f9fafb;
          border-color: #9CA3AF;
        }

        .btn-new-shortlist {
          background: #EA580C;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 8px 18px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-new-shortlist:hover {
          background: #C2410C;
        }

        /* ── Search & Filter Controls ── */
        .search-filter-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 10px 14px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .search-form-wrap {
          flex: 1;
          min-width: 280px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .search-icon {
          font-size: 14px;
          opacity: 0.6;
        }
        .search-input-field {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #171717;
        }

        .filter-selects {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .select-pill-wrap {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 4px 10px;
          font-size: 11px;
        }
        .select-label {
          color: #64748B;
        }
        .select-element {
          border: none;
          outline: none;
          background: transparent;
          font-weight: 600;
          color: #171717;
          cursor: pointer;
        }

        .btn-more-filters {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
        }
        .btn-more-filters:hover {
          background: #F3F4F6;
        }

        /* ── 4 Stats Grid ── */
        .workspace-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        .stat-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }
        .stat-tag {
          font-size: 10px;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.08em;
        }
        .stat-num {
          font-size: 2.25rem;
          color: #171717;
          line-height: 1.1;
        }
        .stat-sub {
          font-size: 11px;
          color: #94A3B8;
        }

        /* ── Workspace 2-Column Grid ── */
        .workspace-layout-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 1.5rem;
          align-items: start;
        }

        .results-table-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }

        .results-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid #F3F4F6;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .results-card-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #171717;
          margin: 0 0 4px;
        }
        .results-card-desc {
          font-size: 12px;
          color: #64748B;
          margin: 0;
        }
        .results-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .explain-pill {
          font-size: 11px;
          color: #64748B;
          background: #F1F5F9;
          padding: 4px 10px;
          border-radius: 9999px;
        }
        .btn-compare-selected {
          background: #ffffff;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          color: #171717;
          cursor: pointer;
        }
        .btn-compare-selected:hover {
          background: #F9FAFB;
        }

        /* Table Structure */
        .results-thead {
          display: grid;
          grid-template-columns: 2.2fr 2fr 1fr 1.2fr;
          padding: 10px 1.5rem;
          background: #F9FAFB;
          border-bottom: 1px solid #E5E7EB;
          font-size: 10px;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.08em;
        }

        .results-tbody {
          display: flex;
          flex-direction: column;
        }
        .candidate-row {
          display: grid;
          grid-template-columns: 2.2fr 2fr 1fr 1.2fr;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #F3F4F6;
          align-items: center;
          transition: background 0.15s ease;
        }
        .candidate-row:hover {
          background: #FAFAFA;
        }

        .cand-info-col {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cand-checkbox {
          accent-color: #EA580C;
          cursor: pointer;
        }
        .cand-avatar-initials {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          color: #171717;
          border: 1px solid rgba(0, 0, 0, 0.08);
          flex-shrink: 0;
        }
        .cand-meta {
          display: flex;
          flex-direction: column;
        }
        .cand-name {
          font-size: 14px;
          font-weight: 700;
          color: #171717;
        }
        .cand-handle {
          font-size: 11px;
          color: #64748B;
        }

        .cand-evidence-col {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .evidence-primary {
          font-size: 12px;
          font-weight: 600;
          color: #171717;
        }
        .evidence-secondary {
          font-size: 11px;
          color: #64748B;
        }

        .cand-fit-col {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .fit-score {
          font-size: 1.75rem;
          color: #171717;
          line-height: 1;
        }
        .fit-badge {
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .fit-badge--strong {
          background: #D1FAE5;
          color: #065F46;
        }
        .fit-badge--good {
          background: #DCFCE7;
          color: #166534;
        }

        .cand-actions-col {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
        }
        .btn-bookmark {
          background: transparent;
          border: none;
          font-size: 16px;
          cursor: pointer;
          opacity: 0.8;
          transition: transform 0.15s ease;
        }
        .btn-bookmark:hover {
          transform: scale(1.15);
        }
        .btn-view-profile {
          background: #ffffff;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          color: #EA580C;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btn-view-profile:hover {
          background: #FFF7ED;
          border-color: #FDBA74;
        }

        /* ── Right Column Sidecards ── */
        .workspace-side-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Obsidian Shortlist Card */
        .obsidian-shortlist-card {
          background: #171717;
          color: #ffffff;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .shortlist-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .shortlist-tag {
          font-size: 10px;
          font-weight: 700;
          color: #A3A3A3;
          letter-spacing: 0.08em;
        }
        .shortlist-count {
          font-size: 10px;
          font-weight: 700;
          background: #ffffff;
          color: #171717;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .shortlist-title {
          font-size: 1.75rem;
          margin: 0;
          color: #ffffff;
          line-height: 1.15;
        }
        .shortlist-people-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .shortlist-person-item {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 6px 10px;
        }
        .person-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 700;
          color: #171717;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .person-name {
          font-size: 12px;
          color: #ffffff;
          flex: 1;
        }
        .btn-remove-person {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 16px;
          cursor: pointer;
        }
        .btn-remove-person:hover {
          color: #EF4444;
        }
        .btn-open-shortlist {
          background: #EA580C;
          color: #ffffff;
          border: none;
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .btn-open-shortlist:hover {
          background: #C2410C;
        }

        /* Comparison Snapshot Card */
        .comparison-snapshot-card {
          background: #ffffff;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
        }
        .comparison-tag {
          font-size: 10px;
          font-weight: 700;
          color: #EA580C;
          letter-spacing: 0.08em;
        }
        .comparison-title {
          font-size: 1.2rem;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .comparison-bars-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .comparison-metric {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .metric-header {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #475569;
        }
        .bar-track {
          width: 100%;
          height: 6px;
          background: #F1F5F9;
          border-radius: 3px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          border-radius: 3px;
        }
        .comparison-note {
          font-size: 10px;
          color: #94A3B8;
          line-height: 1.4;
          margin: 0;
        }
        .btn-compare-evidence {
          text-align: center;
          background: #ffffff;
          border: 1px solid #D1D5DB;
          border-radius: 8px;
          padding: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #171717;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .btn-compare-evidence:hover {
          background: #F9FAFB;
        }

        /* ── Bottom Side-by-Side Cards ── */
        .workspace-bottom-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-top: 0.5rem;
        }
        .bottom-info-card {
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bottom-info-card--method {
          background: #F0F9FF;
          border: 1px solid #BAE6FD;
        }
        .bottom-info-card--privacy {
          background: #F0FDF4;
          border: 1px solid #BBF7D0;
        }
        .bottom-card-icon {
          font-size: 18px;
        }
        .bottom-card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #171717;
          margin: 0;
        }
        .bottom-card-desc {
          font-size: 12px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
          flex: 1;
        }
        .bottom-card-link {
          font-size: 12px;
          font-weight: 600;
          color: #EA580C;
          text-decoration: none;
          margin-top: 4px;
        }
        .bottom-card-link:hover {
          text-decoration: underline;
        }

        /* ── Responsive ── */
        @media (max-width: 1024px) {
          .workspace-layout-grid {
            grid-template-columns: 1fr;
          }
          .workspace-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .workspace-stats-grid {
            grid-template-columns: 1fr;
          }
          .workspace-bottom-cards {
            grid-template-columns: 1fr;
          }
          .results-thead {
            display: none;
          }
          .candidate-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          .cand-actions-col {
            justify-content: flex-start;
          }
          .workspace-title {
            font-size: 1.85rem;
          }
        }
      `}</style>
    </div>
  );
}
