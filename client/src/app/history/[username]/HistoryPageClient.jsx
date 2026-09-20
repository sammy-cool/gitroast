'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createToast } from 'customizable-toast-notification'
import { useRoastHistory } from '@/hooks/useRoastHistory'
import HistoryCard from '@/components/HistoryCard'
import ScoreChart from '@/components/ScoreChart'
import MonthlyComparison from '@/components/MonthlyComparison'
import Breadcrumb from '@/components/Breadcrumb'

export default function HistoryPageClient({ username }) {
    const router = useRouter()
    const {
        history, loading, error, refetch,
        scoreTrend, bestScore, worstScore,
        avgScore, roastCount, hasHistory,
    } = useRoastHistory(username)

    useEffect(() => {
        if (error) {
            createToast({
                type: 'error',
                message: error || 'Failed to load roast history',
                position: 'top-center',
                duration: 5000,
            })
        }
    }, [error])

    // ── Loading state — Skeleton ─────────────────────────────
    // WHY skeleton instead of text + cursor:
    //   skeleton shows the SHAPE of the content coming
    //   user understands what they're waiting for
    //   shimmer animation gives active feedback
    //   text cursor gives no layout context at all
    if (loading) {
        return (
            <div className="history-page">

                {/* Nav stays real — always visible */}
                <div className="history-nav">
                    <div className="font-display nav-logo text-fire">GITROAST 🔥</div>
                    <button className="btn btn-ghost" onClick={() => router.push('/')}>
                        ← Home
                    </button>
                </div>

                <div className="breadcrumb-wrap">
                    <Breadcrumb
                        items={[
                            { label: 'Home', href: '/' },
                            { label: 'Wall of Shame', href: '/leaderboard' },
                            { label: `@${username}` },
                        ]}
                    />
                </div>

                {/* Header skeleton — matches real header card */}
                <div className="skel-card card">
                    <div className="skel-header-inner">
                        <div>
                            <div className="skel skel-title" />
                            <div className="skel skel-sub" />
                        </div>
                        <div className="skel skel-roast-btn" />
                    </div>
                </div>

                {/* Stats skeleton — matches 4-column grid */}
                <div className="stats-summary">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="summary-box">
                            <div className="skel skel-stat-label" />
                            <div className="skel skel-stat-value" />
                        </div>
                    ))}
                </div>

                {/* Chart skeleton */}
                <div className="skel-card card">
                    <div className="skel skel-section-title" />
                    <div className="skel skel-chart" />
                </div>

                {/* Timeline skeleton — 3 history rows */}
                <div className="skel-card card">
                    <div className="skel skel-section-title" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="skel-history-row">
                            <div className="skel skel-score-circle" />
                            <div className="skel-row-mid">
                                <div className="skel skel-roast-text" />
                                <div className="skel skel-roast-text skel-roast-text-sm" />
                                <div className="skel skel-roast-meta" />
                            </div>
                        </div>
                    ))}
                </div>

                <style jsx>{`
          .history-page {
            min-height:     100vh;
            display:        flex;
            flex-direction: column;
            align-items:    center;
            padding:        1.5rem 1rem 6.5rem;
            gap:            1.25rem;
            max-width:      620px;
            margin:         0 auto;
          }
          .history-nav {
            display:         flex;
            justify-content: space-between;
            align-items:     center;
            width:           100%;
          }
          .breadcrumb-wrap {
            width:      100%;
            margin-top: -0.5rem;
          }
          .nav-logo { font-size: 22px; }

          /* Stats grid */
          .stats-summary {
            display:               grid;
            grid-template-columns: repeat(4, 1fr);
            gap:                   10px;
            width:                 100%;
          }
          .summary-box {
            background:    var(--bg-card);
            border:        1px solid var(--border);
            border-radius: var(--radius-md);
            padding:       0.875rem 1rem;
            text-align:    center;
            display:       flex;
            flex-direction:column;
            align-items:   center;
            gap:           8px;
          }

          /* Skeleton card wrapper */
          .skel-card {
            width:   100%;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap:     0.875rem;
          }
          .skel-header-inner {
            display:         flex;
            justify-content: space-between;
            align-items:     center;
            gap:             1rem;
          }

          /* History row skeleton */
          .skel-history-row {
            display:       flex;
            align-items:   flex-start;
            gap:           1rem;
            padding:       1rem 0;
            border-bottom: 1px solid var(--border);
          }
          .skel-history-row:last-child { border-bottom: none; }
          .skel-row-mid {
            flex:           1;
            display:        flex;
            flex-direction: column;
            gap:            8px;
          }

          /* WHY shimmer gradient:
             moves left to right giving sense of loading progress
             color uses CSS vars so it matches dark theme perfectly */
          .skel {
            background: linear-gradient(
              90deg,
              var(--bg-elevated) 25%,
              var(--border-hover, #2E2E2E) 50%,
              var(--bg-elevated) 75%
            );
            background-size: 200% 100%;
            animation:       skelShimmer 1.5s ease-in-out infinite;
            border-radius:   var(--radius-sm);
          }

          /* WHY each size matches the real element exactly:
             user sees skeleton in same position as real content
             no layout shift when real data arrives */
          .skel-title        { height: 36px; width: 55%;  }
          .skel-sub          { height: 10px; width: 35%; margin-top: 6px; }
          .skel-roast-btn    { height: 36px; width: 120px; flex-shrink: 0; border-radius: var(--radius-md); }
          .skel-stat-label   { height: 9px;  width: 70%;  }
          .skel-stat-value   { height: 32px; width: 50%;  }
          .skel-section-title{ height: 9px;  width: 40%;  }
          .skel-chart        { height: 160px;width: 100%; }
          .skel-score-circle { width: 48px; height: 48px; flex-shrink: 0; border-radius: 50%; }
          .skel-roast-text   { height: 12px; width: 92%;  }
          .skel-roast-text-sm{ width: 75%;                }
          .skel-roast-meta   { height: 10px; width: 40%;  }

          @keyframes skelShimmer {
            0%   { background-position:  200% 0; }
            100% { background-position: -200% 0; }
          }

          @media (max-width: 480px) {
            .stats-summary { grid-template-columns: repeat(2, 1fr); }
          }
        `}</style>
            </div>
        )
    }

    // ── Error state ──────────────────────────────────────────
    // WHY toast + inline: toast catches attention immediately
    //     inline error gives context about what failed
    if (error) {
        return (
            <div className="history-error">
                <p className="font-mono" style={{ color: 'var(--bad)', marginBottom: '1rem' }}>
                    ❌ {error}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-primary" onClick={refetch}>
                        Try Again
                    </button>
                    <button className="btn btn-ghost" onClick={() => router.push('/')}>
                        ← Home
                    </button>
                </div>
                <style jsx>{`
          .history-error {
            min-height:      100vh;
            display:         flex;
            flex-direction:  column;
            align-items:     center;
            justify-content: center;
            gap:             0.5rem;
          }
        `}</style>
            </div>
        )
    }

    // ── Loaded state ─────────────────────────────────────────
    return (
        <main className="history-page">

            {/* ── Nav ── */}
            <div className="history-nav">
                <div className="font-display nav-logo text-fire">GITROAST 🔥</div>
                <button className="btn btn-ghost" onClick={() => router.push('/')}>
                    ← Home
                </button>
            </div>

            <div className="breadcrumb-wrap">
                <Breadcrumb
                    items={[
                        { label: 'Home', href: '/' },
                        { label: 'Wall of Shame', href: '/leaderboard' },
                        { label: `@${username}` },
                    ]}
                />
            </div>

            {/* ── Profile header ── */}
            <div className="history-header card">
                <div className="header-user-info">
                    <div className="history-avatar-box">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`https://avatars.githubusercontent.com/${username}?s=96`}
                            alt={`@${username}`}
                            className="history-avatar-img"
                            crossOrigin="anonymous"
                            loading="eager"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                if (e.currentTarget.nextSibling) {
                                    e.currentTarget.nextSibling.style.display = 'flex';
                                }
                            }}
                        />
                        <div className="history-avatar-fallback font-display" style={{ display: 'none' }}>
                            {username[0]?.toUpperCase() || '?'}
                        </div>
                    </div>
                    <div>
                        <h1 className="font-display header-title text-fire">
                            @{username}
                        </h1>
                        <p className="font-mono header-sub">Roast History</p>
                    </div>
                </div>
                <button
                    className="btn btn-primary roast-again-btn"
                    onClick={() => router.push(`/roast/${username}`)}
                >
                    🔥 Roast Again
                </button>
            </div>

            {!hasHistory ? (
                // ── Empty state ────────────────────────────────────
                <div className="empty-state card">
                    <p className="font-display empty-title text-fire">NO HISTORY YET</p>
                    <p className="font-mono empty-sub">
                        @{username} hasn&apos;t been roasted yet.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => router.push(`/roast/${username}`)}
                    >
                        🔥 Be the First to Roast Them
                    </button>
                </div>
            ) : (
                <>
                    {/* ── Stats summary ── */}
                    <div className="stats-summary">
                        {[
                            { label: 'Total Roasts', value: roastCount, color: 'var(--fire)' },
                            { label: 'Best Score', value: bestScore, color: 'var(--good)' },
                            { label: 'Worst Score', value: worstScore, color: 'var(--bad)' },
                            { label: 'Avg Score', value: avgScore, color: 'var(--warn)' },
                        ].map(stat => (
                            <div key={stat.label} className="summary-box">
                                <p className="font-mono summary-label">{stat.label}</p>
                                <p
                                    className="font-display summary-value"
                                    style={{ color: stat.color }}
                                >
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* ── Score chart ── */}
                    <div className="section-card card">
                        <p className="section-title font-mono">📈 Score Over Time</p>
                        {scoreTrend !== null && (
                            <p className="trend-hint font-mono">
                                Last roast was{' '}
                                <span style={{
                                    color: scoreTrend > 0 ? 'var(--good)' : 'var(--bad)'
                                }}>
                                    {scoreTrend > 0
                                        ? `↑ ${scoreTrend} pts better`
                                        : scoreTrend < 0
                                            ? `↓ ${Math.abs(scoreTrend)} pts worse 🔥`
                                            : '→ same score'}
                                </span>
                                {' '}than the one before
                            </p>
                        )}
                        <ScoreChart history={history} />
                    </div>

                    {/* ── Monthly comparison ── */}
                    <MonthlyComparison history={history} />

                    {/* ── Roast timeline ── */}
                    <div className="section-card card">
                        <p className="section-title font-mono">
                            🔥 All Roasts ({roastCount})
                        </p>
                        {history.map((roast, i) => (
                            <HistoryCard key={roast._id} roast={roast} index={i} />
                        ))}
                    </div>
                </>
            )}

            <style jsx>{`
        .history-page {
          min-height:     100vh;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          padding:        1.5rem 1rem 6.5rem;
          gap:            1.25rem;
          max-width:      620px;
          margin:         0 auto;
        }
        /* Nav */
        .history-nav {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          width:           100%;
        }
        .breadcrumb-wrap {
          width:      100%;
          margin-top: -0.5rem;
        }
        .nav-logo { font-size: 22px; }
        /* Header */
        .history-header {
          width:           100%;
          padding:         1.25rem 1.5rem;
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          gap:             1rem;
          flex-wrap:       wrap;
        }
        .header-user-info {
          display:         flex;
          align-items:     center;
          gap:             14px;
        }
        .history-avatar-box {
          width:           52px;
          height:          52px;
          border-radius:   50%;
          background:      #161616;
          border:          2px solid rgba(255, 69, 0, 0.4);
          overflow:        hidden;
          display:         flex;
          align-items:     center;
          justify-content: center;
          flex-shrink:     0;
          box-shadow:      0 4px 14px rgba(0, 0, 0, 0.4);
        }
        .history-avatar-img {
          width:           100%;
          height:          100%;
          object-fit:      cover;
          border-radius:   50%;
        }
        .history-avatar-fallback {
          width:           100%;
          height:          100%;
          display:         flex;
          align-items:     center;
          justify-content: center;
          font-size:       22px;
          color:           var(--fire);
        }
        .header-title    { font-size: 32px; line-height: 1; }
        .header-sub      { color: var(--text-secondary); font-size: 12px; margin-top: 4px; }
        .roast-again-btn { padding: 10px 18px; font-size: 14px; }
        /* Stats summary */
        .stats-summary {
          display:               grid;
          grid-template-columns: repeat(4, 1fr);
          gap:                   10px;
          width:                 100%;
        }
        .summary-box {
          background:    var(--bg-card);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          padding:       0.875rem 1rem;
          text-align:    center;
        }
        .summary-label {
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color:          var(--text-muted);
          margin-bottom:  4px;
        }
        .summary-value { font-size: 28px; line-height: 1; }
        /* Section cards */
        .section-card { width: 100%; }
        .section-title {
          padding:        1rem 1.25rem 0;
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color:          var(--text-muted);
          margin-bottom:  0.5rem;
        }
        .trend-hint {
          padding:   0 1.25rem 0.5rem;
          font-size: 12px;
          color:     var(--text-secondary);
        }
        /* Empty state */
        .empty-state {
          width:           100%;
          padding:         3rem 1.5rem;
          display:         flex;
          flex-direction:  column;
          align-items:     center;
          gap:             1rem;
          text-align:      center;
        }
        .empty-title { font-size: 36px; }
        .empty-sub   { color: var(--text-secondary); font-size: 13px; }
        /* Mobile */
        @media (max-width: 480px) {
          .stats-summary { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
        </main>
    )
}