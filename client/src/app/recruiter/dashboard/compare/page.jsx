// ============================================================
// GITROAST — Recruiter Candidate Duel Page (Server Component)
// ============================================================
// WHAT: Server wrapper for the Recruiter Candidate Comparison tool.
// WHY: Next.js App Router server component defining metadata and mounting client UI.
// WHERE: /recruiter/dashboard/compare
// ============================================================

import React from 'react';
import CompareClient from './CompareClient';

export const metadata = {
  title: 'Candidate Duel & Talent Compare ⚔️ — GitRoast Recruiter Portal',
  description: 'Side-by-side technical evaluation of two developer candidates based on real GitHub commit signals, test presence, and repository hygiene.',
};

export default function ComparePage() {
  return <CompareClient />;
}
