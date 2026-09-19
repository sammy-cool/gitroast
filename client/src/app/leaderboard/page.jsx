import { Suspense } from 'react';
import LeaderboardClient, { LeaderboardSkeleton } from './LeaderboardClient';

export const metadata = {
  title: 'Wall of Shame 🏆 — Global GitHub Roast Leaderboard | GitRoast',
  description:
    'The most brutally roasted GitHub profiles in the world. Explore the lowest developer scores, commit shame, and global rankings.',
  openGraph: {
    title: 'Wall of Shame 🏆 — Global GitHub Roast Leaderboard',
    description:
      'The most brutally roasted GitHub profiles. See who got destroyed the worst.',
    url: 'https://gitroast-dev.vercel.app/leaderboard',
  },
};

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '1.5rem 1rem 3.5rem',
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
  );
}
