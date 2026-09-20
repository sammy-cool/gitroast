import { Suspense } from 'react';
import LeaderboardClient, { LeaderboardSkeleton } from './LeaderboardClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev';

export const metadata = {
  title: 'Wall of Shame 🏆 — Global GitHub Roast Leaderboard | GitRoast',
  description:
    'The most brutally roasted GitHub profiles in the world. Explore the lowest developer scores, commit shame, and global rankings.',
  keywords: [
    'github roast leaderboard',
    'wall of shame github',
    'worst github profiles',
    'github roast ranking',
    'developer shame leaderboard',
  ],
  alternates: {
    canonical: `${SITE_URL}/leaderboard`,
  },
  openGraph: {
    title: 'Wall of Shame 🏆 — Global GitHub Roast Leaderboard',
    description:
      'The most brutally roasted GitHub profiles. See who got destroyed the worst.',
    url: `${SITE_URL}/leaderboard`,
    siteName: 'GitRoast',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'GitRoast Wall of Shame Global Leaderboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wall of Shame 🏆 | GitRoast',
    description: 'The most brutally roasted GitHub profiles. Globally.',
    images: ['/og-default.png'],
    creator: '@gitroast',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Wall of Shame — Global GitHub Roast Leaderboard',
  url: `${SITE_URL}/leaderboard`,
  description:
    'Global ranking of the most roasted GitHub developers, showcasing low scores, commit habits, and developer grades.',
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
        name: 'Wall of Shame',
        item: `${SITE_URL}/leaderboard`,
      },
    ],
  },
};

export default function LeaderboardPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense
        fallback={
          <main
            style={{
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '1.5rem 1rem 6.5rem',
              maxWidth: '640px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            <div className="card" style={{ width: '100%', overflow: 'hidden' }}>
              <LeaderboardSkeleton />
            </div>
          </main>
        }
      >
        <LeaderboardClient />
      </Suspense>
    </>
  );
}
