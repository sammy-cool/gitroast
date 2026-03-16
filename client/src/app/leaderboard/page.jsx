'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LeaderboardTable from '@/components/LeaderboardTable'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function LeaderboardPage() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetch(`${API_BASE}/api/history/leaderboard/worst`)
            .then(r => r.json())
            .then(d => setEntries(d.leaderboard || []))
            .catch(() => setEntries([]))
            .finally(() => setLoading(false))
    }, [])

    return (
        <main className="lb-page">

            {/* Nav */}
            <div className="lb-nav">
                <div className="font-display nav-logo text-fire">GITROAST 🔥</div>
                <button className="btn btn-ghost" onClick={() => router.push('/')}>
                    ← Home
                </button>
            </div>

            {/* Header */}
            <div className="lb-title-block">
                <h1 className="font-display lb-title text-fire">
                    🏆 Wall of Shame
                </h1>
                <p className="font-mono lb-sub">
                    The most brutally roasted GitHub profiles. Globally.
                </p>
            </div>

            {/* Table */}
            <div className="card lb-card">
                {loading ? (
                    <p className="font-mono lb-loading">
                        Loading the shameful...
                    </p>
                ) : (
                    <LeaderboardTable entries={entries} />
                )}
            </div>

            {/* CTA */}
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
        .lb-nav {
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          width:           100%;
        }
        .nav-logo      { font-size: 22px; }
        .lb-title-block{ text-align: center; }
        .lb-title      { font-size: clamp(36px, 10vw, 56px); line-height: 1; }
        .lb-sub        { color: var(--text-secondary); font-size: 13px; margin-top: 8px; }
        .lb-card       { width: 100%; overflow: hidden; }
        .lb-loading    {
          padding:    2rem;
          text-align: center;
          color:      var(--text-muted);
          font-size:  13px;
        }
        .lb-cta        { padding: 13px 28px; font-size: 15px; }
      `}</style>
        </main>
    )
}