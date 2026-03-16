'use client'

// WHY: PayPal JS SDK loaded from PayPal's CDN directly
//      zero npm packages — PayPal maintains it themselves
//      we just load it in a <script> tag and use window.paypal

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createToast } from 'customizable-toast-notification'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const PAYPAL_CID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

const PLAN_LABELS = {
    pro_one_time: 'Pro — Lifetime',
    pro_monthly: 'Pro — Monthly',
    teams_monthly: 'Teams — Monthly',
}

export default function PaymentFlow({ planKey, price, onSuccess, onCancel }) {
    const { getToken } = useAuth()
    const btnContainerRef = useRef(null)

    // WHY 5 clear states — never confuse user about what's happening:
    // sdk_loading → creating → ready → processing → done → error
    const [status, setStatus] = useState('sdk_loading')
    const [orderId, setOrderId] = useState(null)
    const [errorMsg, setErrorMsg] = useState('')

    // ── Step 1: Load PayPal SDK script ──────────────────────
    useEffect(() => {
        // WHY: check if script already exists — avoid duplicates
        if (window.paypal) {
            setStatus('creating')
            return
        }

        const existing = document.getElementById('paypal-sdk-script')
        if (existing) {
            existing.addEventListener('load', () => setStatus('creating'))
            return
        }

        const script = document.createElement('script')
        script.id = 'paypal-sdk-script'
        // WHY currency=USD + intent=capture:
        //   USD = we bill in dollars
        //   capture = charge immediately when user approves
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CID}&currency=USD&intent=capture`
        script.async = true

        script.onload = () => setStatus('creating')
        script.onerror = () => {
            setStatus('error')
            setErrorMsg('PayPal SDK failed to load. Check your connection.')
        }

        document.body.appendChild(script)
    }, [])

    // ── Step 2: Create order on our backend ─────────────────
    useEffect(() => {
        if (status !== 'creating') return

        async function createOrder() {
            try {
                const res = await fetch(`${API_BASE}/api/payment/create-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({ plan: planKey }),
                })

                const json = await res.json()

                if (!json.success) {
                    throw new Error(json.message || 'Could not create order.')
                }

                setOrderId(json.orderId)
                // WHY: store plan in sessionStorage as fallback
                //      if popup fails and PayPal redirects instead,
                //      the /payment page can read which plan was selected
                sessionStorage.setItem('gitroast_pending_plan', planKey)
                setStatus('ready')

            } catch (err) {
                setStatus('error')
                setErrorMsg(err.message || 'Could not connect to payment server.')
                createToast({
                    type: 'error',
                    message: err.message || 'Payment setup failed.',
                    position: 'top-center',
                    duration: 5000,
                })
            }
        }

        createOrder()
    }, [status, planKey, getToken])

    // ── Step 3: Render PayPal button ─────────────────────────
    useEffect(() => {
        if (status !== 'ready') return
        if (!orderId) return
        if (!window.paypal) return
        if (!btnContainerRef.current) return

        // WHY: clear container — prevent duplicate buttons
        //      happens in React StrictMode (double render)
        btnContainerRef.current.innerHTML = ''

        window.paypal.Buttons({

            // WHY: return the orderId we already created on backend
            //      PayPal uses it to show correct amount to the user
            createOrder: () => orderId,

            // WHY onApprove: user clicked Pay in PayPal popup
            //     data.orderID = the approved order
            //     we now call our backend to capture it
            onApprove: async (data) => {
                setStatus('processing')

                try {
                    const res = await fetch(`${API_BASE}/api/payment/capture`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${getToken()}`,
                        },
                        body: JSON.stringify({
                            orderId: data.orderID,
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

                    // WHY 2s: let the toast show before calling onSuccess
                    setTimeout(() => onSuccess(), 2000)

                } catch (err) {
                    setStatus('error')
                    setErrorMsg(err.message || 'Payment capture failed.')
                    createToast({
                        type: 'error',
                        message: err.message || 'Payment failed. No charge was made.',
                        position: 'top-center',
                        duration: 6000,
                        showCloseButton: true,
                    })
                }
            },

            // WHY onCancel: user closed PayPal popup without paying
            onCancel: () => {
                createToast({
                    type: 'warning',
                    message: 'Payment cancelled. No charge was made.',
                    position: 'top-center',
                })
                // WHY: go back to ready — let them try again
                setStatus('ready')
            },

            // WHY onError: error INSIDE PayPal (card declined etc.)
            onError: (err) => {
                console.error('[PayPal Button]', err)
                createToast({
                    type: 'error',
                    message: 'PayPal encountered an error. Please try again.',
                    position: 'top-center',
                })
                setStatus('ready')
            },

            // WHY style: matches our dark GitRoast theme
            style: {
                layout: 'vertical',
                color: 'gold',
                shape: 'rect',
                label: 'pay',
                height: 48,
            },

        }).render(btnContainerRef.current)

    }, [status, orderId, planKey, getToken, onSuccess])

    // ── Render: SDK loading ──────────────────────────────────
    if (status === 'sdk_loading' || status === 'creating') {
        return (
            <div className="pf-center">
                <p className="font-mono pf-loading-text">
                    {status === 'sdk_loading'
                        ? 'Loading PayPal...'
                        : 'Setting up payment...'}
                    <span className="animate-blink pf-cursor" />
                </p>
                <style jsx>{`
          .pf-center { display:flex;align-items:center;
            justify-content:center;padding:3rem;min-height:160px; }
          .pf-loading-text { font-size:14px;color:var(--text-secondary);
            display:flex;align-items:center;gap:6px; }
          .pf-cursor { display:inline-block;width:2px;height:13px;
            background:var(--fire);vertical-align:middle;border-radius:1px; }
        `}</style>
            </div>
        )
    }

    // ── Render: Processing ───────────────────────────────────
    if (status === 'processing') {
        return (
            <div className="pf-center" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                <p className="font-display" style={{ fontSize: '22px', color: 'var(--fire)' }}>
                    Processing...
                </p>
                <p className="font-mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Please wait — do not close this window
                </p>
                <style jsx>{`
          .pf-center { display:flex;align-items:center;
            justify-content:center;padding:3rem;min-height:160px; }
        `}</style>
            </div>
        )
    }

    // ── Render: Done ─────────────────────────────────────────
    if (status === 'done') {
        return (
            <div className="pf-center" style={{ flexDirection: 'column', gap: '1rem' }}>
                <p className="font-display text-fire" style={{ fontSize: '36px' }}>
                    🔥 YOU&apos;RE PRO!
                </p>
                <p className="font-mono" style={{ fontSize: '14px', color: 'var(--good)' }}>
                    Redirecting you now...
                </p>
                <style jsx>{`
          .pf-center { display:flex;align-items:center;
            justify-content:center;padding:3rem;text-align:center; }
        `}</style>
            </div>
        )
    }

    // ── Render: Error ────────────────────────────────────────
    if (status === 'error') {
        return (
            <div className="pf-center"
                style={{ flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                <p className="font-mono" style={{ color: 'var(--bad)', fontSize: '14px' }}>
                    ❌ {errorMsg || 'Something went wrong.'}
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => { setStatus('creating'); setErrorMsg('') }}
                    >
                        Try Again
                    </button>
                    <button className="btn btn-ghost" onClick={onCancel}>
                        Cancel
                    </button>
                </div>
                <style jsx>{`
          .pf-center { display:flex;align-items:center;justify-content:center; }
        `}</style>
            </div>
        )
    }

    // ── Render: Ready — show plan summary + PayPal button ────
    return (
        <div className="payment-flow">

            {/* Plan + price summary */}
            <div className="pf-summary">
                <div>
                    <p className="pf-plan-name font-mono">
                        {PLAN_LABELS[planKey]}
                    </p>
                    <p className="pf-plan-sub font-mono">
                        Secure payment via PayPal
                    </p>
                </div>
                <div className="pf-price font-display">
                    ${price}
                </div>
            </div>

            {/* WHY: PayPal button renders into this div */}
            <div ref={btnContainerRef} className="paypal-btn-container" />

            {/* What they unlock */}
            <div className="pf-unlocks font-mono">
                <p className="pf-unlocks-title">After payment you unlock:</p>
                <p className="pf-unlock-item">✓ Private repo access</p>
                <p className="pf-unlock-item">✓ AI-powered roasts (Gemini)</p>
                <p className="pf-unlock-item">✓ HD card — no watermark</p>
                <p className="pf-unlock-item">✓ Unlimited roasts</p>
            </div>

            {/* Security note */}
            <p className="pf-secure font-mono">
                🔒 Secured by PayPal · GitRoast never stores your card
            </p>

            {/* Cancel */}
            <button className="btn btn-ghost pf-cancel" onClick={onCancel}>
                ← Cancel
            </button>

            <style jsx>{`
        .payment-flow {
          display:        flex;
          flex-direction: column;
          gap:            1.1rem;
          padding:        1.5rem;
        }
        /* Summary row */
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
        /* PayPal button */
        .paypal-btn-container { min-height: 55px; }
        /* Unlocks */
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
        .pf-unlock-item {
          font-size:   12px;
          color:       var(--good);
          line-height: 2;
        }
        /* Bottom */
        .pf-secure { text-align: center; font-size: 11px; color: var(--text-muted); }
        .pf-cancel { align-self: center; }
      `}</style>
        </div>
    )
}