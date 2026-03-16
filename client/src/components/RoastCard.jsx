'use client'

import StatsGrid from './StatsGrid'
import CommitShame from './CommitShame'
import ShareButtons from './ShareButtons'

// WHY these props: RoastCard only displays data
//     all fetching + logic happens in the page above it
export default function RoastCard({ data, onProClick }) {

    // WHY: score color changes based on how bad it is
    const scoreColor =
        data.score < 40 ? 'var(--bad)' :
            data.score < 70 ? 'var(--warn)' :
                'var(--good)'

    return (
        <div className="roast-card card">

            {/* ── Card header — profile + score ── */}
            <div className="card-header">

                {/* Avatar + username */}
                <div className="profile-info">
                    <div className="avatar font-display">
                        {data.username[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="profile-name">@{data.username}</p>
                        <p className="profile-meta font-mono">
                            Member since {data.joinYear} · {data.totalRepos} repos
                        </p>
                    </div>
                </div>

                {/* Score */}
                <div className="score-block">
                    <div
                        className="score-number font-display"
                        style={{ color: scoreColor }}
                    >
                        {data.score}
                    </div>
                    <div className="score-label font-mono">/100 ROAST SCORE</div>
                    <div
                        className="grade-badge font-mono"
                        style={{ color: 'var(--bad)' }}
                    >
                        GRADE: {data.grade}
                    </div>
                </div>
            </div>

            {/* ── Stats grid ── */}
            <StatsGrid stats={data.stats} />

            {/* ── Hall of shame commits ── */}
            <CommitShame commits={data.shameCommits} />

            {/* ── The actual roast text ── */}
            <div className="roast-text-block">
                <div className="roast-text-header">
                    <p className="roast-text-label font-mono">🔥 The Roast</p>
                    {/* WHY: show badge if Claude generated this roast */}
                    {data.roastSource === 'claude' && (
                        <span className="ai-badge font-mono">⚡ AI Roast</span>
                    )}
                </div>
                <p className="roast-text">&ldquo;{data.roast}&rdquo;</p>
            </div>

            {/* ── Share + Pro buttons ── */}
            <ShareButtons
                username={data.username}
                roastId={data.roastId}
                onProClick={onProClick}
            />

            <style jsx>{`
        .roast-card {
          width:     100%;
          max-width: 580px;
        }
        /* Header */
        .card-header {
          padding:    1.25rem 1.5rem;
          background: linear-gradient(160deg, #111 0%, #180800 100%);
          border-bottom: 1px solid var(--border);
          display:    flex;
          justify-content: space-between;
          align-items:     center;
          gap:             1rem;
          flex-wrap:       wrap;
        }
        .profile-info {
          display:     flex;
          align-items: center;
          gap:         12px;
        }
        .avatar {
          width:           44px;
          height:          44px;
          border-radius:   50%;
          background:      #161616;
          border:          2px solid rgba(255, 69, 0, 0.35);
          display:         flex;
          align-items:     center;
          justify-content: center;
          font-size:       18px;
          color:           var(--fire);
          flex-shrink:     0;
        }
        .profile-name {
          font-weight: 600;
          font-size:   15px;
          margin:      0;
        }
        .profile-meta {
          color:     var(--text-secondary);
          font-size: 11px;
          margin:    2px 0 0;
        }
        /* Score */
        .score-block  { text-align: right; }
        .score-number { font-size: 52px; line-height: 1; }
        .score-label  { color: var(--text-muted); font-size: 10px; }
        .grade-badge  {
          display:       inline-block;
          margin-top:    4px;
          padding:       2px 8px;
          background:    rgba(255, 61, 61, 0.12);
          border:        1px solid rgba(255, 61, 61, 0.25);
          border-radius: var(--radius-sm);
          font-size:     11px;
          font-weight:   600;
        }
        /* Roast text */
        .roast-text-block {
          padding:     1.4rem 1.5rem;
          border-bottom: 1px solid var(--border);
          border-left: 3px solid var(--fire);
          background:  linear-gradient(135deg, #110900 0%, #0F0F0F 100%);
        }
        .roast-text-label {
          color:          var(--fire);
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom:  10px;
        }
        .roast-text {
          color:       var(--text-primary);
          font-size:   14px;
          line-height: 1.8;
          font-style:  italic;
        }
        .roast-text-header {
          display:     flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .roast-text-label { margin-bottom: 0; }
        .ai-badge {
          font-size:     9px;
          padding:       2px 8px;
          background:    rgba(255, 183, 0, 0.12);
          border:        1px solid rgba(255, 183, 0, 0.35);
          border-radius: 4px;
          color:         var(--fire-warm);
          letter-spacing: 1px;
        }
      `}</style>
        </div>
    )
}