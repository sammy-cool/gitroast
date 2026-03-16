import { Suspense } from 'react'
import HistoryPageClient from './HistoryPageClient'

// WHY generateMetadata: each history page gets
//     its own SEO title so it ranks for "@username github history"
export async function generateMetadata({ params }) {
    const { username } = await params
    return {
        title: `@${username}'s Roast History 📈 — GitRoast`,
        description: `Track @${username}'s GitHub shame over time. Score trends, monthly comparisons, full roast history.`,
        openGraph: {
            title: `@${username}'s GitRoast History`,
            description: `How badly has @${username}'s GitHub been roasted over time?`,
        },
    }
}

export default async function HistoryPage({ params }) {
    const { username } = await params
    return (
        <Suspense fallback={null}>
            <HistoryPageClient username={username} />
        </Suspense>
    )
}