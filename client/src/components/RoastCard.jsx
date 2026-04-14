'use client'

import StatsGrid from './StatsGrid'
import CommitShame from './CommitShame'
import ShareButtons from './ShareButtons'

export default function RoastCard({ data, onProClick }) {

  const scoreColor =
    data.score < 40 ? 'var(--bad)' :
      data.score < 70 ? 'var(--warn)' :
        'var(--good)'

  // WHY: human-readable grade explanation for tooltip
  const scoreExplain =
    data.score < 40 ? 'Catastrophic — your GitHub is a disaster' :
      data.score < 70 ? 'Rough — needs serious work' :
        data.score < 85 ? 'Decent — but still roastable' :
          'Respectable — we had to dig for this roast'

  return (
    <div className="roast-card card">

      {/* ── Card header ── */}
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

        {/* Score — with tooltip explaining what it means */}
        <div
          className="score-block"
          // WHY title: zero-effort tooltip — explains score on hover
          //     new users don't know if high or low is worse
          title={`Roast Score: ${data.score}/100 — ${scoreExplain}`}
        >
          <div
            className="score-number font-display"
            style={{ color: scoreColor }}
          >
            {data.score}
          </div>
          <div className="score-label font-mono">/100 ROAST SCORE</div>
          {/* WHY: small hint text so mobile users also understand */}
          <div className="score-hint font-mono">
            {data.score < 50 ? 'lower = more roastable' : 'higher = better dev'}
          </div>
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

      {/* ── Roast text ── */}
      <div className="roast-text-block">
        <div className="roast-text-header">
          <p className="roast-text-label font-mono">🔥 The Roast</p>
          {data.roastSource === 'ai' && (
            <span className="ai-badge font-mono">⚡ AI Roast</span>
          )}
        </div>
        <p className="roast-text">&ldquo;{data.roast}&rdquo;</p>
      </div>

      {/* ── Share + Pro buttons ── */}
      {/* WHY roastText passed: ShareButtons needs it for
          "copy roast text" and Twitter pre-fill */}
      <ShareButtons
        username={data.username}
        roastId={data.roastId}
        roastText={data.roast}
        onProClick={onProClick}
      />

      <style jsx>{`
        .roast-card {
          width:     100%;
          max-width: 580px;
        }

        /* Header */
        .card-header {
          padding:         1.25rem 1.5rem;
          background:      linear-gradient(160deg, #111 0%, #180800 100%);
          border-bottom:   1px solid var(--border);
          display:         flex;
          justify-content: space-between;
          align-items:     center;
          gap:             1rem;
          flex-wrap:       wrap;  /* WHY: score wraps below profile on mobile */
        }
        .profile-info {
          display:     flex;
          align-items: center;
          gap:         12px;
          min-width:   0;  /* WHY: prevents overflow in flex container */
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
          /* WHY: long usernames truncate cleanly */
          overflow:      hidden;
          text-overflow: ellipsis;
          white-space:   nowrap;
          max-width:     200px;
        }
        .profile-meta {
          color:     var(--text-secondary);
          font-size: 11px;
          margin:    2px 0 0;
        }

        /* Score */
        .score-block {
          text-align: right;
          flex-shrink: 0;  /* WHY: score never shrinks below its size */
          cursor:     help; /* WHY: hint that tooltip exists */
        }
        /* WHY clamp: 52px on desktop, smaller on mobile */
        .score-number { font-size: clamp(36px, 8vw, 52px); line-height: 1; }
        .score-label  { color: var(--text-muted); font-size: 10px; }
        .score-hint   {
          color:     var(--text-muted);
          font-size: 9px;
          margin-top: 2px;
        }
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
          padding:       1.4rem 1.5rem;
          border-bottom: 1px solid var(--border);
          border-left:   3px solid var(--fire);
          background:    linear-gradient(135deg, #110900 0%, #0F0F0F 100%);
        }
        .roast-text-header {
          display:         flex;
          align-items:     center;
          justify-content: space-between;
          margin-bottom:   10px;
        }
        .roast-text-label {
          color:          var(--fire);
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .roast-text {
          color:       var(--text-primary);
          font-size:   14px;
          line-height: 1.8;
          font-style:  italic;
        }
        .ai-badge {
          font-size:      9px;
          padding:        2px 8px;
          background:     rgba(255, 183, 0, 0.12);
          border:         1px solid rgba(255, 183, 0, 0.35);
          border-radius:  4px;
          color:          var(--fire-warm);
          letter-spacing: 1px;
        }

        /* Mobile */
        @media (max-width: 480px) {
          .card-header {
            /* WHY: on small screens score goes below profile */
            flex-direction: column;
            align-items:    flex-start;
          }
          .score-block { text-align: left; }
          .profile-name { max-width: 100%; }
        }
      `}</style>
    </div>
  )
}