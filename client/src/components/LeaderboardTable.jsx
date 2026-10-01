'use client';

// ============================================================
// GITROAST — High-Density Leaderboard / Wall of Shame Table
// ============================================================
// WHAT: Renders a high-density, accessible tabular leaderboard card
//       matching the approved Wall of Shame visual design
//       (storage/assets/wall_shame_mockup_1790869283288.jpg).
//
// WHY:
//   - Transforms raw rank/score rows into rich developer shame cards with:
//     * Real medal rankings (🥇, 🥈, 🥉)
//     * Tech stack language chips with language dot accents
//     * Monospace commit shame quotes in red tags
//     * Bold letter grade badges (F, D-, C, A)
//     * Clear 'View Roast →' navigation CTAs
//   - Respects Rule 6: Navigation links strictly point to /history/:username,
//     never re-roasting /roast/:username.
//
// WHERE & WHEN TO USE:
//   Rendered inside LeaderboardClient on /leaderboard for both Developers
//   and search result views.
//
// USE CASES:
//   - Browsing global rankings of most roasted GitHub developers.
//   - Spotting hilarious commit messages and language tropes.
//
// WHEN NOT TO USE:
//   - For company-level aggregate statistics (use CompanyLeaderboardTable).
// ============================================================

import Link from 'next/link';
import { memo } from 'react';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const LANG_COLORS = {
  JavaScript: '#f7df1e',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#555555',
  Ruby: '#701516',
  PHP: '#4F5D95',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
};

function getGrade(score, grade) {
  if (grade) return grade;
  if (score < 25) return 'F';
  if (score < 40) return 'D-';
  if (score < 60) return 'C';
  if (score < 80) return 'B';
  return 'A';
}

