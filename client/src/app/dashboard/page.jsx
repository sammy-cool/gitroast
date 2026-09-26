import DashboardClient from './DashboardClient'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

export const metadata = {
  title: 'Developer Command Center & Vault ⚡ — GitRoast Dashboard',
  description:
    'Manage your past roasts, track daily AI quota, customize persona styles, toggle Ghost Mode privacy, and copy your official README badges.',
  keywords: [
    'gitroast dashboard',
    'developer vault',
    'github roast history',
    'readme badge generator',
    'github quota manager',
  ],
  alternates: {
    canonical: `${SITE_URL}/dashboard`,
  },
  openGraph: {
    title: 'GitRoast Dashboard ⚡ — Developer Vault & Settings',
    description:
      'Manage your past roasts, track daily quota, customize persona styles, and copy your official README badges.',
    url: `${SITE_URL}/dashboard`,
    siteName: 'GitRoast',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'GitRoast Developer Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GitRoast Dashboard ⚡',
    description: 'Manage your GitHub roast vault, quotas, and persona settings.',
    images: ['/og-default.png'],
  },
}

export default function DashboardPage() {
  return <DashboardClient />
}
