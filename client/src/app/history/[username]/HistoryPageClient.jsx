'use client'

import { useRouter } from 'next/navigation'
import { useRoastHistory } from '@/hooks/useRoastHistory'
import HistoryCard from '@/components/HistoryCard'
import ScoreChart from '@/components/ScoreChart'
import MonthlyComparison from '@/components/MonthlyComparison'

export default function HistoryPageClient({ username }) {
    const router = useRouter()
    const {
        history, loading, error, refetch,
        scoreTrend, bestScore, worstScore,
        avgScore, roastCount, hasHistory,
    } = useRoastHistory(username)

    // ── Loading state ────────────────────────────────────────
    if (loading) {
        return (
            <div className="history-loading">
                <p className="font-mono" style={{ color: 'var(--fire)' }}>
                    $ loading history for @{username}
                    <span className="animate-blink" style={{
                        display: 'inline-block',
                        width: '2px',
                        height: '13px',
                        background: 'var(--fire)',
                        verticalAlign: 'middle',
                        marginLeft: '4px',
                        borderRadius: '1px',
                    }} />
                </p>
                <style jsx>{`
          .history-loading {
            min-height:      100vh;
            display:         flex;
            align-items:     center;
            justify-content: center;
          }
        `}</style>
            </div>
        )
    }

    // ── Error state ──────────────────────────────────────────
    if (error) {
        return (
            <div className="history-error">
                <p className="font-mono" style={{ color: 'var(--bad)', marginBottom: '1rem' }}>
                    ❌ {error}
                </p>
                <button className="btn btn-ghost" onClick={refetch}>
                    Try Again
                </button>
                <style jsx>{`
          .history-error {
            min-height:      100vh;
            display:         flex;
            flex-direction:  column;
            align-items:     center;
            justify-content: center;
          }
        `}</style>
            </div>
        )
    }

    return (
        <main className="history-page">

            {/* ── Nav ── */}
            <div className="history-nav">
                <div className="font-display nav-logo text-fire">GITROAST 🔥</div>
                <button className="btn btn-ghost" onClick={() => router.push('/')}>
                    ← Home
                </button>
            </div>

            {/* ── Profile header ── */}
            <div className="history-header card">
                <div>
                    <h1 className="font-display header-title text-fire">
                        @{username}
                    </h1>
                    <p className="font-mono header-sub">Roast History</p>
                </div>
                <button
                    className="btn btn-primary roast-again-btn"
                    onClick={() => router.push(`/roast/${username}`)}
                >
                    🔥 Roast Again
                </button>
            </div>

            {!hasHistory ? (
                // ── Empty state ──────────────────────────────────
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
                            { label: 'Best Score', value: bestScore, color: 'var(--bad)' },
                            { label: 'Worst Score', value: worstScore, color: 'var(--good)' },
                            { label: 'Avg Score', value: avgScore, color: 'var(--warn)' },
                        ].map(stat => (
                            <div key={stat.label} className="summary-box">
                                <p className="font-mono summary-label">{stat.label}</p>
                                <p className="font-display summary-value"
                                    style={{ color: stat.color }}>
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
          padding:        1.5rem 1rem 3rem;
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
        .header-title { font-size: 32px; line-height: 1; }
        .header-sub   { color: var(--text-secondary); font-size: 12px; margin-top: 4px; }
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