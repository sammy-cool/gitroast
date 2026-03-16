'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { createToast } from 'customizable-toast-notification'
import { Suspense } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// WHY separate inner component: useSearchParams() requires
//     a Suspense boundary in Next.js App Router
function PaymentCallbackInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { getToken } = useAuth()

    // WHY 3 states: processing → success | failed
    const [status, setStatus] = useState('processing')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const token = searchParams.get('token')    // WHY: PayPal order token on redirect
        const PayerID = searchParams.get('PayerID')  // WHY: PayPal payer ID on redirect
        const plan = searchParams.get('plan') ||
            sessionStorage.getItem('gitroast_pending_plan')

        // ── User cancelled on PayPal page ────────────────────
        // WHY: PayPal redirects without token/PayerID if cancelled
        if (!token || !PayerID) {
            createToast({
                type: 'warning',
                message: 'Payment cancelled. No charge was made.',
                position: 'top-center',
            })
            router.replace('/pricing')
            return
        }

        // ── Capture the payment on our backend ───────────────
        // WHY: PayPal redirect gives us token = orderId
        //      same capture flow as the popup — just triggered here
        async function captureRedirectPayment() {
            try {
                const res = await fetch(`${API_BASE}/api/payment/capture`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${getToken()}`,
                    },
                    body: JSON.stringify({
                        orderId: token,
                        plan: plan || 'pro_one_time',
                    }),
                })

                const json = await res.json()
                if (!json.success) throw new Error(json.message)

                // WHY: clean up after successful payment
                sessionStorage.removeItem('gitroast_pending_plan')

                setStatus('success')

                createToast({
                    type: 'success',
                    message: '🔥 Payment confirmed! You are now Pro!',
                    position: 'top-center',
                    showProgressBar: true,
                    duration: 5000,
                })

                // WHY full reload: forces AuthContext to re-fetch
                //     isPro: true from server — updates entire app
                setTimeout(() => {
                    window.location.href = '/?upgraded=true'
                }, 3000)

            } catch (err) {
                setStatus('failed')
                setMessage(err.message || 'Payment capture failed.')

                createToast({
                    type: 'error',
                    message: err.message || 'Payment failed. Please contact support.',
                    position: 'top-center',
                    duration: 8000,
                    showCloseButton: true,
                })
            }
        }

        captureRedirectPayment()
    }, [searchParams, getToken, router])

    // ── Render: Processing ──────────────────────────────────
    if (status === 'processing') {
        return (
            <div className="callback-page">
                <p className="font-display callback-logo text-fire">GITROAST 🔥</p>
                <div className="callback-card card">
                    <p className="font-display callback-title text-fire">
                        CONFIRMING PAYMENT
                    </p>
                    <p className="font-mono callback-sub">
                        Please wait — do not close this window
                        <span className="animate-blink callback-cursor" />
                    </p>
                    <div className="loading-track">
                        <div className="loading-fill" />
                    </div>
                </div>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

    // ── Render: Success ─────────────────────────────────────
    if (status === 'success') {
        return (
            <div className="callback-page">
                <p className="font-display callback-logo text-fire">GITROAST 🔥</p>
                <div className="callback-card card">
                    <p className="font-display callback-title text-fire">
                        🔥 YOU&apos;RE PRO!
                    </p>
                    <p className="font-mono callback-sub" style={{ color: 'var(--good)' }}>
                        Payment confirmed. Redirecting you now...
                    </p>
                    <div className="success-features font-mono">
                        <p className="feat-item">✓ Private repo access unlocked</p>
                        <p className="feat-item">✓ AI-powered roasts unlocked</p>
                        <p className="feat-item">✓ HD card, no watermark unlocked</p>
                        <p className="feat-item">✓ Unlimited roasts unlocked</p>
                    </div>
                </div>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

    // ── Render: Failed ──────────────────────────────────────
    if (status === 'failed') {
        return (
            <div className="callback-page">
                <p className="font-display callback-logo text-fire">GITROAST 🔥</p>
                <div className="callback-card card">
                    <p className="font-display callback-title" style={{ color: 'var(--bad)' }}>
                        PAYMENT FAILED
                    </p>
                    <p className="font-mono callback-sub">
                        {message || 'Something went wrong. No charge was made.'}
                    </p>
                    <p className="font-mono callback-hint">
                        If you were charged, contact us with your PayPal
                        transaction ID and we will resolve it immediately.
                    </p>
                    <div className="callback-actions">
                        <button
                            className="btn btn-primary"
                            onClick={() => router.push('/pricing')}
                        >
                            Try Again
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={() => router.push('/')}
                        >
                            Go Home
                        </button>
                    </div>
                </div>
                <style jsx>{STYLES}</style>
            </div>
        )
    }

    return null
}

// WHY: CSS string defined once, used in all 3 render states
//     avoids copy-pasting styles into every return block
const STYLES = `
  .callback-page {
    min-height:      100vh;
    display:         flex;
    flex-direction:  column;
    align-items:     center;
    justify-content: center;
    padding:         2rem 1rem;
    gap:             1.5rem;
  }
  .callback-logo { font-size: 24px; }
  .callback-card {
    width:           100%;
    max-width:       460px;
    padding:         2rem 1.75rem;
    display:         flex;
    flex-direction:  column;
    align-items:     center;
    gap:             1rem;
    text-align:      center;
  }
  .callback-title { font-size: 32px; line-height: 1; }
  .callback-sub {
    font-size:   14px;
    color:       var(--text-secondary);
    display:     flex;
    align-items: center;
    gap:         6px;
  }
  .callback-cursor {
    display:        inline-block;
    width:          2px;
    height:         13px;
    background:     var(--fire);
    vertical-align: middle;
    border-radius:  1px;
  }
  .loading-track {
    width:         100%;
    height:        3px;
    background:    var(--border);
    border-radius: 2px;
    overflow:      hidden;
    margin-top:    0.5rem;
  }
  .loading-fill {
    height:        100%;
    background:    var(--fire-grad);
    border-radius: 2px;
    animation:     loadingBar 2s ease-in-out infinite;
  }
  @keyframes loadingBar {
    0%   { width: 0%;  margin-left: 0;    }
    50%  { width: 70%; margin-left: 15%;  }
    100% { width: 0%;  margin-left: 100%; }
  }
  .success-features {
    display:        flex;
    flex-direction: column;
    gap:            6px;
    text-align:     left;
    width:          100%;
    margin-top:     0.5rem;
  }
  .feat-item    { font-size: 13px; color: var(--good); }
  .callback-hint {
    font-size:   12px;
    color:       var(--text-muted);
    line-height: 1.7;
  }
  .callback-actions {
    display:    flex;
    gap:        10px;
    margin-top: 0.5rem;
  }
`

// ── Default export ────────────────────────────────────────
// WHY Suspense: Next.js App Router requires Suspense boundary
//     around any component using useSearchParams()
export default function PaymentCallbackPage() {
    return (
        <Suspense fallback={null}>
            <PaymentCallbackInner />
        </Suspense>
    )
}