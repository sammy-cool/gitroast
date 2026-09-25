'use client';

// ============================================================
// GITROAST — Company Leaderboard Table (Tech Giants Wall of Shame)
// ============================================================

import Link from 'next/link';

export default function CompanyLeaderboardTable({ companies = [] }) {
  if (!companies || companies.length === 0) {
    return (
      <div className="empty-wrap font-mono">
        <p>No company roasts found.</p>
        <style jsx>{`
          .empty-wrap {
            padding: 3rem 1rem;
            text-align: center;
            color: var(--text-muted);
            font-size: 13px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="company-table-wrap">
      <div className="table-header-row font-mono">
        <span className="col-rank">#</span>
        <span className="col-company">Tech Giant</span>
        <span className="col-chaos">Chaos Score</span>
        <span className="col-action">Action</span>
      </div>

      <div className="company-list">
        {companies.map((company) => {
          const scoreColor =
            company.chaosScore < 35
              ? 'var(--bad)'
              : company.chaosScore < 50
              ? 'var(--warn)'
              : 'var(--good)';

          return (
            <div key={company.org} className="company-row">
              <span className="company-rank font-display">
                {company.rank === 1
                  ? '🥇'
                  : company.rank === 2
                  ? '🥈'
                  : company.rank === 3
                  ? '🥉'
                  : `#${company.rank}`}
              </span>

              <div className="company-info">
                <div className="company-title-row">
                  {/* 
                    ── WHAT: ────────────────────────────────────────────────────
                    Fallback avatar source with explicit layout dimensions for company logos.
                    
                    ── WHY: ─────────────────────────────────────────────────────
                    1. If company.avatarUrl is null or fails to resolve, fallback to GitHub's
                       predictable public avatar CDN prevents missing image broken placeholders.
                    2. Explicit width and height attributes eliminate Cumulative Layout Shift (CLS)
                       during initial render before stylesheet rules are applied.
                    
                    ── WHERE & WHEN TO USE: ─────────────────────────────────────
                    On all dynamically populated image elements rendered in list tables.
                    
                    ── USE CASES: ───────────────────────────────────────────────
                    Company leaderboard and organization profiles with varying avatar availability.
                    
                    ── WHEN NOT TO USE: ─────────────────────────────────────────
                    Do not use hardcoded dimensions if responsive fluid scaling requires dynamic CSS sizing.
                  */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={company.avatarUrl || `https://avatars.githubusercontent.com/${company.org}?s=96`}
                    alt={company.name}
                    className="company-avatar"
                    width={32}
                    height={32}
                    loading="lazy"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <div>
                    <h3 className="company-name">{company.name}</h3>
                    <span className="company-org font-mono">@{company.org} · {company.employeesRoasted} devs</span>
                  </div>
                </div>
                <p className="company-tagline">&ldquo;{company.tagline}&rdquo;</p>
                <div className="company-sins">
                  {company.sins?.map((sin, idx) => (
                    <span key={idx} className="sin-chip font-mono">
                      ⚠️ {sin}
                    </span>
                  ))}
                </div>
              </div>

              <div className="company-score-block font-mono">
                <span className="score-val font-display" style={{ color: scoreColor }}>
                  {company.chaosScore}
                  <span className="score-max">/100</span>
                </span>
                <span className="grade-badge" style={{ color: scoreColor, borderColor: scoreColor }}>
                  GRADE {company.grade}
                </span>
              </div>

                {/* 
                  ── WHAT: ────────────────────────────────────────────────────
                  Navigates to the cached history view for the organization.
                  
                  ── WHY: ─────────────────────────────────────────────────────
                  Adheres strictly to AGENTS.md Rule 6: public leaderboard links
                  must navigate to /history/:username, NEVER /roast/:username,
                  preventing unnecessary AI generation costs and quota exhaustion.
                  
                  ── WHERE & WHEN TO USE: ─────────────────────────────────────
                  All public leaderboard, feed, and table links.
                  
                  ── USE CASES: ───────────────────────────────────────────────
                  User exploring tech giants on the Wall of Shame.
                  
                  ── WHEN NOT TO USE: ─────────────────────────────────────────
                  Only the primary search bar and manual roast input trigger /roast/.
                */}
              <div className="company-action-col">
                <Link
                  href={`/history/${company.org}`}
                  className="btn btn-roast-org font-mono"
                  title={`View ${company.name}'s roast history`}
                >
                  🔥 View Roast
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .company-table-wrap {
          display: flex;
          flex-direction: column;
          width: 100%;
        }
        .table-header-row {
          display: grid;
          grid-template-columns: 48px 1fr 100px 76px;
          gap: 12px;
          padding: 0.85rem 1.25rem;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 11px;
          letter-spacing: 1px;
          align-items: center;
        }
        .col-rank,
        .col-chaos {
          text-align: center;
        }
        .col-action {
          text-align: right;
        }
        .company-list {
          display: flex;
          flex-direction: column;
        }
        .company-row {
          display: grid;
          grid-template-columns: 48px 1fr 100px 76px;
          gap: 12px;
          padding: 1.15rem 1.25rem;
          border-bottom: 1px solid var(--border);
          align-items: center;
          transition: background 0.15s ease;
        }
        .company-row:last-child {
          border-bottom: none;
        }
        .company-row:hover {
          background: rgba(255, 69, 0, 0.03);
        }
        .company-rank {
          font-size: 18px;
          color: var(--text-secondary);
          text-align: center;
        }
        .company-info {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }
        .company-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .company-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 1px solid var(--border);
          flex-shrink: 0;
        }
        .company-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.2;
        }
        .company-org {
          font-size: 11px;
          color: var(--text-muted);
        }
        .company-tagline {
          font-size: 12px;
          color: var(--text-secondary);
          font-style: italic;
          line-height: 1.4;
          margin: 0;
        }
        .company-sins {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 2px;
        }
        .sin-chip {
          font-size: 10px;
          padding: 2px 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text-muted);
        }
        .company-score-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          text-align: center;
        }
        .score-val {
          font-size: 26px;
          line-height: 1;
        }
        .score-max {
          font-size: 11px;
          color: var(--text-muted);
        }
        .grade-badge {
          font-size: 9px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 3px;
          border: 1px solid;
          background: rgba(0, 0, 0, 0.3);
          letter-spacing: 0.5px;
        }
        .company-action-col {
          display: flex;
          justify-content: flex-end;
        }
        .btn-roast-org {
          padding: 6px 12px;
          background: rgba(255, 69, 0, 0.1);
          border: 1px solid rgba(255, 69, 0, 0.3);
          color: var(--fire);
          font-size: 11px;
          font-weight: 600;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .btn-roast-org:hover {
          background: var(--fire-grad);
          color: #fff;
          border-color: transparent;
          transform: translateY(-1px);
        }

        @media (max-width: 540px) {
          .table-header-row,
          .company-row {
            grid-template-columns: 36px 1fr 68px;
            gap: 8px;
            padding: 0.85rem 0.85rem;
          }
          .col-action,
          .company-action-col {
            display: none;
          }
          .company-sins {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
