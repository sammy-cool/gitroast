import PricingPageClient from './PricingPageClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

export const metadata = {
    title: 'GitRoast Pro ⚡ — Pricing & Plans | Nuclear Roasts & AI Insights',
    description:
        'Unlock Gemini AI roasts, Nuclear intensity mode, zero watermarks, high-resolution certificate downloads, private repository analysis, and unlimited daily roasts.',
    keywords: [
        'gitroast pricing',
        'gitroast pro',
        'nuclear roast',
        'github roast pro',
        'developer portfolio audit',
        'gemini ai roast',
    ],
    alternates: {
        canonical: `${SITE_URL}/pricing`,
    },
    openGraph: {
        title: 'GitRoast Pro ⚡ — Pricing & Plans',
        description:
            'Free gets you a taste. Pro gets you annihilated. Unlock Nuclear AI roasts, unlimited daily quotas, and watermark-free certificates.',
        url: `${SITE_URL}/pricing`,
        siteName: 'GitRoast',
        type: 'website',
        images: [
            {
                url: '/og-default.png',
                width: 1200,
                height: 630,
                alt: 'GitRoast Pro Plans and Pricing',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'GitRoast Pro ⚡ — Pricing & Plans',
        description: 'Free gets you a taste. Pro gets you annihilated.',
        images: ['/og-default.png'],
        creator: '@gitroast',
    },
}

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'GitRoast Pro Pricing & Plans',
    url: `${SITE_URL}/pricing`,
    description:
        'Pricing and plan options for GitRoast. Upgrade to Pro for Nuclear mode, Gemini AI generative roasts, and unwatermarked downloads.',
    mainEntity: {
        '@type': 'Product',
        name: 'GitRoast Pro',
        description: 'Advanced AI-powered GitHub repository roasting service.',
        brand: {
            '@type': 'Brand',
            name: 'GitRoast',
        },
        offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'INR',
            lowPrice: '99',
            highPrice: '199',
            offerCount: '2',
            offers: [
                {
                    '@type': 'Offer',
                    name: 'The Roaster',
                    price: '99',
                    priceCurrency: 'INR',
                    availability: 'https://schema.org/InStock',
                },
                {
                    '@type': 'Offer',
                    name: 'The Historian',
                    price: '199',
                    priceCurrency: 'INR',
                    availability: 'https://schema.org/InStock',
                },
            ],
        },
    },
}

export default function PricingPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PricingPageClient />
        </>
    )
}