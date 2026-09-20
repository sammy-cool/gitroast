import BattleEntryClient from './BattleEntryClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

export const metadata = {
    title: 'Roast Battle Arena ⚔️ — Face Off Two Developers | GitRoast',
    description:
        'Pick any two GitHub profiles and start an AI roast battle. Compare developer sins, commit histories, repo scores, and see who gets crowned Most Roastable.',
    keywords: [
        'github roast battle',
        'developer vs developer',
        'code battle',
        'roast my github battle',
        'github face off',
        'developer comparison',
        'gitroast battle',
    ],
    alternates: {
        canonical: `${SITE_URL}/battle`,
    },
    openGraph: {
        title: 'Roast Battle Arena ⚔️ — Face Off Two Developers',
        description:
            'Two developers enter. One gets crowned Most Roastable. Who has the worse code?',
        url: `${SITE_URL}/battle`,
        siteName: 'GitRoast',
        type: 'website',
        images: [
            {
                url: '/og-default.png',
                width: 1200,
                height: 630,
                alt: 'GitRoast — GitHub Roast Battle Arena',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Roast Battle Arena ⚔️ | GitRoast',
        description: 'Two developers enter. One gets crowned Most Roastable.',
        images: ['/og-default.png'],
        creator: '@gitroast',
    },
}

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Roast Battle Arena ⚔️ | GitRoast',
    url: `${SITE_URL}/battle`,
    description:
        'Head-to-head developer roasting arena comparing two GitHub profiles on commit activity, repository quality, and code sins.',
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
                name: 'Battle Arena',
                item: `${SITE_URL}/battle`,
            },
        ],
    },
}

export default function BattlePage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <BattleEntryClient />
        </>
    )
}