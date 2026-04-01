// WHY no 'use client': layout.jsx stays a Server Component
//     Server Components handle metadata, SEO, initial HTML
//     Client-side features (auth, toast) live in child components

// WHY next/font instead of @import in globals.css:
//     @import = browser makes a separate request to Google
//              = render blocks until fonts arrive
//              = FOUT (Flash of Unstyled Text) = layout shift
//     next/font = fonts self-hosted by Next.js automatically
//               = loaded before first paint
//               = zero layout shift = zero external request
//               = better privacy (no Google tracking)
import { Bebas_Neue, Fira_Code, Plus_Jakarta_Sans } from 'next/font/google'
import { AuthProvider } from '@/context/AuthContext'
import { Suspense } from 'react'
import ToastConfig from '@/components/ToastConfig'
import './globals.css'

// ─── Font Definitions ─────────────────────────────────────
// WHY display: 'swap': if font not loaded yet, show fallback
//     font then swap — prevents invisible text
//     'block' would hide text until font loads = worse UX
const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  // WHY variable: creates a CSS variable we use in globals.css
  variable: '--font-display-loaded',
})

const firaCode = Fira_Code({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono-loaded',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body-loaded',
})

// ─── Viewport Export ──────────────────────────────────────
// WHY separate from metadata: Next.js 14+ requires themeColor
//     in viewport export NOT metadata export
export const viewport = {
  // WHY #FF4500: GitRoast fire orange — controls browser UI
  //     color on mobile (address bar, tab bar on Android/iOS)
  themeColor: '#FF4500',
  // WHY: ensures proper scaling on all mobile devices
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// ─── SEO Metadata ─────────────────────────────────────────
export const metadata = {
  // WHY metadataBase: resolves relative OG image URLs correctly
  //     /og-default.png → https://gitroast.dev/og-default.png
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: 'GitRoast 🔥 — Get Your GitHub Brutally Roasted',
  description: 'Paste your GitHub username. Get savagely roasted. Share the pain.',
  keywords: 'github roast, developer humor, github profile, code roast, github stats',
  authors: [{ name: 'GitRoast' }],
  applicationName: 'GitRoast',
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
    // WHY className with font variables:
    //     attaches CSS variables to <html> element
    //     makes --font-display-loaded, --font-mono-loaded,
    //     --font-body-loaded available to ALL components
    //     globals.css reads these variables
    <html
      lang="en"
      className={`
        ${bebasNeue.variable}
        ${firaCode.variable}
        ${plusJakartaSans.variable}
      `}
    >
      <body>
        {/* WHY ToastConfig first: initializes brand colors
            before any page renders */}
        <ToastConfig />

        {/* WHY AuthProvider: makes useAuth() available
            in every component without prop drilling */}
        <AuthProvider>

          {/* WHY Suspense wraps children:
              required for useSearchParams() in:
                → auth/callback/page.jsx (GitHub OAuth return)
                → payment/page.jsx (Razorpay redirect fallback)
              Without Suspense these pages crash with:
              "useSearchParams() should be wrapped in Suspense" */}
          {/* WHY Suspense: required for useSearchParams()
              in auth/callback and payment pages */}
          <Suspense fallback={null}>
            {children}
          </Suspense>

        </AuthProvider>
      </body>
    </html>
  )
}