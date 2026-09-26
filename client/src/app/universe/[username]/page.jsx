// ============================================================
// GITROAST — 3D Code Solar System Page (SSR Shell)
// ============================================================
// WHAT: Server component providing dynamic OpenGraph and SEO metadata
//       for a developer's 3D planetary universe, streaming into UniversePageClient.
//
// WHY server component:
//   - Allows server-side OpenGraph tag generation for rich social sharing cards.
//   - Embeds structured JSON-LD ProfilePage schema for search engine indexation.
//   - Keeps heavy Three.js client bundle isolated behind client boundary.
//
// WHERE & WHEN TO USE:
//   - Mounted at `/universe/:username` when visiting or sharing an interactive
//     3D cosmic solar system representing a developer's GitHub repos and stars.
//
// USE CASES:
//   - Developer sharing their 3D portfolio galaxy on Twitter/X or LinkedIn.
//   - Recruiters exploring candidate codebases visually as an orbiting star system.
//
// WHEN NOT TO USE:
//   - Do not use for raw text-only views or headless API responses.
// ============================================================

import { Suspense } from 'react'
import UniversePageClient from './UniversePageClient'

export async function generateMetadata({ params }) {
    const { username } = await params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'
    const ogImageUrl = `${siteUrl}/api/og?username=${encodeURIComponent(username)}`

    return {
        title: `🌌 3D Code Solar System — @${username} | GitRoast Universe`,
        description: `Explore @${username}'s GitHub universe in interactive 3D WebGL. Repositories as orbiting planets, commit heatmaps as stellar corona, and tech debt black holes.`,
        keywords: [
            `${username} 3d universe`,
            `${username} code solar system`,
            'github solar system',
            '3d github visualizer',
            'threejs code galaxy',
            'gitroast universe',
        ],
        alternates: {
            canonical: `${siteUrl}/universe/${username}`,
        },
        openGraph: {
            title: `🌌 @${username}'s 3D Code Solar System | GitRoast`,
            description: `Step into the cosmic visualizer: watch @${username}'s GitHub repos orbit as habitable worlds, gas giants, and technical debt singularities.`,
            type: 'website',
            url: `${siteUrl}/universe/${username}`,
            images: [{
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: `@${username}'s 3D Code Universe`,
            }],
        },
        twitter: {
            card: 'summary_large_image',
            title: `🌌 @${username}'s 3D Code Solar System | GitRoast`,
            description: `Explore repositories as orbiting celestial bodies in interactive 3D WebGL.`,
            images: [ogImageUrl],
            creator: '@gitroast',
        },
    }
}

export default async function UniversePage({ params }) {
    const { username } = await params
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ProfilePage',
        name: `@${username}'s 3D Code Solar System`,
        url: `${siteUrl}/universe/${username}`,
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
                    name: 'Universe Explorer',
                    item: `${siteUrl}/universe`,
                },
                {
                    '@type': 'ListItem',
                    position: 3,
                    name: `@${username}'s Solar System`,
                    item: `${siteUrl}/universe/${username}`,
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
                <UniversePageClient username={username} />
            </Suspense>
        </>
    )
}
