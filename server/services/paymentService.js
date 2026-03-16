// ============================================================
// GITROAST — PayPal Payment Service
// WHY PayPal: user already has account, globally trusted,
//             zero monthly fee, simple REST API,
//             no credit card needed to set up
// ============================================================

const Payment = require('../models/Payment')
const User = require('../models/User')

// WHY: switch API base based on mode
//      sandbox = test money, live = real money
const PAYPAL_BASE = process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

// ─── Plan config ─────────────────────────────────────────
// WHY central object: change prices in one place only
const PLANS = {
    pro_one_time: {
        price: parseFloat(process.env.PRO_ONE_TIME_PRICE || '2.49'),
        description: 'GitRoast Pro — Lifetime Access',
        label: 'Pro One Time',
    },
    pro_monthly: {
        price: parseFloat(process.env.PRO_MONTHLY_PRICE || '5.49'),
        description: 'GitRoast Pro — Monthly Subscription',
        label: 'Pro Monthly',
    },
    teams_monthly: {
        price: parseFloat(process.env.TEAMS_MONTHLY_PRICE || '10.99'),
        description: 'GitRoast Teams — Monthly Subscription',
        label: 'Teams Monthly',
    },
}

// ─── getAccessToken ───────────────────────────────────────
// WHY: PayPal uses OAuth 2.0
//      exchange Client ID + Secret → short-lived access token
//      this token is then used for all API calls
async function getAccessToken() {
    // WHY base64: HTTP Basic Auth format PayPal requires
    const credentials = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64')

    const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[PayPal] Auth failed:', err)
        throw new Error('PAYPAL_AUTH_FAILED')
    }

    const json = await res.json()
    return json.access_token
}

// ─── createOrder ─────────────────────────────────────────
// WHY: Step 1 of PayPal flow
//      creates an order on PayPal servers
//      returns orderId → frontend shows PayPal button with it
async function createOrder(plan) {
    const planConfig = PLANS[plan]
    if (!planConfig) throw new Error('INVALID_PLAN')

    const token = await getAccessToken()

    const res = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            intent: 'CAPTURE',
            purchase_units: [
                {
                    amount: {
                        currency_code: 'USD',
                        value: planConfig.price.toFixed(2),
                    },
                    description: planConfig.description,
                    // WHY custom_id: links PayPal order back to our plan
                    //     readable in PayPal dashboard too
                    custom_id: plan,
                },
            ],
            application_context: {
                brand_name: 'GitRoast',
                user_action: 'PAY_NOW',
                // WHY: fallback URLs if JS popup fails
                return_url: `${process.env.CLIENT_URL}/pricing?status=success`,
                cancel_url: `${process.env.CLIENT_URL}/pricing?status=cancelled`,
            },
        }),
        signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[PayPal] Create order failed:', err)
        throw new Error('PAYPAL_ORDER_FAILED')
    }

    const order = await res.json()

    return {
        orderId: order.id,
        price: planConfig.price,
        label: planConfig.label,
    }
}

// ─── captureAndUnlock ────────────────────────────────────
// WHY: Step 2 of PayPal flow — AFTER user approves in popup
//      captures = actually moves the money to your account
//      then immediately upgrades user to Pro in our DB
async function captureAndUnlock(orderId, userId, plan) {

    // ── Capture payment on PayPal ────────────────────────
    const token = await getAccessToken()

    const res = await fetch(
        `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(10000),
        }
    )

    if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[PayPal] Capture failed:', err)
        throw new Error('PAYPAL_CAPTURE_FAILED')
    }

    const capture = await res.json()

    // WHY: verify PayPal says COMPLETED — not just any response
    if (capture.status !== 'COMPLETED') {
        throw new Error(`PAYMENT_NOT_COMPLETED: ${capture.status}`)
    }

    // ── Extract payer email for records ──────────────────
    const payerEmail = capture.payer?.email_address || null
    const paidAmount = parseFloat(
        capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0
    )

    // ── Save payment to MongoDB ───────────────────────────
    // WHY: permanent record of every payment for support + analytics
    const payment = await Payment.create({
        userId,
        plan,
        amountUSD: paidAmount,
        paypalOrderId: orderId,
        payerEmail,
        status: 'confirmed',
        confirmedAt: new Date(),
        // WHY: monthly plans expire after 30 days
        //      one-time plans never expire (null)
        subscriptionEndsAt: plan !== 'pro_one_time'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
    })

    // ── Upgrade user to Pro in MongoDB ────────────────────
    // WHY findByIdAndUpdate: atomic — no race conditions
    await User.findByIdAndUpdate(userId, {
        $set: {
            isPro: true,
            proSince: new Date(),
        },
    })

    return { payment, capture }
}

module.exports = { createOrder, captureAndUnlock, PLANS }