import PricingPageClient from './PricingPageClient'
import { jsonLdString } from '@/utils/jsonLd'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

export const metadata = {
    title: 'GitRoast Pricing — Free to get roasted, Pro to remember everything',
    description:
        'Free gets 3 AI roasts a month. Pro Roaster adds 30 AI roasts per billing cycle, Nuclear intensity, history and watermark-free cards. Historian adds trends and reports. Prices adjust to your region.',
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
        title: 'GitRoast Pro — Pricing & Plans',
        description:
            'Free to get roasted, Pro to remember everything. Nuclear AI roasts, 30 AI roasts per billing cycle, history and watermark-free cards. Prices adjust to your region.',
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
        title: 'GitRoast Pro — Pricing & Plans',
        description: 'Free to get roasted. Pro to remember everything.',
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
        'Pricing and plan options for GitRoast. Free to get roasted, Pro to remember everything. Prices adjust to your region.',
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
            priceCurrency: 'USD',
            lowPrice: '9',
            highPrice: '19',
            offerCount: '2',
            offers: [
                {
                    '@type': 'Offer',
                    name: 'Pro Roaster',
                    price: '9',
                    priceCurrency: 'USD',
                    availability: 'https://schema.org/InStock',
                },
                {
                    '@type': 'Offer',
                    name: 'Historian',
                    price: '19',
                    priceCurrency: 'USD',
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
                dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
            />
            <PricingPageClient />
        </>
    )
}

