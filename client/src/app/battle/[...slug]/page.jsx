// ============================================================
// GITROAST — Battle Result Page (SSR Shell)
// ============================================================
// WHAT: Server component that generates per-battle metadata
//       with dynamic OG image, then hands off to BattlePageClient.
//
// WHY dynamic OG image for battles:
//   When shared on Twitter: shows both usernames + scores
//   Much more compelling than generic GitRoast image
//   "⚔️ torvalds vs gaearon — who codes worse?" = clickbait
// ============================================================

import { Suspense } from 'react'
import BattlePageClient from './BattlePageClient'

export async function generateMetadata({ params }) {
    const resolvedParams = await params
    const slug = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : []
    const joined = slug.join('/')
    const [user1 = 'unknown', user2 = 'unknown'] = joined.split('/vs/')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    // WHY /api/og-battle not /api/og:
    //   Battle has VS layout with two players — different design
    const ogImageUrl = `${siteUrl}/api/og-battle?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`

    return {
        title: `⚔️ @${user1} vs @${user2} — GitRoast Battle`,
        description: `Who codes worse? @${user1} or @${user2}? See the roast battle results.`,
        openGraph: {
            title: `⚔️ @${user1} vs @${user2} — GitRoast Battle`,
            description: `Who codes worse? Find out — then get roasted yourself.`,
            type: 'website',
            url: `${siteUrl}/battle/${user1}/vs/${user2}`,
            images: [{
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: `GitRoast Battle: @${user1} vs @${user2}`,
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `⚔️ @${user1} vs @${user2} — GitRoast Battle`,
            description: `Who codes worse? See the results.`,
            images: [ogImageUrl],
        },
    }
}

export default async function BattleSlugPage({ params }) {
    const resolvedParams = await params
    const slug = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : []
    const joined = slug.join('/')
    const [user1 = '', user2 = ''] = joined.split('/vs/')

    if (!user1 || !user2) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="font-mono" style={{ color: 'var(--bad)' }}>
                    Invalid battle URL. Go back and try again.
                </p>
            </div>
        )
    }

    return (
        <Suspense fallback={null}>
            <BattlePageClient user1={user1} user2={user2} />
        </Suspense>
    )
}