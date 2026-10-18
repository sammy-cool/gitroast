import Script from "next/script";
import { Inter, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import MobileTabBar from "@/components/MobileTabBar";
import Footer from "@/components/Footer";
import HydrationWrapper from "@/components/HydrationWrapper";
import GlobalErrorTracker from "@/utils/clientErrorTracker";
import PWARegister from "@/components/PWARegister";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif-loaded",
});
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-loaded",
});
const plexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-code-loaded",
});

export const viewport = {
  themeColor: "#E84E2A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: "GitRoast — Your GitHub has a story. We brought matches.",
  description:
    "AI-powered satire grounded in public code. Get the laugh, see the evidence, and leave with a better developer story.",
  keywords:
    "github roast, developer humor, github profile, code roast, github stats",
  authors: [{ name: "GitRoast" }],
  applicationName: "GitRoast",
  openGraph: {
    title: "GitRoast — Your GitHub has a story. We brought matches.",
    description:
      "AI-powered satire grounded in public code. Get the laugh, see the evidence, and leave with a better developer story.",
    type: "website",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "GitRoast",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "GitRoast — GitHub Roast Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitRoast 🔥",
    description: "Get your GitHub brutally roasted.",
    images: ["/og-default.png"],
    creator: "@gitroast",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GitRoast",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`
        ${instrumentSerif.variable}
        ${inter.variable}
        ${plexMono.variable}

      `}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link
          rel="preconnect"
          href="https://avatars.githubusercontent.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://avatars.githubusercontent.com" />
        <link
          rel="sitemap"
          type="application/xml"
          title="Sitemap"
          href="/sitemap.xml"
        />
      </head>
      <body>
        {}
        <PWARegister />

        {}
        <GlobalErrorTracker />

        {}
        <AuthProvider>
          <SiteHeader />
          {}
          <Suspense fallback={null}>
            <HydrationWrapper>{children}</HydrationWrapper>
          </Suspense>
          <MobileTabBar />
        </AuthProvider>

        {}
        <Footer />

        {}
        {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
          <Script
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
            strategy="lazyOnload"
          />
        )}

        {}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-3CT533X7R2`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-3CT533X7R2', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </body>
    </html>
  );
}

