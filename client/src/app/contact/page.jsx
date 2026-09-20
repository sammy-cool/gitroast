import ContactPageClient from './ContactPageClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

export const metadata = {
    title: 'Contact & Support 💬 — Developer Feedback & Inquiries | GitRoast',
    description:
        'Get in touch with the GitRoast team. Submit bug reports, request features, resolve billing inquiries, or dispute a GitHub roast.',
    keywords: [
        'gitroast contact',
        'gitroast support',
        'report gitroast bug',
        'developer feedback',
        'roast dispute',
    ],
    alternates: {
        canonical: `${SITE_URL}/contact`,
    },
    openGraph: {
        title: 'Contact & Support 💬 | GitRoast',
        description:
            'Have feedback, discovered a bug, or need help with GitRoast Pro? Reach out to the engineering team.',
        url: `${SITE_URL}/contact`,
        siteName: 'GitRoast',
        type: 'website',
        images: [
            {
                url: '/og-default.png',
                width: 1200,
                height: 630,
                alt: 'Contact GitRoast Support',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Contact & Support 💬 | GitRoast',
        description: 'Have feedback or discovered a bug? Reach out to the team.',
        images: ['/og-default.png'],
        creator: '@gitroast',
    },
}

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'GitRoast Support & Feedback',
    url: `${SITE_URL}/contact`,
    description:
        'Official support and feedback channel for GitRoast developer inquiries and billing support.',
    mainEntity: {
        '@type': 'Organization',
        name: 'GitRoast',
        url: SITE_URL,
        contactPoint: {
            '@type': 'ContactPoint',
            email: 'priyanshu.alt191@gmail.com',
            contactType: 'customer support',
            availableLanguage: 'English',
        },
    },
}

export default function ContactPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ContactPageClient />
        </>
    )
}
