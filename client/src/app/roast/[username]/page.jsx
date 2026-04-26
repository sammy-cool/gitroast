// WHY no 'use client' at top: this page starts as a server component
//     generateMetadata MUST run on server for SEO to work
//     Interactive parts are inside child components that have 'use client'

import { Suspense } from 'react'
import RoastPageClient from './RoastPageClient'

// ─── SEO: generateMetadata ────────────────────────────────
// WHY: Next.js calls this on the SERVER before rendering.
//      Twitter/LinkedIn bots get proper OG tags for rich previews.
//      This is WHY we chose Next.js over plain React.
export async function generateMetadata({ params }) {
    const { username } = await params

    return {
        title: `@${username}'s GitHub Roast 🔥 — GitRoast`,
        description: `See how brutally @${username}'s GitHub got roasted. Public repos, commit messages, README quality — all judged.`,
        openGraph: {
            title: `@${username} just got roasted on GitRoast 🔥`,
            description: `Commit messages, abandoned repos, and coding shame — all exposed.`,
            type: 'website',
            url: `https://gitroast-dev.vercel.app/roast/${username}`,
            // WHY: dynamic OG image per user (we build this in Phase 5)
            images: [{
                url: `https://gitroast-dev.vercel.app/api/og?username=${username}`,
                width: 1200,
                height: 630,
                alt: `@${username}'s GitRoast card`,
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `@${username} got roasted 🔥`,
            description: 'Get your GitHub brutally roasted on GitRoast.',
            images: [`https://gitroast-dev.vercel.app/api/og?username=${username}`],
        },
    }
}

// ─── Page Component ───────────────────────────────────────
// WHY Suspense: wraps client component — shows nothing while
//     JS loads, then hydrates. Required for server+client split.
export default async function RoastPage({ params }) {
    const { username } = await params

    return (
        <Suspense fallback={null}>
            <RoastPageClient username={username} />
        </Suspense>
    )
}