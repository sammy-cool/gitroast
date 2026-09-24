'use client'

import { useState, useEffect, useCallback } from 'react'
import { getRoastHistory } from '@/services/roastService'

// WHY: accepts username as param so hook is reusable
//      for any profile — history page, result page, etc.
export function useRoastHistory(username) {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // WHY useCallback: stable fetch function
    //     safe to call from useEffect + retry button
    const fetchHistory = useCallback(async () => {
        if (!username) {
            setLoading(false)
            return
        }

        setLoading(true)
        setError(null)

        try {
            const res = await getRoastHistory(username)
            setHistory(res.history || [])
        } catch (err) {
            setError(err.message || 'Failed to load history')
            setHistory([])
        } finally {
            setLoading(false)
        }
    }, [username])

    useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    // ── Derived data ────────────────────────────────────────
    // WHY: compute these once here, not in every component

    // ── Safe Metric Aggregate Computations ───────────────────────
    // ── WHAT: ────────────────────────────────────────────────────
    // Derives statistical score metrics (best, worst, average, trend) from history.
    //
    // ── WHY: ─────────────────────────────────────────────────────
    // Sanitizes scores through Number() and isNaN() filtering. If a historical document
    // possesses a null or malformed score, Math.max/min would otherwise return NaN,
    // polluting dashboard summary cards and charts.
    //
    // ── WHERE & WHEN TO USE: ─────────────────────────────────────
    // In profile history aggregation hooks and analytics pipelines.
    //
    // ── USE CASES: ───────────────────────────────────────────────
    // History page stats cards and trend indicator pills.
    //
    // ── WHEN NOT TO USE: ─────────────────────────────────────────
    // Do not use if raw unconverted objects must be preserved for detailed audit logs.
    const validScores = history
        .map(r => Number(r?.score))
        .filter(s => !isNaN(s));

    // Latest vs previous roast score difference
    const scoreTrend = validScores.length >= 2
        ? validScores[0] - validScores[1]
        : null

    // Best (highest) developer profile score
    const bestScore = validScores.length > 0
        ? Math.max(...validScores)
        : null

    // Worst (lowest) score (maximum roast)
    const worstScore = validScores.length > 0
        ? Math.min(...validScores)
        : null

    // Average score
    const avgScore = validScores.length > 0
        ? Math.round(validScores.reduce((s, v) => s + v, 0) / validScores.length)
        : null

    // ── Resilient Monthly History Aggregation ───────────────────
    // ── WHAT: ────────────────────────────────────────────────────
    // Groups historical roast documents by formatted calendar month ('Mon YY').
    //
    // ── WHY: ─────────────────────────────────────────────────────
    // Defensively validates roast?.createdAt using getTime() and isNaN() checks.
    // If a document has an invalid or missing date, it is omitted rather than creating
    // a corrupted 'Invalid Date' bucket in trend analytics charts.
    //
    // ── WHERE & WHEN TO USE: ─────────────────────────────────────
    // In profile timeline and monthly comparison hooks.
    //
    // ── USE CASES: ───────────────────────────────────────────────
    // Monthly trend bars and historical progress indicators.
    //
    // ── WHEN NOT TO USE: ─────────────────────────────────────────
    // Do not use if non-temporal grouping (e.g. by tag or language) is needed.
    const byMonth = history.reduce((acc, roast) => {
        if (!roast?.createdAt) return acc
        const parsed = new Date(roast.createdAt)
        if (isNaN(parsed.getTime())) return acc
        const month = parsed.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        if (!acc[month]) acc[month] = []
        acc[month].push(roast)
        return acc
    }, {})

    return {
        history,
        loading,
        error,
        refetch: fetchHistory,
        // Derived
        scoreTrend,
        bestScore,
        worstScore,
        avgScore,
        byMonth,
        hasHistory: history.length > 0,
        roastCount: history.length,
    }
}
