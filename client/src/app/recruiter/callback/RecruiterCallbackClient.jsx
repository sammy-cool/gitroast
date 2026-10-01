"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useRecruiterAuth } from '@/context/RecruiterAuthContext'
import { toast } from '@/utils/toast'

export default function RecruiterCallbackClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { loginWithToken } = useRecruiterAuth()

    useEffect(() => {
        const token = searchParams.get('token')
        const authError = searchParams.get('auth_error')

        if (authError || !token) {
            const messages = {
                csrf_detected: 'Security verification failed (CSRF mismatch). Please try again.',
                access_denied: 'Google login was cancelled.',
                token_failed: 'Login failed. Please try again.',
                server_error: 'Something went wrong. Please try again.',
            }
            toast.error(messages[authError] || 'Login failed. Please try again.')
            router.replace('/recruiter/login')
            return
        }

        loginWithToken(token)
        toast.success('Google account connected! Welcome, Recruiter.')
        router.replace('/dashboard')

    }, [searchParams, loginWithToken, router])

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '1rem',
            background: '#f8fafc'
        }}>
            <p style={{
                fontFamily: 'var(--font-display, sans-serif)',
                fontSize: '32px',
                color: '#00bcd4', // Recruiter cyan
                letterSpacing: '1px'
            }}>
                GITROAST RECRUITER 💼
            </p>
            <p style={{ color: '#64748b', fontFamily: 'var(--font-mono, monospace)', fontSize: '14px' }}>
                Authenticating with Google...
            </p>
        </div>
    )
}
