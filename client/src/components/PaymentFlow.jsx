'use client'

// ============================================================
// GITROAST — PaymentFlow Component
// ============================================================
// WHAT: Handles the complete Razorpay payment sequence.
//       Loads Razorpay SDK → creates order → opens popup →
//       verifies payment → unlocks Pro.
//
// PROPS:
//   planId   — string: 'roaster' | 'historian'
//   onClose  — function: called on success OR cancel
//
// WHY planId not planKey:
//   Old system used planKey ('pro_one_time' etc)
//   New system uses planId ('roaster'/'historian')
//   Backend /api/payment/create-order now expects { planId }
//
// WHY no price prop:
//   Price comes from backend with the order
//   Frontend never dictates price — prevents tampering
// ============================================================

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { createToast } from 'customizable-toast-notification'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const RAZORPAY_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID

// WHY local map: display labels for each planId
//     not fetched from server — just UI strings
const PLAN_DISPLAY = {
    roaster: { name: 'Roaster', label: 'The Real Roast' },
    historian: { name: 'Historian', label: 'The Long Game' },
}

export default function PaymentFlow({ planId, onClose }) {
    const { getToken, user } = useAuth()
    const [status, setStatus] = useState('sdk_loading')
    const [errorMsg, setErrorMsg] = useState('')
    const [planInfo, setPlanInfo] = useState(null) // WHY: store price from server

    // ── Load Razorpay SDK ──────────────────────────────────────
    // WHY load on mount not on click:
    //   SDK takes ~1s to load — preloading avoids delay when user clicks Pay
    //   If already loaded → skip
    useEffect(() => {
        if (window.Razorpay) { setStatus('ready'); return }

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
                message: 'Payment SDK failed to load. Try refreshing.',
                position: 'top-center',
                duration: 5000,
                showCloseButton: true,
            })
        }
        document.body.appendChild(script)
    }, [])

    // ── Create order + open Razorpay popup ────────────────────
    // WHY server-side order creation:
    //   Amount must be set on server — user cannot tamper with price
    //   key_secret stays on server — never exposed to browser
    async function handlePayment() {
        setStatus('creating')

        try {
            const res = await fetch(`${API_BASE}/api/payment/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // WHY Authorization: server needs to know which user is paying
                    Authorization: `Bearer ${getToken()}`,
                },
                // WHY planId not plan: new backend expects planId
                body: JSON.stringify({ planId }),
            })

            const json = await res.json()
            if (!json.success) throw new Error(json.message)

            // WHY store planInfo: show price in UI summary
            setPlanInfo({ amount: json.amount, currency: json.currency })

            const options = {
                key: json.keyId || RAZORPAY_KEY,
                amount: json.amount,
                currency: json.currency,
                // WHY no emojis: Razorpay checkout options only accept ASCII
                // Emojis in name/description → 400 Bad Request from Razorpay checkout
                name: 'GitRoast',
                description: `${PLAN_DISPLAY[planId]?.label || 'Pro Plan'}`,
                order_id: json.orderId,
                prefill: {
                    email: user?.email || '',
                    name: user?.username || '',
                },
                notes: { planId },
                theme: { color: '#FF4500' },

                // WHY handler on popup close with success:
                //   Razorpay calls this after user pays in popup
                //   We then verify on server before unlocking Pro
                handler: async function (response) {
                    setStatus('processing')
                    await verifyPayment(response, json.orderId)
                },

                modal: {
                    ondismiss: function () {
                        createToast({
                            type: 'warning',
                            message: 'Payment cancelled. No charge was made.',
                            position: 'top-center',
                        })
                        setStatus('ready')
                    },
                    confirm_close: false,
                    escape: true,
                },
            }

            const rzp = new window.Razorpay(options)

            // WHY payment.failed listener:
            //   Razorpay popup handles UI for failures
            //   But we need to reset our state and inform user
            rzp.on('payment.failed', function (response) {
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
            setStatus('ready') // WHY: reset while popup is open

        } catch (err) {
            setStatus('error')
            setErrorMsg(err.message || 'Could not create payment session.')
            createToast({
                type: 'error',
                message: err.message || 'Payment setup failed. Try again.',
                position: 'top-center',
                duration: 5000,
                showCloseButton: true,
            })
        }
    }

    // ── Verify payment on server ──────────────────────────────
    // WHY verify server-side:
    //   Razorpay sends payment details to frontend after popup
    //   We forward to our server which verifies HMAC signature
    //   If signature valid → server sets isPro = true in MongoDB
    //   Without verification: anyone could fake a successful payment
    async function verifyPayment(razorpayResponse, orderId) {
        try {
            const res = await fetch(`${API_BASE}/api/payment/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`,
                },
                body: JSON.stringify({
                    orderId: razorpayResponse.razorpay_order_id || orderId,
                    paymentId: razorpayResponse.razorpay_payment_id,
                    signature: razorpayResponse.razorpay_signature,
                    // WHY planId: server logs which plan was purchased
                    planId,
                }),
            })

            const json = await res.json()
            if (!json.success) throw new Error(json.message)

            setStatus('done')

            createToast({
                type: 'success',
                message: '⚡ You are now Pro! AI roasts + Nuclear unlocked.',
                position: 'top-center',
                showProgressBar: true,
                duration: 5000,
            })

            // WHY 2s delay: let user see success screen before closing
            setTimeout(() => onClose(), 2000)

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

    const display = PLAN_DISPLAY[planId] || { name: 'Pro', label: '' }

    // ── Loading states ────────────────────────────────────────
    if (status === 'sdk_loading' || status === 'creating') {
        return (
            <div className="pf-center">
                <p className="font-mono pf-msg">
                    {status === 'sdk_loading' ? 'Loading payment system...' : 'Setting up your order...'}
                    <span className="animate-blink pf-cursor" />
                </p>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

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

    if (status === 'done') {
        return (
            <div className="pf-center" style={{ flexDirection: 'column', gap: '1rem', textAlign: 'center' }}>
                <p className="font-display text-fire" style={{ fontSize: '36px' }}>
                    ⚡ YOU&apos;RE PRO!
                </p>
                <p className="font-mono" style={{ fontSize: '14px', color: 'var(--good)' }}>
                    Redirecting you now...
                </p>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

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
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                </div>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

    // ── Ready state — main payment UI ─────────────────────────
    return (
        <div className="payment-flow">

            {/* Plan summary */}
            <div className="pf-summary">
                <div>
                    <p className="pf-plan-name font-mono">{display.name}</p>
                    <p className="pf-plan-sub font-mono">{display.label} · Secure payment via Razorpay</p>
                </div>
                {planInfo && (
                    <div className="pf-price font-display">
                        ₹{planInfo.amount / 100}
                    </div>
                )}
            </div>

            {/* Payment methods */}
            <div className="pf-methods font-mono">
                <p className="pf-methods-title">Accepted payment methods</p>
                <div className="pf-methods-list">
                    <span className="pf-method">💳 Card</span>
                    <span className="pf-method">📱 UPI</span>
                    <span className="pf-method">🏦 NetBanking</span>
                    <span className="pf-method">👛 Wallet</span>
                </div>
            </div>

            {/* What unlocks */}
            <div className="pf-unlocks font-mono">
                <p className="pf-unlocks-title">After payment you unlock:</p>
                <p className="pf-unlock-item">✓ Real Gemini AI roasts — not scripts</p>
                <p className="pf-unlock-item">✓ ☢️ Nuclear intensity — zero mercy</p>
                <p className="pf-unlock-item">✓ HD card — no watermark</p>
                <p className="pf-unlock-item">✓ Unlimited roasts per day</p>
                {planId === 'historian' && (
                    <p className="pf-unlock-item">✓ Monthly roast report email</p>
                )}
            </div>

            {/* Pay button */}
            <button
                className="btn btn-primary pf-pay-btn"
                onClick={handlePayment}
            >
                🔥 Pay with Razorpay
            </button>

            <p className="pf-secure font-mono">
                🔒 Secured by Razorpay · PCI DSS compliant
            </p>

            <button className="btn btn-ghost pf-cancel" onClick={onClose}>
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
  .pf-methods-list { display: flex; flex-wrap: wrap; gap: 8px; }
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