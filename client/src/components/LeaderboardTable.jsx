import Link from 'next/link'

// WHY medals: top 3 get special treatment — viral + shareable
const MEDALS = { 0: '🥇', 1: '🥈', 2: '🥉' }

export default function LeaderboardTable({ entries }) {
    if (!entries || entries.length === 0) {
        return (
            <div className="lb-empty font-mono">
                No roasts yet. Be the first to get destroyed.
            </div>
        )
    }

    return (
        <div className="lb-table">

            {/* Header */}
            <div className="lb-header">
                <span className="font-mono lb-head-rank">Rank</span>
                <span className="font-mono lb-head-user">Username</span>
                <span className="font-mono lb-head-score">Best Score</span>
                <span className="font-mono lb-head-count">Roasts</span>
            </div>

            {/* Rows */}
            {entries.map((entry, i) => {
                const scoreColor =
                    entry.bestScore < 40 ? 'var(--bad)' :
                        entry.bestScore < 70 ? 'var(--warn)' :
                            'var(--good)'

                return (
                    <Link
                        key={entry._id}
                        href={`/roast/${entry._id}`}
                        className="lb-row"
                    >
                        <span className="lb-rank font-display">
                            {MEDALS[i] || `#${i + 1}`}
                        </span>

                        <span className="lb-username font-mono">
                            @{entry._id}
                        </span>

                        <span
                            className="lb-score font-display"
                            style={{ color: scoreColor }}
                        >
                            {entry.bestScore}
                        </span>

                        <span className="lb-count font-mono">
                            {entry.roastCount}×
                        </span>
                    </Link>
                )
            })}

            <style jsx>{`
        .lb-empty {
          padding:    2rem;
          text-align: center;
          color:      var(--text-muted);
          font-size:  13px;
        }
        .lb-table { width: 100%; }
        /* Header */
        .lb-header {
          display:               grid;
          grid-template-columns: 48px 1fr 100px 72px;
          padding:               8px 1.25rem;
          border-bottom:         1px solid var(--border);
          background:            var(--bg-elevated);
        }
        .lb-header span {
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color:          var(--text-muted);
        }
        /* Row */
        .lb-row {
          display:               grid;
          grid-template-columns: 48px 1fr 100px 72px;
          align-items:           center;
          padding:               1rem 1.25rem;
          border-bottom:         1px solid var(--border);
          text-decoration:       none;
          transition:            background 0.15s;
          cursor:                pointer;
        }
        .lb-row:last-child { border-bottom: none; }
        .lb-row:hover      { background: var(--bg-elevated); }
        .lb-rank    { font-size: 18px; }
        .lb-username{ font-size: 13px; color: var(--text-primary); }
        .lb-score   { font-size: 24px; }
        .lb-count   { font-size: 12px; color: var(--text-secondary); }
      `}</style>
        </div>
    )
}