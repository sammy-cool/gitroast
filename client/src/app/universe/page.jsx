import UniverseEntryClient from './UniverseEntryClient'
import { jsonLdString } from '@/utils/jsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

export const metadata = {
    title: '3D Code Solar System — WebGL Interactive Universe | GitRoast',
    description:
        'Transform any GitHub profile into an interactive 3D celestial solar system. Repositories as orbiting planets, commit heatmaps as stellar corona, and tech debt black holes.',
    keywords: [
        'github 3d solar system',
        'code visualizer 3d',
        'threejs github galaxy',
        'interactive code universe',
        'gitroast universe',
        'github planetary orbits',
    ],
    alternates: {
        canonical: `${SITE_URL}/universe`,
    },
    openGraph: {
        title: '3D Code Solar System | GitRoast WebGL Universe',
        description:
            'Explore any developer’s GitHub repositories as an orbiting 3D celestial star system in real time.',
        url: `${SITE_URL}/universe`,
        siteName: 'GitRoast',
        type: 'website',
        images: [
            {
                url: '/og-default.png',
                width: 1200,
                height: 630,
                alt: 'GitRoast — 3D Code Solar System Visualizer',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '3D Code Solar System | GitRoast',
        description: 'Explore any developer’s GitHub repositories as an orbiting 3D celestial star system.',
        images: ['/og-default.png'],
        creator: '@gitroast',
    },
}

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: '3D Code Solar System | GitRoast Universe',
    url: `${SITE_URL}/universe`,
    description:
        'Interactive 3D WebGL solar system visualizer transforming GitHub profiles into celestial worlds, stars, and black holes.',
    breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: SITE_URL,
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: '3D Universe',
                item: `${SITE_URL}/universe`,
            },
        ],
    },
}

export default function UniversePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
            />
            <UniverseEntryClient />
        </>
    )
}

