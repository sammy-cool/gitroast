'use client'

// WHY: Razorpay checkout.js loaded from Razorpay's CDN
//      No npm package needed on frontend — zero dependency
//      Razorpay maintains and updates it themselves

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createToast } from 'customizable-toast-notification'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

const PLAN_LABELS = {
    pro_one_time: 'Pro — Lifetime',
    pro_monthly: 'Pro — Monthly',
    teams_monthly: 'Teams — Monthly',
}

export default function PaymentFlow({ planKey, price, onSuccess, onCancel }) {
    const { getToken, user } = useAuth()
    const [status, setStatus] = useState('sdk_loading')
    const [errorMsg, setErrorMsg] = useState('')

    // ── Step 1: Load Razorpay checkout script ────────────────
    useEffect(() => {
        // WHY: check if already loaded — avoid duplicate scripts
        if (window.Razorpay) {
            setStatus('ready')
            return
        }

        const existing = document.getElementById('razorpay-sdk')
        if (existing) {
            existing.addEventListener('load', () => setStatus('ready'))
            return
        }

        const script = document.createElement('script')
        script.id = 'razorpay-sdk'
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => setStatus('ready')
        script.onerror = () => {
            setStatus('error')
            setErrorMsg('Razorpay failed to load. Check your connection.')
            createToast({
                type: 'error',
                message: 'Payment SDK failed to load. Check connection.',
                position: 'top-center',
            })
        }
        document.body.appendChild(script)
    }, [])

    // ── Handle Pay button click ──────────────────────────────
    async function handlePayment() {
        setStatus('creating')

        try {
            // ── Step 2: Create order on our backend ─────────────
            // WHY: order must be created server-side with Key Secret
            //      frontend only gets order_id back — Key Secret stays hidden
            const res = await fetch(`${API_BASE}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ plan: planKey }),
            })

            const json = await res.json()
            if (!json.success) throw new Error(json.message)

            // ── Step 3: Open Razorpay checkout popup ─────────────
            // WHY options structure: exactly what Razorpay SDK requires
            const options = {
                key: json.keyId || RAZORPAY_KEY,
                amount: json.amount,      // WHY: in cents — Razorpay requirement
                currency: json.currency,
                name: 'GitRoast 🔥',
                description: json.description,
                order_id: json.orderId,     // WHY: MUST match server-created order
                // WHY prefill: improves UX — user doesn't retype email
                prefill: {
                    email: user?.email || '',
                    name: user?.username || '',
                },
                notes: {
                    plan: planKey,
                },
                theme: {
                    // WHY: matches GitRoast brand color
                    color: '#FF4500',
                },
                // WHY handler: called on SUCCESSFUL payment
                //     Razorpay gives us 3 values we MUST send to backend
                handler: async function (response) {
                    setStatus('processing')
                    await verifyPayment(response, json.orderId)
                },
                // WHY modal config: better UX on dismiss
                modal: {
                    ondismiss: function () {
                        // WHY: user closed popup — no charge made
                        createToast({
                            type: 'warning',
                            message: 'Payment cancelled. No charge was made.',
                            position: 'top-center',
                        })
                        setStatus('ready')
                    },
                    // WHY: allow closing and trying again
                    confirm_close: false,
                    escape: true,
                },
            }

            const rzp = new window.Razorpay(options)

            // WHY: handle payment failure inside popup
            rzp.on('payment.failed', function (response) {
                console.error('[Razorpay] Payment failed:', response.error)
                createToast({
                    type: 'error',
                    message: `Payment failed: ${response.error.description}`,
                    position: 'top-center',
                    duration: 6000,
                    showCloseButton: true,
                })
                setStatus('ready')
            })

            rzp.open()

        } catch (err) {
            setStatus('error')
            setErrorMsg(err.message || 'Could not create payment session.')
            createToast({
                type: 'error',
                message: err.message || 'Payment setup failed. Try again.',
                position: 'top-center',
            })
        }
    }

    // ── Step 4: Verify payment on backend ────────────────────
    // WHY: CRITICAL — signature verification before unlocking Pro
    //      never trust frontend alone for payment confirmation
    async function verifyPayment(razorpayResponse, orderId) {
        try {
            const res = await fetch(`${API_BASE}/api/payment/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    razorpay_order_id: razorpayResponse.razorpay_order_id || orderId,
                    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                    razorpay_signature: razorpayResponse.razorpay_signature,
                    plan: planKey,
                }),
            })

            const json = await res.json()
            if (!json.success) throw new Error(json.message)

            setStatus('done')

            createToast({
                type: 'success',
                message: '🔥 Payment confirmed! You are now Pro!',
                position: 'top-center',
                showProgressBar: true,
                duration: 5000,
            })

            // WHY 2s: let toast show before calling onSuccess
            setTimeout(() => onSuccess(), 2000)

        } catch (err) {
            setStatus('error')
            setErrorMsg(err.message || 'Payment verification failed.')
            createToast({
                type: 'error',
                message: err.message || 'Verification failed. Contact support with your payment ID.',
                position: 'top-center',
                duration: 8000,
                showCloseButton: true,
            })
        }
    }

    // ── Render: SDK loading ──────────────────────────────────
    if (status === 'sdk_loading') {
        return (
            <div className="pf-center">
                <p className="font-mono pf-msg">
                    Loading payment system...
                    <span className="animate-blink pf-cursor" />
                </p>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

    // ── Render: Creating order ───────────────────────────────
    if (status === 'creating') {
        return (
            <div className="pf-center">
                <p className="font-mono pf-msg">
                    Setting up your order...
                    <span className="animate-blink pf-cursor" />
                </p>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

    // ── Render: Processing (after popup closes) ──────────────
    if (status === 'processing') {
        return (
            <div className="pf-center" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                <p className="font-display" style={{ fontSize: '22px', color: 'var(--fire)' }}>
                    Verifying payment...
                </p>
                <p className="font-mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Please wait — do not close this window
                </p>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

    // ── Render: Done ─────────────────────────────────────────
    if (status === 'done') {
        return (
            <div className="pf-center" style={{ flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
                <p className="font-display text-fire" style={{ fontSize: '36px' }}>
                    🔥 YOU&apos;RE PRO!
                </p>
                <p className="font-mono" style={{ fontSize: '14px', color: 'var(--good)' }}>
                    Redirecting you now...
                </p>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

    // ── Render: Error ────────────────────────────────────────
    if (status === 'error') {
        return (
            <div className="pf-center" style={{ flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                <p className="font-mono" style={{ color: 'var(--bad)', fontSize: '14px' }}>
                    ❌ {errorMsg || 'Something went wrong.'}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => { setStatus('ready'); setErrorMsg('') }}
                    >
                        Try Again
                    </button>
                    <button className="btn btn-ghost" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

    // ── Render: Ready — show plan summary + pay button ───────
    return (
        <div className="payment-flow">

            {/* Plan summary */}
            <div className="pf-summary">
                <div>
                    <p className="pf-plan-name font-mono">
                        {PLAN_LABELS[planKey]}
                    </p>
                    <p className="pf-plan-sub font-mono">
                        Secure payment via Razorpay
                    </p>
                </div>
                <div className="pf-price font-display">${price}</div>
            </div>

            {/* Payment methods info */}
            <div className="pf-methods font-mono">
                <p className="pf-methods-title">Accepted payment methods</p>
                <div className="pf-methods-list">
                    <span className="pf-method">💳 Credit / Debit Card</span>
                    <span className="pf-method">📱 UPI</span>
                    <span className="pf-method">🏦 Net Banking</span>
                    <span className="pf-method">👛 Wallets</span>
                </div>
            </div>

            {/* What they unlock */}
            <div className="pf-unlocks font-mono">
                <p className="pf-unlocks-title">After payment you unlock:</p>
                <p className="pf-unlock-item">✓ Private repo access</p>
                <p className="pf-unlock-item">✓ AI-powered roasts (Gemini)</p>
                <p className="pf-unlock-item">✓ HD card — no watermark</p>
                <p className="pf-unlock-item">✓ Unlimited roasts</p>
            </div>

            {/* Pay button */}
            <button
                className="btn btn-primary pf-pay-btn"
                onClick={handlePayment}
            >
                🔥 Pay ${price} with Razorpay
            </button>

            {/* Security note */}
            <p className="pf-secure font-mono">
                🔒 Secured by Razorpay · PCI DSS compliant · Works globally
            </p>

            {/* Cancel */}
            <button className="btn btn-ghost pf-cancel" onClick={onCancel}>
                ← Cancel
            </button>

            <style jsx>{STYLES}</style>
        </div>
    )
}

const STYLES = `
  .payment-flow {
    display:        flex;
    flex-direction: column;
    gap:            1.1rem;
    padding:        1.5rem;
  }
  .pf-center {
    display:         flex;
    align-items:     center;
    justify-content: center;
    padding:         3rem;
    min-height:      160px;
  }
  .pf-msg {
    font-size:   14px;
    color:       var(--text-secondary);
    display:     flex;
    align-items: center;
    gap:         6px;
  }
  .pf-cursor {
    display:        inline-block;
    width:          2px;
    height:         13px;
    background:     var(--fire);
    vertical-align: middle;
    border-radius:  1px;
  }
  .pf-summary {
    display:         flex;
    justify-content: space-between;
    align-items:     center;
    padding:         1rem 1.25rem;
    background:      var(--bg-elevated);
    border:          1px solid var(--border);
    border-radius:   var(--radius-md);
    gap:             1rem;
  }
  .pf-plan-name { font-size: 15px; color: var(--text-primary); margin-bottom: 3px; }
  .pf-plan-sub  { font-size: 11px; color: var(--text-muted); }
  .pf-price     { font-size: 34px; color: var(--fire); flex-shrink: 0; }
  .pf-methods {
    background:    var(--bg-elevated);
    border:        1px solid var(--border);
    border-radius: var(--radius-sm);
    padding:       12px 14px;
  }
  .pf-methods-title {
    font-size:      10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color:          var(--text-muted);
    margin-bottom:  8px;
  }
  .pf-methods-list {
    display:   flex;
    flex-wrap: wrap;
    gap:       8px;
  }
  .pf-method {
    font-size:     12px;
    color:         var(--text-secondary);
    background:    var(--bg-card);
    border:        1px solid var(--border);
    border-radius: var(--radius-sm);
    padding:       3px 8px;
  }
  .pf-unlocks {
    background:    var(--bg-elevated);
    border:        1px solid var(--border);
    border-left:   3px solid var(--good);
    border-radius: var(--radius-sm);
    padding:       12px 14px;
  }
  .pf-unlocks-title {
    font-size:      10px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color:          var(--text-muted);
    margin-bottom:  8px;
  }
  .pf-unlock-item { font-size: 12px; color: var(--good); line-height: 2; }
  .pf-pay-btn {
    width:          100%;
    padding:        14px;
    font-size:      16px;
    letter-spacing: 0.5px;
    border-radius:  var(--radius-md);
  }
  .pf-secure { text-align: center; font-size: 11px; color: var(--text-muted); }
  .pf-cancel { align-self: center; }
`