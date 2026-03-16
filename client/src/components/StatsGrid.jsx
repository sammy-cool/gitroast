// WHY no 'use client': this component only displays data
//     passed to it — no clicks, no state. Server component is fine.

// WHY stats prop: parent passes in the real GitHub data
//     this component just renders it. Separation of concerns.
export default function StatsGrid({ stats }) {
    return (
        <div className="stats-grid">
            {stats.map((stat, i) => (
                <div
                    key={stat.label}
                    className="stat-box"
                    // WHY: right border on left column items,
                    //      bottom border on top row items
                    style={{
                        borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
                        borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                    }}
                >
                    <p className="stat-label font-mono">{stat.label}</p>
                    <p
                        className="stat-value font-display"
                        style={{ color: stat.bad ? 'var(--bad)' : 'var(--good)' }}
                    >
                        {stat.value}
                    </p>
                    <p className="stat-note font-mono">{stat.note}</p>
                </div>
            ))}

            <style jsx>{`
        .stats-grid {
          display:               grid;
          grid-template-columns: 1fr 1fr;
          border-top:            1px solid var(--border);
          border-bottom:         1px solid var(--border);
        }
        .stat-box {
          padding: 1rem 1.25rem;
        }
        .stat-label {
          color:          var(--text-muted);
          font-size:      9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom:  5px;
        }
        .stat-value {
          font-size:   30px;
          line-height: 1;
          margin:      0 0 3px;
        }
        .stat-note {
          color:     var(--text-secondary);
          font-size: 11px;
        }
      `}</style>
        </div>
    )
}