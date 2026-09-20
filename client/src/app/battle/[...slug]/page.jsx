// ============================================================
// GITROAST — Battle Result Page (SSR Shell)
// ============================================================
// WHAT: Server component that generates per-battle metadata
//       with dynamic OG image, then hands off to BattlePageClient.
// ============================================================

import { Suspense } from 'react'
import BattlePageClient from './BattlePageClient'

export async function generateMetadata({ params }) {
    const resolvedParams = await params
    const slug = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : []
    const joined = slug.join('/')
    const [user1 = 'unknown', user2 = 'unknown'] = joined.split('/vs/')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'
    const ogImageUrl = `${siteUrl}/api/og-battle?user1=${encodeURIComponent(user1)}&user2=${encodeURIComponent(user2)}`

    return {
        title: `⚔️ @${user1} vs @${user2} — GitRoast Battle | Head-to-Head Code Roast`,
        description: `Who codes worse? @${user1} or @${user2}? See the full GitHub roast battle breakdown, commit sins, and winner determination.`,
        keywords: [
            `${user1} vs ${user2}`,
            `${user1} github battle`,
            `${user2} github battle`,
            'github roast battle',
            'developer face off',
        ],
        alternates: {
            canonical: `${siteUrl}/battle/${user1}/vs/${user2}`,
        },
        openGraph: {
            title: `⚔️ @${user1} vs @${user2} — GitRoast Battle`,
            description: `Who codes worse? Find out — then start your own battle.`,
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
            creator: '@gitroast',
        },
    }
}

export default async function BattleSlugPage({ params }) {
    const resolvedParams = await params
    const slug = Array.isArray(resolvedParams?.slug) ? resolvedParams.slug : []
    const joined = slug.join('/')
    const [user1 = '', user2 = ''] = joined.split('/vs/')

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

    if (!user1 || !user2) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="font-mono" style={{ color: 'var(--bad)' }}>
                    Invalid battle URL. Go back and try again.
                </p>
            </div>
        )
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `Roast Battle: @${user1} vs @${user2}`,
        url: `${siteUrl}/battle/${user1}/vs/${user2}`,
        description: `Face-off between @${user1} and @${user2} on GitRoast.`,
        breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: siteUrl,
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Battle Arena',
                    item: `${siteUrl}/battle`,
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: `@${user1} vs @${user2}`,
                    item: `${siteUrl}/battle/${user1}/vs/${user2}`,
                },
            ],
        },
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Suspense fallback={null}>
                <BattlePageClient user1={user1} user2={user2} />
            </Suspense>
        </>
    )
}