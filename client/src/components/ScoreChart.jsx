'use client';

export default function ScoreChart({ history }) {
    if (!history || history.length < 2) {
        return (
            <div className="chart-empty">
                <p className="font-mono">
                    Roast at least twice to see your trend.
                </p>
                <style jsx>{`
          .chart-empty {
            padding:    2rem;
            text-align: center;
            color:      var(--text-muted);
            font-size:  13px;
          }
        `}</style>
            </div>
        )
    }

    const W = 540
    const H = 160
    const PAD_L = 40
    const PAD_R = 20
    const PAD_T = 20
    const PAD_B = 30
    const chartW = W - PAD_L - PAD_R
    const chartH = H - PAD_T - PAD_B

    const sorted = [...history].reverse().filter(r => typeof r?.score === 'number' && !isNaN(r.score))
    if (sorted.length < 2) {
        return (
            <div className="chart-empty">
                <p className="font-mono">
                    Roast at least twice to see your trend.
                </p>
                <style jsx>{`
          .chart-empty {
            padding:    2rem;
            text-align: center;
            color:      var(--text-muted);
            font-size:  13px;
          }
        `}</style>
            </div>
        )
    }
    const scores = sorted.map(r => r.score)
    const minScore = Math.max(0, Math.min(...scores) - 10)
    const maxScore = Math.min(100, Math.max(...scores) + 10)
    const scoreRange = maxScore - minScore || 1

    function toX(i) {
        return PAD_L + (i / (sorted.length - 1)) * chartW
    }
    function toY(score) {
        return PAD_T + ((maxScore - score) / scoreRange) * chartH
    }

    const points = sorted
        .map((r, i) => `${toX(i)},${toY(r.score)}`)
        .join(' ')

    const firstX = toX(0)
    const lastX = toX(sorted.length - 1)
    const baseY = PAD_T + chartH
    const areaPath = `M${firstX},${baseY} L${points.split(' ').map(p => p).join(' L')} L${lastX},${baseY} Z`

    function scoreColor(score) {
        if (score < 40) return 'var(--bad)'
        if (score < 70) return 'var(--warn)'
        return 'var(--good)'
    }

    return (
        <div className="chart-wrap">
            <svg
                width="100%"
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="xMidYMid meet"
            >
                {}
                {[0, 25, 50, 75, 100].map(val => {
                    const y = toY(val)
                    if (y < PAD_T || y > PAD_T + chartH) return null
                    return (
                        <g key={val}>
                            <line
                                x1={PAD_L} y1={y}
                                x2={W - PAD_R} y2={y}
                                stroke="var(--border)"
                                strokeWidth="0.5"
                                strokeDasharray="4 4"
                            />
                            <text
                                x={PAD_L - 6} y={y}
                                textAnchor="end"
                                dominantBaseline="central"
                                fill="var(--text-muted)"
                                fontSize="9"
                                fontFamily="var(--font-mono)"
                            >
                                {val}
                            </text>
                        </g>
                    )
                })}

                {}
                <path
                    d={areaPath}
                    fill="var(--fire)"
                    opacity="0.06"
                />

                {}
                <polyline
                    points={points}
                    fill="none"
                    stroke="var(--fire)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                />

                {}
                {sorted.map((r, i) => {
                    const x = toX(i)
                    const y = toY(r.score)
                    const color = scoreColor(r.score)
                    const date = new Date(r.createdAt)
                        .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

                    return (
                        <g key={i}>
                            {}
                            <circle cx={x} cy={y} r={6}
                                fill="var(--bg-card)"
                                stroke={color}
                                strokeWidth="1.5"
                            />
                            {}
                            <circle cx={x} cy={y} r={2.5}
                                fill={color}
                            />
                            {}
                            <text
                                x={x} y={y - 12}
                                textAnchor="middle"
                                fill={color}
                                fontSize="10"
                                fontFamily="var(--font-mono)"
                                fontWeight="500"
                            >
                                {r.score}
                            </text>
                            {}
                            <text
                                x={x} y={H - 4}
                                textAnchor="middle"
                                fill="var(--text-muted)"
                                fontSize="9"
                                fontFamily="var(--font-mono)"
                            >
                                {date}
                            </text>
                        </g>
                    )
                })}
            </svg>

            <style jsx>{`
        .chart-wrap {
          padding: 1rem 0.5rem 0;
          width:   100%;
        }
      `}</style>
        </div>
    )
}

