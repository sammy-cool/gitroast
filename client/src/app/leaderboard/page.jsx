'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LeaderboardTable from '@/components/LeaderboardTable'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function LeaderboardPage() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetch(`${API_BASE}/api/history/leaderboard/worst`)
            .then(r => r.json())
            .then(d => setEntries(d.leaderboard || []))
            .catch(() => {
                setEntries([])
                setError(true)
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <main className="lb-page">

            {/* ── Nav — always visible, never skeleton ── */}
            <div className="lb-nav">
                <div className="font-display nav-logo text-fire">GITROAST 🔥</div>
                <button className="btn btn-ghost" onClick={() => router.push('/')}>
                    ← Home
                </button>
            </div>

            {/* ── Header ── */}
            <div className="lb-title-block">
                <h1 className="font-display lb-title text-fire">
                    🏆 Wall of Shame
                </h1>
                <p className="font-mono lb-sub">
                    The most brutally roasted GitHub profiles. Globally.
                </p>
            </div>

            {/* ── Table — skeleton while loading ── */}
            <div className="card lb-card">
                {loading ? (
                    // WHY skeleton rows instead of "Loading the shameful...":
                    //   each row matches exact shape of LeaderboardTable row
                    //   user sees rank column, username column, score, count
                    //   no layout shift when real data arrives
                    //   shimmer gives active loading feedback
                    <div className="lb-skeleton">

                        {/* WHY header row: LeaderboardTable has column headers
                skeleton header makes it clear what columns are coming */}
                        <div className="skel-header-row">
                            <div className="skel skel-col-rank" />
                            <div className="skel skel-col-user" />
                            <div className="skel skel-col-score" />
                            <div className="skel skel-col-count" />
                        </div>

                        {/* WHY 7 rows: leaderboard shows top 10
                7 gives enough visual weight without overdoing it */}
                        {[1, 2, 3, 4, 5, 6, 7].map(i => (
                            <div key={i} className="skel-row">
                                {/* Rank number */}
                                <div className="skel skel-rank" />
                                {/* Avatar + username */}
                                <div className="skel-user-col">
                                    <div className="skel skel-avatar" />
                                    <div className="skel skel-username" />
                                </div>
                                {/* Score badge */}
                                <div className="skel skel-score" />
                                {/* Roast count */}
                                <div className="skel skel-count" />
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    // WHY inline error: fetch failed entirely
                    //     give user context + action to retry
                    <div className="lb-error">
                        <p className="font-mono" style={{ color: 'var(--bad)', marginBottom: '1rem' }}>
                            ❌ Could not load leaderboard. Check your connection.
                        </p>
                        <button
                            className="btn btn-ghost"
                            onClick={() => window.location.reload()}
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    <LeaderboardTable entries={entries} />
                )}
            </div>

            {/* ── CTA ── */}
            <button
                className="btn btn-primary lb-cta"
                onClick={() => router.push('/')}
            >
                🔥 Add Yourself to the List
            </button>

            <style jsx>{`
        .lb-page {
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
        .lb-nav {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          width:           100%;
        }
        .nav-logo { font-size: 22px; }

        /* Header */
        .lb-title-block { text-align: center; }
        .lb-title { font-size: clamp(36px, 10vw, 56px); line-height: 1; }
        .lb-sub   { color: var(--text-secondary); font-size: 13px; margin-top: 8px; }

        /* Card */
        .lb-card { width: 100%; overflow: hidden; }

        /* ── Skeleton ── */
        .lb-skeleton {
          display:        flex;
          flex-direction: column;
          width:          100%;
        }

        /* WHY header row matches LeaderboardTable column layout:
           rank | username | score | count
           same grid so content drops in with zero shift */
        .skel-header-row {
          display:       grid;
          grid-template-columns: 48px 1fr 80px 64px;
          gap:           1rem;
          padding:       0.75rem 1.25rem;
          border-bottom: 1px solid var(--border);
          align-items:   center;
        }
        .skel-row {
          display:       grid;
          grid-template-columns: 48px 1fr 80px 64px;
          gap:           1rem;
          padding:       1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          align-items:   center;
        }
        .skel-row:last-child { border-bottom: none; }

        /* Avatar + username grouped in one cell */
        .skel-user-col {
          display:     flex;
          align-items: center;
          gap:         10px;
        }

        /* WHY shimmer animation:
           moves left→right giving sense of active loading
           colors use CSS vars → matches dark theme perfectly */
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

        /* WHY each size matches real LeaderboardTable cell:
           rank   → small number
           avatar → round image
           username → medium text
           score  → bold number badge
           count  → small number */
        .skel-col-rank  { height: 10px; width: 20px;  }
        .skel-col-user  { height: 10px; width: 80px;  }
        .skel-col-score { height: 10px; width: 40px;  }
        .skel-col-count { height: 10px; width: 30px;  }
        .skel-rank      { height: 20px; width: 28px;  }
        .skel-avatar    {
          width:         32px;
          height:        32px;
          flex-shrink:   0;
          border-radius: 50%;  /* WHY: avatar is circular */
        }
        .skel-username  { height: 12px; width: 120px; }
        .skel-score     { height: 28px; width: 52px; border-radius: var(--radius-md); }
        .skel-count     { height: 12px; width: 28px; }

        @keyframes skelShimmer {
          0%   { background-position:  200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Error state */
        .lb-error {
          padding:        2rem;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          text-align:     center;
        }

        /* CTA */
        .lb-cta { padding: 13px 28px; font-size: 15px; }
      `}</style>
        </main>
    )
}