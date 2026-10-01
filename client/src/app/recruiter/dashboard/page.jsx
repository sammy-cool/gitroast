import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Recruiter Command Center — GitRoast Candidate X-Ray',
  description: 'Evaluate technical talent by hard commit signals, test suites, and abandonment ratios.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
