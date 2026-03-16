'use client'

import { useAuth } from '@/context/AuthContext'

const PLAN_CONFIG = {
    pro_one_time: {
        name: 'Pro — Lifetime',
        period: 'one time',
        color: 'var(--fire)',
        badge: null,
        features: [
            'Unlimited roasts',
            'Public + Private repos',
            'AI-powered roast (Gemini)',
            'HD card — no watermark',
            'Shareable link forever',
            'Monthly score comparison',
        ],
    },
    pro_monthly: {
        name: 'Pro — Monthly',
        period: 'per month',
        color: 'var(--fire-warm)',
        badge: '⚡ Most Popular',
        features: [
            'Everything in Lifetime',
            'Team leaderboard access',
            'Priority AI roasts',
            'Roast history export',
            'Cancel anytime',
        ],
    },
    teams_monthly: {
        name: 'Teams',
        period: 'per month',
        color: 'var(--good)',
        badge: '👥 Teams',
        features: [
            'Everything in Pro Monthly',
            'Up to 10 team members',
            'Private team leaderboard',
            'Team shame dashboard',
            'Monthly team report',
        ],
    },
}

// WHY: price comes from server as "₹199" — already has symbol
//      we just render it directly, no conversion needed
export default function PricingCard({ planKey, price, onSelect }) {
    const config = PLAN_CONFIG[planKey]
    const { isLoggedIn } = useAuth()

    if (!config) return null

    // WHY: split symbol from number for separate styling
    //      "₹199" → symbol "₹" + number "199"
    //      allows bigger number with smaller symbol
    const hasRupee = price?.startsWith('₹')
    const symbol = hasRupee ? '₹' : price?.[0] || ''
    const amount = hasRupee ? price?.slice(1) : price?.slice(1)

    return (
        <div className="pricing-card card">

            {config.badge && (
                <div
                    className="plan-badge font-mono"
                    style={{ color: config.color, borderColor: config.color }}
                >
                    {config.badge}
                </div>
            )}

            <div className="plan-top">
                <p className="plan-name font-mono">{config.name}</p>
                <div className="price-row">
                    {/* WHY: symbol smaller, number bigger — standard pricing UI */}
                    <span
                        className="plan-symbol font-display"
                        style={{ color: config.color }}
                    >
                        {symbol}
                    </span>
                    <span
                        className="plan-price font-display"
                        style={{ color: config.color }}
                    >
                        {amount}
                    </span>
                    <span className="plan-period font-mono">{config.period}</span>
                </div>
                {/* WHY: show INR context so global users understand */}
                <p className="plan-currency font-mono">Indian Rupees (INR)</p>
            </div>

            <ul className="features-list">
                {config.features.map(f => (
                    <li key={f} className="feature-item font-mono">
                        <span style={{ color: config.color }}>✓</span>
                        {' '}{f}
                    </li>
                ))}
            </ul>

            <button
                className="btn plan-cta"
                style={{
                    background: config.color === 'var(--fire)'
                        ? 'var(--fire-grad)'
                        : config.color,
                    color: '#fff',
                    border: 'none',
                }}
                onClick={() => onSelect(planKey)}
            >
                {isLoggedIn ? `Get ${config.name} ⚡` : 'Connect GitHub to Pay'}
            </button>

            <p className="plan-note font-mono">
                Card · UPI · NetBanking · Wallet
            </p>

            <style jsx>{`
        .pricing-card {
          display:        flex;
          flex-direction: column;
          gap:            1.1rem;
          padding:        1.5rem;
          position:       relative;
        }
        .plan-badge {
          position:       absolute;
          top:            -1px;
          right:          -1px;
          font-size:      10px;
          padding:        4px 10px;
          border:         1px solid;
          border-top:     none;
          border-right:   none;
          border-radius:  0 var(--radius-lg) 0 var(--radius-sm);
          letter-spacing: 1px;
          text-transform: uppercase;
          background:     var(--bg-card);
        }
        .plan-top {
          border-bottom:  1px solid var(--border);
          padding-bottom: 1rem;
        }
        .plan-name {
          font-size:      11px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color:          var(--text-secondary);
          margin-bottom:  6px;
        }
        .price-row {
          display:     flex;
          align-items: baseline;
          gap:         2px;
        }
        /* WHY: ₹ symbol slightly smaller than number */
        .plan-symbol { font-size: 22px; line-height: 1; }
        .plan-price  { font-size: 40px; line-height: 1; margin-right: 6px; }
        .plan-period { font-size: 13px; color: var(--text-secondary); }
        .plan-currency {
          font-size:  10px;
          color:      var(--text-muted);
          margin-top: 4px;
          letter-spacing: 0.5px;
        }
        .features-list {
          list-style:     none;
          display:        flex;
          flex-direction: column;
          gap:            8px;
          flex:           1;
        }
        .feature-item { font-size: 13px; color: var(--text-primary); }
        .plan-cta {
          width:          100%;
          padding:        13px;
          border-radius:  var(--radius-md);
          font-size:      15px;
          letter-spacing: 0.5px;
        }
        .plan-cta:hover {
          opacity:   0.9;
          transform: translateY(-1px);
        }
        .plan-note {
          text-align: center;
          color:      var(--text-ghost);
          font-size:  11px;
        }
      `}</style>
        </div>
    )
}