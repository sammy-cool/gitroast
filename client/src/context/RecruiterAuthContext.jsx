"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useMemo,
} from 'react'

const RecruiterAuthContext = createContext(null)

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
const RECRUITER_TOKEN_KEY = 'gitroast_recruiter_token'

export function RecruiterAuthProvider({ children }) {
    const [recruiterUser, setRecruiterUser] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchMe = useCallback(async (token) => {
        try {
            const res = await fetch(`${API_BASE}/api/recruiter-auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })

            if (!res.ok) {
                if (res.status === 401 || res.status === 403) {
                    try { localStorage.removeItem(RECRUITER_TOKEN_KEY); } catch {}
                    setRecruiterUser(null);
                }
                return;
            }

            const json = await res.json();
            setRecruiterUser(json.recruiter);
        } catch {
            // handle error
        } finally {
            setLoading(false);
        }
    }, [])

    useEffect(() => {
        const token = localStorage.getItem(RECRUITER_TOKEN_KEY)
        if (token) {
            fetchMe(token)
        } else {
            setLoading(false)
        }
    }, [fetchMe])

    const loginWithToken = useCallback((token) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(RECRUITER_TOKEN_KEY, token)
        }
        fetchMe(token)
    }, [fetchMe])

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null
        return localStorage.getItem(RECRUITER_TOKEN_KEY)
    }, [])

    const logout = useCallback(async () => {
        const token = getToken()
        try {
            await fetch(`${API_BASE}/api/recruiter-auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
        } catch {}
        if (typeof window !== 'undefined') {
            localStorage.removeItem(RECRUITER_TOKEN_KEY)
        }
        setRecruiterUser(null)
    }, [getToken])

    const loginWithGoogle = useCallback(() => {
        window.location.href = `${API_BASE}/api/recruiter-auth/google`
    }, [])

    const loginWithEmail = useCallback(async (email, password) => {
        const res = await fetch(`${API_BASE}/api/recruiter-auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Login failed')
        loginWithToken(data.token)
        return data
    }, [loginWithToken])

    const registerWithEmail = useCallback(async (name, email, password, company) => {
        const res = await fetch(`${API_BASE}/api/recruiter-auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, company })
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Registration failed')
        loginWithToken(data.token)
        return data
    }, [loginWithToken])

    const value = useMemo(() => ({
        recruiterUser,
        loading,
        isLoggedIn: !!recruiterUser,
        loginWithGoogle,
        loginWithToken,
        loginWithEmail,
        registerWithEmail,
        getToken,
        logout,
    }), [recruiterUser, loading, loginWithGoogle, loginWithToken, loginWithEmail, registerWithEmail, getToken, logout]);

    return (
        <RecruiterAuthContext.Provider value={value}>
            {children}
        </RecruiterAuthContext.Provider>
    )
}

export function useRecruiterAuth() {
    const ctx = useContext(RecruiterAuthContext)
    if (!ctx) {
        throw new Error('useRecruiterAuth must be used inside <RecruiterAuthProvider>')
    }
    return ctx
}
