'use client'

// WHERE: client/src/components/BattleCard.jsx

import { useState } from 'react'
import Link from 'next/link'
import { createToast } from 'customizable-toast-notification'

export default function BattleCard({ data }) {
    const [copied, setCopied] = useState(false)

    const {
        user1, user2, winner, loser,
        score1, score2, grade1, grade2,
        battleRoast,
        roast1, roast2,
    } = data

    // WHY: higher score = better dev = loses the roast battle
    //      lower score = more roastable = the winner of shame
    const score1Color = score1 < score2 ? 'var(--bad)' : 'var(--good)'
    const score2Color = score2 < score1 ? 'var(--bad)' : 'var(--good)'

    const isUser1Winner = winner === user1

    function handleShare() {
        const url = window.location.href
        const tweet = `⚔️ GitHub Roast Battle: @${user1} vs @${user2}\n${winner ? `Winner (of shame): @${winner} 💀` : 'It\'s a draw!'}\n\n${url} 🔥 #GitRoast`
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
            '_blank', 'noopener,noreferrer'
        )
        createToast({
            type: 'success', message: '🐦 Battle tweet opened!',
            position: 'top-center', duration: 3000,
        })
    }

    function handleCopyLink() {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                setCopied(true)
                createToast({
                    type: 'success', message: '⚔️ Battle link copied!',
                    position: 'top-center', showProgressBar: true, duration: 3000,
                })
                setTimeout(() => setCopied(false), 2500)
            })
    }

    return (
        <div className="battle-card card" id="battle-card-capture">

            {/* Header */}
            <div className="battle-card-header">
                <p className="battle-card-title font-display text-fire">
                    ⚔️ ROAST BATTLE
                </p>
                <p className="battle-card-sub font-mono">gitroast</p>
            </div>

            {/* Two players */}
            <div className="players-row">

                {/* Player 1 */}
                <div className={`player-block ${isUser1Winner ? 'player-block--loser' : ''}`}>
                    {isUser1Winner && <div className="shame-crown font-mono">💀 MOST ROASTABLE</div>}
                    <div className="player-avatar-box" style={{ borderColor: score1Color }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`https://avatars.githubusercontent.com/${user1}?s=120`}
                            alt={`@${user1}`}
                            className="player-avatar-img"
                            crossOrigin="anonymous"
                            loading="eager"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                if (e.currentTarget.nextSibling) {
                                    e.currentTarget.nextSibling.style.display = 'flex'
                                }
                            }}
                        />
                        <div className="player-avatar-fallback font-display" style={{ display: 'none' }}>
                            {user1[0]?.toUpperCase() || '?'}
                        </div>
                    </div>
                    <Link href={`/history/${user1}`} className="player-link font-mono" title={`View @${user1}'s history`}>
                        <span className="player-name">@{user1}</span>
                    </Link>
                    <div className="player-score font-display" style={{ color: score1Color }}>
                        {score1}
                    </div>
                    <p className="player-score-label font-mono">/100</p>
                    <div className="player-grade font-mono">{grade1}</div>
                    {/* Individual roast */}
                    <p className="player-roast font-mono">
                        &ldquo;{roast1?.slice(0, 100)}{roast1?.length > 100 ? '...' : ''}&rdquo;
                    </p>
                </div>

                {/* VS divider */}
                <div className="vs-col">
                    <div className="vs-text font-display text-fire">VS</div>
                    {winner && (
                        <div className="winner-arrow font-mono">
                            {isUser1Winner ? '←' : '→'}
                        </div>
                    )}
                </div>

                {/* Player 2 */}
                <div className={`player-block ${!isUser1Winner ? 'player-block--loser' : ''}`}>
                    {!isUser1Winner && winner && <div className="shame-crown font-mono">💀 MOST ROASTABLE</div>}
                    <div className="player-avatar-box" style={{ borderColor: score2Color }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`https://avatars.githubusercontent.com/${user2}?s=120`}
                            alt={`@${user2}`}
                            className="player-avatar-img"
                            crossOrigin="anonymous"
                            loading="eager"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                if (e.currentTarget.nextSibling) {
                                    e.currentTarget.nextSibling.style.display = 'flex'
                                }
                            }}
                        />
                        <div className="player-avatar-fallback font-display" style={{ display: 'none' }}>
                            {user2[0]?.toUpperCase() || '?'}
                        </div>
                    </div>
                    <Link href={`/history/${user2}`} className="player-link font-mono" title={`View @${user2}'s history`}>
                        <span className="player-name">@{user2}</span>
                    </Link>
                    <div className="player-score font-display" style={{ color: score2Color }}>
                        {score2}
                    </div>
                    <p className="player-score-label font-mono">/100</p>
                    <div className="player-grade font-mono">{grade2}</div>
                    <p className="player-roast font-mono">
                        &ldquo;{roast2?.slice(0, 100)}{roast2?.length > 100 ? '...' : ''}&rdquo;
                    </p>
                </div>

            </div>

            {/* Battle roast — AI verdict */}
            {battleRoast && (
                <div className="battle-verdict">
                    <p className="verdict-label font-mono">⚔️ THE VERDICT</p>
                    <p className="verdict-text">&ldquo;{battleRoast}&rdquo;</p>
                </div>
            )}

            {/* Winner banner */}
            <div className="winner-banner">
                <p className="winner-text font-display">
                    {winner
                        ? `💀 @${winner} is the most roastable`
                        : "🤝 It's a draw — both equally shameful"}
                </p>
            </div>

            {/* Share buttons */}
            <div className="battle-share">
                <button className="btn btn-primary share-btn" onClick={handleShare}>
                    𝕏 Tweet Battle
                </button>
                <button className="btn btn-ghost share-btn" onClick={handleCopyLink}>
                    {copied ? '✓ Copied!' : '🔗 Copy Link'}
                </button>
            </div>

            <style jsx>{`
        .battle-card { width: 100%; max-width: 680px; }

        /* Header */
        .battle-card-header {
          padding:       1rem 1.5rem;
          background:    linear-gradient(160deg, #111 0%, #180800 100%);
          border-bottom: 1px solid var(--border);
          display:       flex;
          justify-content: space-between;
          align-items:   center;
        }
        .battle-card-title { font-size: 28px; }
        .battle-card-sub   { font-size: 11px; color: var(--text-muted); }

        /* Players row */
        .players-row {
          display:         flex;
          align-items:     stretch;
          border-bottom:   1px solid var(--border);
        }
        .player-block {
          flex:           1;
          display:        flex;
          flex-direction: column;
          align-items:    center;
          padding:        1.25rem 1rem;
          gap:            6px;
          position:       relative;
          transition:     background 0.2s;
        }
        /* WHY loser gets subtle red tint — winner is clear */
        .player-block--loser {
          background: rgba(255, 61, 61, 0.04);
        }
        .shame-crown {
          position:      absolute;
          top:           -1px;
          left:          50%;
          transform:     translateX(-50%);
          font-size:     9px;
          padding:       2px 8px;
          background:    rgba(255, 61, 61, 0.15);
          border:        1px solid rgba(255, 61, 61, 0.3);
          border-radius: var(--radius-sm);
          color:         var(--bad);
          white-space:   nowrap;
          letter-spacing:1px;
        }
        .player-block :global(.player-link) {
          text-decoration: none;
          display:         inline-flex;
        }
        .player-avatar-box {
          width:           56px;
          height:          56px;
          border-radius:   50%;
          background:      #161616;
          border:          2px solid;
          overflow:        hidden;
          display:         flex;
          align-items:     center;
          justify-content: center;
          margin-top:      1rem;
          flex-shrink:     0;
          box-shadow:      0 4px 12px rgba(0, 0, 0, 0.4);
        }
        .player-avatar-img {
          width:       100%;
          height:      100%;
          object-fit:  cover;
          border-radius: 50%;
        }
        .player-avatar-fallback {
          width:           100%;
          height:          100%;
          display:         flex;
          align-items:     center;
          justify-content: center;
          font-size:       24px;
          color:           var(--text-primary);
        }
        .player-name        { font-size: 13px; color: var(--text-primary); text-decoration: none; transition: color 0.15s; }
        .player-block :global(.player-link:hover) .player-name,
        .player-name:hover  { color: var(--fire); }
        .player-score       { font-size: 44px; line-height: 1; }
        .player-score-label { font-size: 10px; color: var(--text-muted); }
        .player-grade {
          font-size:     10px;
          padding:       2px 8px;
          background:    rgba(255, 61, 61, 0.1);
          border:        1px solid rgba(255, 61, 61, 0.2);
          border-radius: var(--radius-sm);
          color:         var(--bad);
        }
        .player-roast {
          font-size:   11px;
          font-style:  italic;
          color:       var(--text-secondary);
          text-align:  center;
          line-height: 1.5;
          padding:     0 4px;
        }

        /* VS divider */
        .vs-col {
          display:        flex;
          flex-direction: column;
          align-items:    center;
          justify-content:center;
          padding:        0 0.75rem;
          gap:            8px;
        }
        .vs-text       { font-size: 28px; }
        .winner-arrow  { font-size: 24px; color: var(--bad); }

        /* Verdict */
        .battle-verdict {
          padding:       1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
          border-left:   3px solid var(--fire);
          background:    linear-gradient(135deg, #110900 0%, #0F0F0F 100%);
        }
        .verdict-label {
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          color:          var(--fire);
          margin-bottom:  10px;
        }
        .verdict-text {
          font-size:   14px;
          font-style:  italic;
          color:       var(--text-primary);
          line-height: 1.8;
        }

        /* Winner banner */
        .winner-banner {
          padding:    1rem 1.5rem;
          background: rgba(255, 61, 61, 0.06);
          border-bottom: 1px solid var(--border);
          text-align: center;
        }
        .winner-text { font-size: 18px; color: var(--bad); }

        /* Share */
        .battle-share {
          padding:  1rem 1.5rem;
          display:  flex;
          gap:      10px;
        }
        .share-btn { flex: 1; padding: 12px; font-size: 14px; }

        @media (max-width: 480px) {
          .players-row   { flex-direction: column; }
          .vs-col        { flex-direction: row; padding: 0.5rem; }
          .winner-arrow  { display: none; }
        }
      `}</style>
        </div>
    )
}