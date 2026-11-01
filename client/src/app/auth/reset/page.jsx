import { Suspense } from 'react'
import ResetPasswordClient from './ResetPasswordClient'

export const metadata = { title: 'Choose a new password — GitRoast', robots: { index: false, follow: false } }

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  )
}
