import Link from 'next/link'

export default function HistoryCard({ roast, index }) {
    const scoreColor =
        roast.score < 40 ? 'var(--bad)' :
            roast.score < 70 ? 'var(--warn)' :
                'var(--good)'

    const date = new Date(roast.createdAt)
        .toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        })

    const time = new Date(roast.createdAt)
        .toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit',
        })

    return (
        <div className="history-card">

            {/* ── Left: index + score ── */}
            <div className="card-left">
                <span className="card-index font-mono">#{index + 1}</span>
                <span
                    className="card-score font-display"
                    style={{ color: scoreColor }}
                >
                    {roast.score}
                </span>
                <span className="card-grade font-mono">{roast.grade}</span>
            </div>

            {/* ── Middle: roast snippet + date ── */}
            <div className="card-middle">
                <p className="card-roast">
                    &ldquo;{roast.roastText.length > 120
                        ? roast.roastText.slice(0, 120) + '...'
                        : roast.roastText}&rdquo;
                </p>
                <p className="card-meta font-mono">
                    {date} at {time}
                    {roast.roastSource === 'ai' && (
                        <span className="ai-tag"> · ⚡ AI</span>
                    )}
                </p>
            </div>

            {/* ── Right: language tag ── */}
            {roast.githubSnapshot?.topLanguage && (
                <div className="card-right">
                    <span className="lang-tag font-mono">
                        {roast.githubSnapshot.topLanguage}
                    </span>
                </div>
            )}

            <style jsx>{`
        .history-card {
          display:       flex;
          align-items:   center;
          gap:           1rem;
          padding:       1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          transition:    background 0.15s;
        }
        .history-card:last-child  { border-bottom: none; }
        .history-card:hover       { background: var(--bg-elevated); }
        /* Left */
        .card-left {
          display:        flex;
          flex-direction: column;
          align-items:    center;
          gap:            2px;
          flex-shrink:    0;
          min-width:      48px;
        }
        .card-index { color: var(--text-muted); font-size: 10px; }
        .card-score { font-size: 28px; line-height: 1; }
        .card-grade { font-size: 10px; color: var(--text-secondary); }
        /* Middle */
        .card-middle { flex: 1; min-width: 0; }
        .card-roast  {
          font-size:     13px;
          font-style:    italic;
          color:         var(--text-primary);
          line-height:   1.5;
          margin-bottom: 4px;
          /* WHY: prevent overflow on small screens */
          overflow:      hidden;
          display:       -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .card-meta { font-size: 11px; color: var(--text-muted); }
        .ai-tag    { color: var(--fire-warm); }
        /* Right */
        .card-right  { flex-shrink: 0; }
        .lang-tag {
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-radius: var(--radius-sm);
          padding:       3px 8px;
          font-size:     11px;
          color:         var(--text-secondary);
        }
      `}</style>
        </div>
    )
}