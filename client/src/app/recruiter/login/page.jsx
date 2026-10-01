import { Suspense } from 'react'
import RecruiterLoginClient from './RecruiterLoginClient'

export const metadata = {
  title: 'Recruiter Login — GitRoast Candidate X-Ray',
  description: 'Sign in to access candid developer evaluations and candidate insights.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RecruiterLoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading portal...</div>}>
      <RecruiterLoginClient />
    </Suspense>
  )
}
