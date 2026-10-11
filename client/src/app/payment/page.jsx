'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PaymentPage() {
    const router = useRouter()

    useEffect(() => {
        router.replace('/pricing')
    }, [router])

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <p className="gr-help" role="status">
                Redirecting...
            </p>
        </div>
    )
}

