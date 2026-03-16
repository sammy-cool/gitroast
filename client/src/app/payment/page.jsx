'use client'

// WHY: Razorpay uses popup flow — this page is only reached
//      if user manually navigates to /payment
//      We redirect them to pricing cleanly
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentPage() {
    const router = useRouter()

    useEffect(() => {
        // WHY: Razorpay completes inside popup — no redirect needed
        //      if someone lands here, send them to pricing
        router.replace('/pricing')
    }, [router])

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <p className="font-mono" style={{ color: 'var(--text-secondary)' }}>
                Redirecting...
            </p>
        </div>
    )
}