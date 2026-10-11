export default function MonthlyComparison({ history }) {
    if (!history || history.length < 2) return null

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

    if (thisMonthRoasts.length === 0 || lastMonthRoasts.length === 0) {
        return null
    }

    const thisAvg = Math.round(
        thisMonthRoasts.reduce((s, r) => s + (Number(r.score) || 0), 0) / thisMonthRoasts.length
    )
    const lastAvg = Math.round(
        lastMonthRoasts.reduce((s, r) => s + (Number(r.score) || 0), 0) / lastMonthRoasts.length
    )

    const diff = thisAvg - lastAvg
    const improved = diff < 0
    const unchanged = diff === 0

    const trendLabel = unchanged ? '→ No change'
        : improved ? `↓ ${Math.abs(diff)} pts lower`
            : `↑ ${Math.abs(diff)} pts higher`

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
        <section className="gr-card mc" aria-label="Monthly comparison">
            <p className="gr-eyebrow">Monthly comparison</p>
            <div className="mc__grid">
                <div className="mc__col">
                    <span className="gr-mono mc__m">{lastMonthName}</span>
                    <b className="mc__v">{lastAvg}</b>
                    <span className="gr-help">average score</span>
                </div>
                <p className="mc__trend" style={{ color: trendColor }}>{trendLabel}</p>
                <div className="mc__col">
                    <span className="gr-mono mc__m">{thisMonthName}</span>
                    <b className="mc__v" style={{ color: trendColor }}>{thisAvg}</b>
                    <span className="gr-help">average score</span>
                </div>
            </div>
            <style jsx>{`
        .mc__grid { display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center; margin-top: 12px; text-align: center; }
        .mc__col { display: grid; gap: 2px; }
        .mc__m { font-size: 11px; text-transform: uppercase; color: var(--ink-2); }
        .mc__v { font: 400 48px/1 var(--font-serif); }
        .mc__trend { font: 600 14px var(--font-sans); }
        @media (max-width: 560px) { .mc__grid { grid-template-columns: 1fr; } }
      `}</style>
        </section>
    )
}
