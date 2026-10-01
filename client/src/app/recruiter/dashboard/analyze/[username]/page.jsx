import { Suspense } from 'react';
import AnalyzeClient from './AnalyzeClient';

export const metadata = {
  title: 'Candidate X-Ray — GitRoast Talent',
  description: 'Objective developer commit and testing evaluations.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AnalyzePage({ params }) {
  const { username } = await params;
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading candidate...</div>}>
      <AnalyzeClient username={username} />
    </Suspense>
  );
}
