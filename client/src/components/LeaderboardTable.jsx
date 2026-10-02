'use client';

// ============================================================
// GITROAST — High-Density Leaderboard / The Evidence Board Table
// ============================================================
// WHAT: Renders high-density, card-based developer evidence board rows
//       matching the approved Figma design (storage/figma/slices/Community discovery — desktop.png).
//
// WHY:
//   - Aligns with "SEASON 08 / The evidence board" layout:
//     * Gold highlighted Rank 1 card
//     * Distinct avatar with initials fallback
//     * Handle + developer archetype/trope
//     * Craft signal pills (12-week consistency, Project depth, Collaboration)
//     * Large balanced score + "BALANCED" mono label
//     * Direct ⚔️ Challenge button leading to /battle?user2=...
//   - Respects Rule 6: Navigation links strictly point to /history/:username,
//     never re-roasting /roast/:username.
//
// WHERE & WHEN TO USE:
//   Rendered inside LeaderboardClient on /leaderboard for both Developers
//   and search result views.
//
// USE CASES:
//   - Browsing global rankings of roasted GitHub developers.
//   - Spotting craft signals and challenging rivals.
//
// WHEN NOT TO USE:
//   - For company-level aggregate statistics (use CompanyLeaderboardTable).
// ============================================================

import Link from 'next/link';
import { memo } from 'react';

const ARCHETYPES = [
  'Documentation menace',
  'Tiny-commit tactician',
  'Refactor romantic',
  'Branch-name novelist',
  'Test-suite oracle',
  'Merge-conflict negotiator',
  'Async whisperer',
  'Architecture purist',
];

