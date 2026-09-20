import { Suspense } from 'react'
import HistoryPageClient from './HistoryPageClient'

export async function generateMetadata({ params }) {
    const { username } = await params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

    return {
        title: `@${username}'s Roast History & Shame Log 📈 — GitRoast`,
        description: `Track @${username}'s GitHub shame over time. Score trends, past roasts, developer sins, and archive on GitRoast.`,
        keywords: [
            `${username} gitroast history`,
            `${username} roast history`,
            `${username} github sins`,
            'github shame log',
        ],
        alternates: {
            canonical: `${siteUrl}/history/${username}`,
        },
        openGraph: {
            title: `@${username}'s GitRoast History & Past Roasts`,
            description: `How badly has @${username}'s GitHub been roasted over time? See the full history.`,
            url: `${siteUrl}/history/${username}`,
            siteName: 'GitRoast',
            type: 'website',
            images: [
                {
                    url: '/og-default.png',
                    width: 1200,
                    height: 630,
                    alt: `@${username}'s Roast History on GitRoast`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `@${username}'s Roast History | GitRoast`,
            description: `How badly has @${username}'s GitHub been roasted over time?`,
            images: ['/og-default.png'],
            creator: '@gitroast',
        },
    }
}

export default async function HistoryPage({ params }) {
    const { username } = await params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: `@${username}'s Roast History`,
        url: `${siteUrl}/history/${username}`,
        mainEntity: {
            '@type': 'Person',
            name: username,
            url: `https://github.com/${username}`,
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
                    name: `@${username}'s History`,
                    item: `${siteUrl}/history/${username}`,
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
                <HistoryPageClient username={username} />
            </Suspense>
        </>
    )
}