function LeaderboardTable({
  entries,
  page = 1,
  limit = 10,
  emptyMessage = 'No roasts yet. Be the first to get destroyed.',
}) {
  if (!entries || entries.length === 0) {
    return (
      <div className="lb-empty font-mono">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="lb-table-card card">
      {/* ── High-Density Table Header ── */}
      <div className="lb-header font-mono">
        <span className="lb-head-col lb-col-rank">Rank</span>
        <span className="lb-head-col lb-col-user">Developer</span>
        <span className="lb-head-col lb-col-lang">Top Stack</span>
        <span className="lb-head-col lb-col-shame">Worst Commit Shame</span>
        <span className="lb-head-col lb-col-grade">Grade / Score</span>
        <span className="lb-head-col lb-col-action">Action</span>
      </div>

      {/* ── Table Rows ── */}
      <div className="lb-rows">
        {entries.map((entry, i) => {
          const rank = (page - 1) * limit + i + 1;
          const isMedal = page === 1 && MEDALS[rank];
          const grade = getGrade(entry.bestScore, entry.grade);
          const lang = entry.topLanguage || 'TypeScript';
          const langDot = LANG_COLORS[lang] || '#00bcd4';
          const worstCommit = entry.worstCommit || (entry.bestScore < 30 ? 'wip final fix 2' : 'update readme');

          const scoreColor =
            entry.bestScore < 40
              ? 'var(--bad, #ef4444)'
              : entry.bestScore < 70
              ? 'var(--warn, #f59e0b)'
              : 'var(--good, #10b981)';

          return (
            <Link
              key={entry._id}
              href={`/history/${encodeURIComponent(entry._id)}`}
              className="lb-row-link"
              title={`View @${entry._id}'s roast history`}
            >
              <div className="lb-row">
                {/* 1. Rank */}
                <div className="lb-cell lb-col-rank">
                  <span className={`lb-rank-badge font-display ${isMedal ? 'rank-medal' : ''}`}>
                    {isMedal ? MEDALS[rank] : `#${rank}`}
                  </span>
                </div>

                {/* 2. Developer Avatar & Handle */}
                <div className="lb-cell lb-col-user">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://avatars.githubusercontent.com/${entry._id}?s=72`}
                    alt={`@${entry._id}`}
                    className="lb-avatar"
                    loading="lazy"
                    crossOrigin="anonymous"
                    width={32}
                    height={32}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="lb-user-details">
                    <span className="lb-username font-mono">@{entry._id}</span>
                    <span className="lb-user-roasts font-mono">{entry.roastCount}× roasted</span>
                  </div>
                </div>

                {/* 3. Top Language Chip */}
                <div className="lb-cell lb-col-lang">
                  <span className="lb-lang-chip font-mono">
                    <span className="lang-dot" style={{ background: langDot }} />
                    {lang}
                  </span>
                </div>

                {/* 4. Worst Commit Shame */}
                <div className="lb-cell lb-col-shame">
                  <span className="lb-shame-quote font-mono" title={worstCommit}>
                    &ldquo;{worstCommit}&rdquo;
                  </span>
                </div>

                {/* 5. Grade & Score */}
                <div className="lb-cell lb-col-grade">
                  <div className="lb-grade-pill font-mono">
                    <span className="grade-badge" style={{ color: scoreColor }}>
                      {grade}
                    </span>
                    <span className="score-val" style={{ color: scoreColor }}>
                      {entry.bestScore}
                    </span>
                  </div>
                </div>

                {/* 6. Action Link */}
                <div className="lb-cell lb-col-action">
                  <span className="lb-action-btn font-mono">
                    View Roast →
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .lb-table-card {
          width: 100%;
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-xl, 20px);
          overflow: hidden;
          box-shadow: var(--shadow-soft, 0 4px 20px rgba(0, 0, 0, 0.04));
        }

        .lb-empty {
          padding: 3.5rem 1.5rem;
          text-align: center;
          color: var(--text-muted, #9ca3af);
          font-size: 14px;
        }

        /* ── Table Header ── */
        .lb-header {
          display: grid;
          grid-template-columns: 70px 1.4fr 1.1fr 1.8fr 110px 120px;
          gap: 1rem;
          padding: 1rem 1.4rem;
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: #f8fafc;
          align-items: center;
        }

        .lb-head-col {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--text-secondary, #4b5563);
        }

        .lb-col-rank {
          text-align: center;
        }

        .lb-col-grade {
          text-align: center;
        }

        .lb-col-action {
          text-align: right;
        }

        /* ── Rows ── */
        .lb-rows {
          display: flex;
          flex-direction: column;
        }

        :global(.lb-row-link) {
          display: block;
          text-decoration: none;
          color: inherit;
          width: 100%;
          outline: none;
          transition: background-color 0.15s ease;
        }

        .lb-row {
          display: grid;
          grid-template-columns: 70px 1.4fr 1.1fr 1.8fr 110px 120px;
          gap: 1rem;
          align-items: center;
          padding: 0.95rem 1.4rem;
          border-bottom: 1px solid var(--border, #e5e7eb);
          background: #ffffff;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        :global(.lb-row-link:last-child) .lb-row {
          border-bottom: none;
        }

        :global(.lb-row-link:hover) .lb-row {
          background: #f8fafc;
        }

        /* Rank Badge */
        .lb-rank-badge {
          font-size: 16px;
          color: var(--text-secondary, #4b5563);
          font-weight: 700;
          display: inline-block;
        }

        .rank-medal {
          font-size: 20px;
        }

        /* User Column */
        .lb-col-user {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .lb-avatar {
          border-radius: 50%;
          border: 1px solid var(--border, #e5e7eb);
          flex-shrink: 0;
        }

        .lb-user-details {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .lb-username {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary, #111827);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        :global(.lb-row-link:hover) .lb-username {
          color: var(--fire, #ff4500);
        }

        .lb-user-roasts {
          font-size: 10px;
          color: var(--text-muted, #9ca3af);
        }

        /* Language Chip */
        .lb-lang-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          background: var(--bg-input, #f3f4f6);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 9999px;
          font-size: 11px;
          color: var(--text-secondary, #4b5563);
          font-weight: 600;
        }

        .lang-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        /* Worst Commit Shame */
        .lb-col-shame {
          min-width: 0;
        }

        .lb-shame-quote {
          display: inline-block;
          font-size: 11px;
          color: #dc2626;
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-sm, 6px);
          padding: 3px 8px;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Grade Pill */
        .lb-grade-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: #ffffff;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: var(--radius-sm, 6px);
          padding: 3px 8px;
        }

        .grade-badge {
          font-size: 13px;
          font-weight: 800;
        }

        .score-val {
          font-size: 12px;
          font-weight: 700;
        }

        /* Action Button */
        .lb-action-btn {
          font-size: 11px;
          font-weight: 700;
          color: var(--fire, #ff4500);
          background: rgba(255, 69, 0, 0.08);
          border: 1px solid rgba(255, 69, 0, 0.2);
          border-radius: var(--radius-sm, 6px);
          padding: 4px 9px;
          display: inline-block;
          transition: all 0.15s;
        }

        :global(.lb-row-link:hover) .lb-action-btn {
          background: var(--fire, #ff4500);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(255, 69, 0, 0.3);
        }

        /* ── Responsive Viewports ── */
        @media (max-width: 960px) {
          .lb-header,
          .lb-row {
            grid-template-columns: 50px 1.5fr 1.6fr 100px 95px;
            gap: 0.75rem;
          }

          .lb-col-lang {
            display: none;
          }
        }

        @media (max-width: 680px) {
          .lb-header,
          .lb-row {
            grid-template-columns: 44px 1fr 80px 85px;
            gap: 0.5rem;
            padding: 0.75rem 0.85rem;
          }

          .lb-col-shame {
            display: none;
          }
        }

        @media (max-width: 440px) {
          .lb-header,
          .lb-row {
            grid-template-columns: 36px 1fr 75px;
          }

          .lb-col-action {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(LeaderboardTable);