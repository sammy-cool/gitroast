// WHY no 'use client' here:
//     layout.jsx stays a Server Component intentionally
//     Server Components handle metadata, SEO, initial HTML
//     Client-side features (auth, toast) live in child components

import { AuthProvider } from '@/context/AuthContext'
import { Suspense } from 'react'
import ToastConfig from '@/components/ToastConfig'
import './globals.css'

// ─── SEO Metadata ─────────────────────────────────────────
// WHY here: Next.js App Router reads this export on the server
//           and injects correct <head> tags before sending HTML
//           This makes Google, Twitter, LinkedIn previews work
//           Without this — roast cards share as blank links
export const metadata = {
  title: 'GitRoast 🔥 — Get Your GitHub Brutally Roasted',
  description: 'Paste your GitHub username. Get savagely roasted. Share the pain.',
  keywords: 'github roast, developer humor, github profile, code roast, github stats',
  authors: [{ name: 'GitRoast' }],
  // WHY: tells Google this is a web application
  applicationName: 'GitRoast',
  // WHY: controls how page appears in browser tab on mobile
  themeColor: '#FF4500',
  openGraph: {
    title: 'GitRoast 🔥 — Get Your GitHub Brutally Roasted',
    description: 'Paste your GitHub username. Get savagely roasted. Share the pain.',
    type: 'website',
    url: 'https://gitroast.dev',
    siteName: 'GitRoast',
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
    // WHY: replace with your actual Twitter handle when live
    creator: '@gitroast',
  },
  // WHY robots: tells Google to index all pages by default
  //     individual pages can override this
  robots: {
    index: true,
    follow: true,
  },
}

// ─── Root Layout ──────────────────────────────────────────
// WHY children prop: every page in the app gets injected here
//     think of this as the picture frame — every page is the picture
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>

        {/* WHY ToastConfig FIRST inside body:
            initializes toast brand colors before any page renders
            so the very first toast that fires already has correct colors
            Must be client component — see ToastConfig.jsx for why */}
        <ToastConfig />

        {/* WHY AuthProvider wraps everything:
            makes useAuth() available in every component in the app
            login state, isPro, getToken — all accessible anywhere
            without prop drilling through every component */}
        <AuthProvider>

          {/* WHY Suspense wraps children:
              required for useSearchParams() in:
                → auth/callback/page.jsx (GitHub OAuth return)
                → payment/page.jsx (Razorpay redirect fallback)
              Without Suspense these pages crash with:
              "useSearchParams() should be wrapped in Suspense" */}
          <Suspense fallback={null}>
            {children}
          </Suspense>

        </AuthProvider>
      </body>
    </html>
  )
}