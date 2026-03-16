export default function MonthlyComparison({ history }) {
    if (!history || history.length < 2) return null

    // WHY: group into this month vs last month
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()

    const thisMonthRoasts = history.filter(r => {
        const d = new Date(r.createdAt)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })

    const lastMonthRoasts = history.filter(r => {
        const d = new Date(r.createdAt)
        const lm = thisMonth === 0 ? 11 : thisMonth - 1
        const ly = thisMonth === 0 ? thisYear - 1 : thisYear
        return d.getMonth() === lm && d.getFullYear() === ly
    })

    // WHY: need at least one roast in each month to compare
    if (thisMonthRoasts.length === 0 || lastMonthRoasts.length === 0) {
        return null
    }

    const thisAvg = Math.round(
        thisMonthRoasts.reduce((s, r) => s + r.score, 0) / thisMonthRoasts.length
    )
    const lastAvg = Math.round(
        lastMonthRoasts.reduce((s, r) => s + r.score, 0) / lastMonthRoasts.length
    )

    const diff = thisAvg - lastAvg
    // WHY: lower score = worse = more roastable = "improving" for us means LOWER
    const improved = diff < 0
    const unchanged = diff === 0

    const trendLabel = unchanged ? '→ No change'
        : improved ? `↓ ${Math.abs(diff)} pts worse 🔥`
            : `↑ ${Math.abs(diff)} pts better 📈`

    const trendColor = unchanged ? 'var(--text-secondary)'
        : improved ? 'var(--bad)'
            : 'var(--good)'

    const lastMonthName = new Date(
        thisMonth === 0 ? thisYear - 1 : thisYear,
        thisMonth === 0 ? 11 : thisMonth - 1
    ).toLocaleDateString('en-US', { month: 'long' })

    const thisMonthName = now
        .toLocaleDateString('en-US', { month: 'long' })

    return (
        <div className="comparison-wrap">
            <p className="comparison-title font-mono">
                📅 Monthly Comparison
            </p>

            <div className="comparison-grid">
                {/* Last month */}
                <div className="comparison-col">
                    <p className="col-month font-mono">{lastMonthName}</p>
                    <p className="col-score font-display"
                        style={{ color: 'var(--text-secondary)' }}>
                        {lastAvg}
                    </p>
                    <p className="col-label font-mono">avg score</p>
                </div>

                {/* Arrow + trend */}
                <div className="comparison-arrow">
                    <p className="trend-label font-mono"
                        style={{ color: trendColor }}>
                        {trendLabel}
                    </p>
                </div>

                {/* This month */}
                <div className="comparison-col">
                    <p className="col-month font-mono">{thisMonthName}</p>
                    <p className="col-score font-display"
                        style={{ color: trendColor }}>
                        {thisAvg}
                    </p>
                    <p className="col-label font-mono">avg score</p>
                </div>
            </div>

            <style jsx>{`
        .comparison-wrap {
          background:    var(--bg-elevated);
          border:        1px solid var(--border);
          border-radius: var(--radius-md);
          padding:       1.1rem 1.25rem;
        }
        .comparison-title {
          color:          var(--text-muted);
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom:  1rem;
        }
        .comparison-grid {
          display:         flex;
          align-items:     center;
          justify-content: space-between;
          gap:             1rem;
        }
        .comparison-col  { text-align: center; flex: 1; }
        .col-month       { color: var(--text-secondary); font-size: 11px; margin-bottom: 4px; }
        .col-score       { font-size: 38px; line-height: 1; margin: 0; }
        .col-label       { color: var(--text-muted); font-size: 10px; margin-top: 2px; }
        .comparison-arrow{ text-align: center; flex-shrink: 0; }
        .trend-label     { font-size: 12px; white-space: nowrap; }
      `}</style>
        </div>
    )
}