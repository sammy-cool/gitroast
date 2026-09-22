'use client';

import Link from 'next/link';
import { memo } from 'react';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

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
    <div className="lb-table">
      {/* ── Table Header ── */}
      <div className="lb-header">
        <span className="font-mono lb-head-col lb-head-rank">Rank</span>
        <span className="font-mono lb-head-col lb-head-user">Developer</span>
        <span className="font-mono lb-head-col lb-head-score">Score</span>
        <span className="font-mono lb-head-col lb-head-count">Roasts</span>
      </div>

      {/* ── Table Rows ── */}
      <div className="lb-rows">
        {entries.map((entry, i) => {
          const rank = (page - 1) * limit + i + 1;
          const isMedal = page === 1 && MEDALS[rank];
          const scoreColor =
            entry.bestScore < 40
              ? 'var(--bad)'
              : entry.bestScore < 70
              ? 'var(--warn)'
              : 'var(--good)';

          return (
            <Link
              key={entry._id}
              href={`/history/${encodeURIComponent(entry._id)}`}
              className="lb-row-link"
              title={`View @${entry._id}'s roast history`}
            >
              <div className="lb-row">
                <span className={`lb-rank font-display ${isMedal ? 'lb-rank--medal' : ''}`}>
                  {isMedal ? MEDALS[rank] : `#${rank}`}
                </span>

                <div className="lb-user-col">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://avatars.githubusercontent.com/${entry._id}?s=64`}
                    alt={`@${entry._id}`}
                    className="lb-avatar"
                    loading="lazy"
                    crossOrigin="anonymous"
                    width={30}
                    height={30}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="lb-username font-mono">@{entry._id}</span>
                </div>

                <span
                  className="lb-score font-display"
                  style={{ color: scoreColor }}
                >
                  {entry.bestScore}
                </span>

                <span className="lb-count font-mono">
                  {entry.roastCount}×
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        .lb-table {
          width: 100%;
          background: var(--bg-card);
        }

        .lb-empty {
          padding: 3rem 1.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
        }

        /* ── Header ── */
        .lb-header {
          display: grid;
          grid-template-columns: 56px 1fr 88px 68px;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg-elevated);
          align-items: center;
        }

        .lb-head-col {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          color: var(--text-muted);
        }
        .lb-head-rank {
          text-align: center;
        }
        .lb-head-user {
          text-align: left;
        }
        .lb-head-score {
          text-align: center;
        }
        .lb-head-count {
          text-align: right;
        }

        /* ── Rows ── */
        .lb-rows {
          display: flex;
          flex-direction: column;
        }

        /* Native wrapping ensures styled-jsx compiles without scope stripping on Link */
        :global(.lb-row-link) {
          display: block;
          text-decoration: none;
          color: inherit;
          width: 100%;
          outline: none;
        }

        .lb-row {
          display: grid;
          grid-template-columns: 56px 1fr 88px 68px;
          gap: 0.75rem;
          align-items: center;
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          transition: background 0.15s ease;
          cursor: pointer;
        }

        :global(.lb-row-link:last-child) .lb-row {
          border-bottom: none;
        }

        :global(.lb-row-link:hover) .lb-row,
        :global(.lb-row-link:focus-visible) .lb-row {
          background: var(--bg-elevated);
        }

        .lb-rank {
          font-size: 19px;
          color: var(--text-secondary);
          text-align: center;
          line-height: 1;
        }

        .lb-rank--medal {
          font-size: 21px;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4));
        }

        .lb-user-col {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0; /* Critical for text-overflow ellipsis inside grid */
        }

        .lb-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          flex-shrink: 0;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          object-fit: cover;
        }

        .lb-username {
          font-size: 13px;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: color 0.15s ease;
        }

        :global(.lb-row-link:hover) .lb-username {
          color: #ff6b00;
        }

        .lb-score {
          font-size: 24px;
          text-align: center;
          line-height: 1;
        }

        .lb-count {
          font-size: 12px;
          color: var(--text-secondary);
          text-align: right;
        }

        /* ── Mobile Viewport Optimization ── */
        @media (max-width: 520px) {
          .lb-header,
          .lb-row {
            grid-template-columns: 42px 1fr 64px 50px;
            gap: 0.5rem;
            padding: 0.75rem 0.85rem;
          }

          .lb-head-col {
            font-size: 9px;
            letter-spacing: 0.8px;
          }

          .lb-rank {
            font-size: 16px;
          }
          .lb-rank--medal {
            font-size: 18px;
          }

          .lb-avatar {
            width: 24px;
            height: 24px;
          }

          .lb-username {
            font-size: 12px;
          }

          .lb-score {
            font-size: 20px;
          }

          .lb-count {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(LeaderboardTable);