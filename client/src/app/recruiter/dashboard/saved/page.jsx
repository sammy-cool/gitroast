import SavedClient from './SavedClient';

export const metadata = {
  title: 'Bookmarked Candidates — GitRoast Talent',
  description: 'Manage your shortlisted developer candidates and interview notes.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SavedPage() {
  return <SavedClient />;
}
