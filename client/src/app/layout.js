import { AuthProvider } from '@/context/AuthContext'
import { Suspense } from 'react'
import './globals.css'

export const metadata = {
  title: 'GitRoast 🔥 — Get Your GitHub Brutally Roasted',
  description: 'Paste your GitHub username. Get savagely roasted. Share the pain.',
  keywords: 'github roast, developer humor, github profile, code roast',
  openGraph: {
    title: 'GitRoast 🔥 — Get Your GitHub Brutally Roasted',
    description: 'Paste your GitHub username. Get savagely roasted. Share the pain.',
    type: 'website',
    url: 'https://gitroast.dev',
    images: [{
      url: '/og-default.png',
      width: 1200,
      height: 630,
      alt: 'GitRoast — GitHub Roast Generator',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GitRoast 🔥',
    description: 'Get your GitHub brutally roasted.',
    images: ['/og-default.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* WHY AuthProvider here: wraps entire app
            so any component can call useAuth() */}
        <AuthProvider>
          {/* WHY Suspense: required for useSearchParams
              in auth/callback/page.jsx */}
          <Suspense>
            {children}
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  )
}