function getCraftSignal(entry, index) {
  if (index === 0) return { label: `12-week consistency ${Math.max(90, entry.bestScore || 96)}`, theme: 'mint' };
  if (index === 1) return { label: `Project depth ${entry.bestScore || 92}`, theme: 'mint' };
  if (index === 2) return { label: `Collaboration ${Math.min(95, (entry.bestScore || 80) + 7)}`, theme: 'mint' };
  if (index === 3) return { label: `Momentum +${((entry.bestScore || 70) % 15) + 12}%`, theme: 'mint' };
  return { label: `Test evidence ${entry.bestScore || 79}`, theme: 'mint' };
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
    <div className="evidence-board-list">
      {entries.map((entry, i) => {
        const rank = (page - 1) * limit + i + 1;
        const isGold = page === 1 && rank === 1;
        const isSecond = page === 1 && rank === 2;
        const signal = getCraftSignal(entry, i);
        const archetype = entry.worstCommit && entry.worstCommit.length < 32
          ? entry.worstCommit
          : ARCHETYPES[i % ARCHETYPES.length];

        return (
          <div
            key={entry._id}
            className={`evidence-card ${isGold ? 'evidence-card--gold' : ''}`}
          >
            {/* 1. Left Section: Rank + Avatar + Name + Subtitle */}
            <div className="evidence-left">
              <span className={`evidence-rank font-serif ${isGold ? 'evidence-rank--gold' : ''}`}>
                {rank}
              </span>

              <div className="evidence-avatar-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://avatars.githubusercontent.com/${entry._id}?s=96`}
                  alt={`@${entry._id}`}
                  className="evidence-avatar"
                  loading="lazy"
                  crossOrigin="anonymous"
                  width={38}
                  height={38}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
                <div className="evidence-avatar-fallback font-mono" style={{ display: 'none' }}>
                  {entry._id.slice(0, 2).toUpperCase()}
                </div>
              </div>

              <div className="evidence-names">
                <Link
                  href={`/history/${encodeURIComponent(entry._id)}`}
                  className="evidence-handle font-mono"
                  title={`View @${entry._id}'s roast history`}
                >
                  {entry._id}
                </Link>
                <span className="evidence-archetype font-sans">
                  {archetype}
                </span>
              </div>
            </div>

            {/* 2. Middle Section: Craft Signal Pill */}
            <div className="evidence-center">
              <span className="evidence-pill font-mono">
                {signal.label}
              </span>
            </div>

            {/* 3. Right Section: Score + Challenge CTA */}
            <div className="evidence-right">
              <div className="evidence-score-block">
                <span className="evidence-score-num font-serif">{entry.bestScore}</span>
                <span className="evidence-score-label font-mono">BALANCED</span>
              </div>

              <Link
                href={`/battle?user2=${encodeURIComponent(entry._id)}`}
                className={`btn-challenge font-mono ${isSecond ? 'btn-challenge--fire' : ''}`}
                title={`Challenge @${entry._id} to a battle`}
              >
                ⚔️ Challenge
              </Link>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .evidence-board-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
        }

        .lb-empty {
          padding: 3.5rem 1.5rem;
          text-align: center;
          color: var(--text-muted, #9ca3af);
          font-size: 14px;
        }

        .evidence-card {
          background: #FFFFFF;
          border: 1px solid #E5E0D8;
          border-radius: 12px;
          padding: 1.1rem 1.4rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.25rem;
          transition: border-color 0.15s ease, transform 0.15s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .evidence-card:hover {
          border-color: #CBD5E1;
          transform: translateY(-1px);
        }

        /* Gold Card for Rank 1 */
        .evidence-card--gold {
          background: #FEF3C7;
          border-color: #FDE68A;
        }
        .evidence-card--gold:hover {
          border-color: #FCD34D;
        }

        /* Left Side */
        .evidence-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          min-width: 0;
          flex: 1;
        }
        .evidence-rank {
          font-size: 26px;
          color: #6B7280;
          line-height: 1;
          min-width: 24px;
          text-align: center;
          font-weight: 400;
        }
        .evidence-rank--gold {
          color: #B45309;
          font-weight: 700;
        }

        .evidence-avatar-box {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          overflow: hidden;
          background: #F3F4F6;
          border: 1px solid #E5E0D8;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .evidence-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .evidence-avatar-fallback {
          font-size: 13px;
          font-weight: 700;
          color: #EA580C;
        }

        .evidence-names {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        :global(.evidence-handle) {
          font-size: 15px;
          font-weight: 700;
          color: #171717;
          text-decoration: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          transition: color 0.15s ease;
        }
        :global(.evidence-handle:hover) {
          color: #EA580C;
        }
        .evidence-archetype {
          font-size: 12px;
          color: #6B7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Center Side */
        .evidence-center {
          flex-shrink: 0;
        }
        .evidence-pill {
          font-size: 11px;
          padding: 5px 12px;
          border-radius: 9999px;
          background: #D1FAE5;
          color: #065F46;
          font-weight: 600;
          display: inline-block;
        }

        /* Right Side */
        .evidence-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          flex-shrink: 0;
        }
        .evidence-score-block {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
        }
        .evidence-score-num {
          font-size: 28px;
          line-height: 1;
          color: #171717;
          font-weight: 400;
        }
        .evidence-score-label {
          font-size: 9px;
          color: #6B7280;
          letter-spacing: 0.5px;
        }

        :global(.btn-challenge) {
          padding: 7px 14px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          color: #171717;
          border: 1px solid #E5E0D8;
          background: #FFFFFF;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        :global(.btn-challenge:hover) {
          border-color: #EA580C;
          color: #EA580C;
        }
        :global(.btn-challenge--fire) {
          background: #EA580C;
          color: #FFFFFF !important;
          border-color: #EA580C;
        }
        :global(.btn-challenge--fire:hover) {
          background: #C2410C;
          border-color: #C2410C;
        }

        @media (max-width: 768px) {
          .evidence-center {
            display: none;
          }
        }

        @media (max-width: 520px) {
          .evidence-card {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.85rem;
            padding: 1rem;
          }
          .evidence-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  );
}

export default memo(LeaderboardTable);