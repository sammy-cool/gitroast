// ============================================================
// GITROAST — Roast Result Page (SSR Shell)
// ============================================================
// WHAT: Server component that generates per-roast metadata
//       then hands rendering to RoastPageClient.
//
// WHY server component:
//   generateMetadata runs on the server — can fetch roast data
//   and build custom OG tags per username.
//   Client component cannot export generateMetadata.
//
// WHY dynamic OG image URL:
//   Each roast gets a unique preview card showing real score/grade.
//   When @someone shares /roast/torvalds on Twitter:
//     → Twitter fetches /api/og?username=torvalds
//     → Gets a 1200×630 PNG with Linus's actual score
//     → Much more compelling than a generic GitRoast image
//     → Higher click-through rate → more users → more roasts
//
// WHERE: client/src/app/roast/[username]/page.jsx
// ============================================================

import { Suspense } from 'react'
import RoastPageClient from './RoastPageClient'

export async function generateMetadata({ params }) {
    const { username } = await params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'
    const ogImageUrl = `${siteUrl}/api/og?username=${encodeURIComponent(username)}`

    return {
        title: `Get @${username} Roasted — GitRoast 🔥`,
        description: `See @${username}'s GitHub brutally roasted. Score, grade, commit sins, and a savage AI roast. Can you do worse?`,
        keywords: [
            `roast ${username}`,
            `${username} github roast`,
            `${username} github profile`,
            'github roast',
            'code sins',
        ],
        alternates: {
            canonical: `${siteUrl}/roast/${username}`,
        },
        openGraph: {
            title: `@${username}'s GitHub got roasted 🔥`,
            description: `See the score, grade, and roast. Then get roasted yourself.`,
            type: 'website',
            url: `${siteUrl}/roast/${username}`,
            images: [{
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: `@${username}'s GitRoast score card`,
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `@${username}'s GitHub got roasted 🔥`,
            description: `See the damage. Then get roasted yourself.`,
            images: [ogImageUrl],
            creator: '@gitroast',
        },
    }
}

export default async function RoastPage({ params }) {
    const { username } = await params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: `@${username}'s GitRoast`,
        url: `${siteUrl}/roast/${username}`,
        mainEntity: {
            '@type': 'Person',
            name: username,
            url: `https://github.com/${username}`,
            sameAs: [`https://github.com/${username}`],
        },
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
                    name: `@${username}'s Roast`,
                    item: `${siteUrl}/roast/${username}`,
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
                <RoastPageClient username={username} />
            </Suspense>
        </>
    )
}