'use client'

import { useAuth } from '@/context/AuthContext'

// WHY: plan config lives here — one place to update UI copy
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

export default function PricingCard({ planKey, price, onSelect }) {
    const config = PLAN_CONFIG[planKey]
    const { isLoggedIn } = useAuth()

    if (!config) return null

    return (
        <div className="pricing-card card">

            {/* ── Popular badge ── */}
            {config.badge && (
                <div
                    className="plan-badge font-mono"
                    style={{ color: config.color, borderColor: config.color }}
                >
                    {config.badge}
                </div>
            )}

            {/* ── Name + price ── */}
            <div className="plan-top">
                <p className="plan-name font-mono">{config.name}</p>
                <div className="price-row">
                    <span
                        className="plan-price font-display"
                        style={{ color: config.color }}
                    >
                        ${price ?? '—'}
                    </span>
                    <span className="plan-period font-mono">{config.period}</span>
                </div>
            </div>

            {/* ── Features list ── */}
            <ul className="features-list">
                {config.features.map(f => (
                    <li key={f} className="feature-item font-mono">
                        <span style={{ color: config.color }}>✓</span>
                        {' '}{f}
                    </li>
                ))}
            </ul>

            {/* ── CTA button ── */}
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

            {/* ── Payment method note ── */}
            <p className="plan-note font-mono">
                Paid securely via PayPal · No card stored on our servers
            </p>

            <style jsx>{`
        .pricing-card {
          display:        flex;
          flex-direction: column;
          gap:            1.1rem;
          padding:        1.5rem;
          position:       relative;
        }
        /* Badge — top right corner */
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
        /* Top section */
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
          gap:         6px;
        }
        .plan-price  { font-size: 40px; line-height: 1; }
        .plan-period { font-size: 13px; color: var(--text-secondary); }
        /* Features */
        .features-list {
          list-style:     none;
          display:        flex;
          flex-direction: column;
          gap:            8px;
          flex:           1;
        }
        .feature-item { font-size: 13px; color: var(--text-primary); }
        /* CTA */
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
        /* Note */
        .plan-note {
          text-align: center;
          color:      var(--text-ghost);
          font-size:  11px;
        }
      `}</style>
        </div>
    )
}