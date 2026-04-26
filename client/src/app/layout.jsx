// ============================================================
// GITROAST — Root Layout
// ============================================================
// WHAT: The outermost shell rendered on every page.
//       Sets up fonts, metadata, providers, and global components.
//
// WHY here (not per-page):
//   Fonts → loaded once → cached → zero FOUT on navigation
//   AuthProvider → auth state available everywhere without re-fetching
//   HydrationWrapper → global loader → consistent first-load experience
//   GlobalErrorTracker → catches errors across ALL pages from one place
//   Footer → appears on every page automatically
//
// WHERE: client/src/app/layout.jsx — Next.js App Router root layout
// ============================================================
import Script from "next/script";
import { Bebas_Neue, Fira_Code, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import ToastConfig from "@/components/ToastConfig";
import Footer from "@/components/Footer";
import HydrationWrapper from "@/components/HydrationWrapper";
import GlobalErrorTracker from "@/utils/clientErrorTracker";
import "./globals.css";

// ── Fonts ─────────────────────────────────────────────────────
// WHAT: next/font loads and self-hosts Google Fonts at build time.
// WHY next/font over @import:
//   - Zero layout shift (FOUT) — font bytes arrive with the page
//   - Self-hosted — no Google Fonts CDN dependency at runtime
//   - Each font exposed as a CSS variable → used in globals.css
// WHY these 3 fonts:
//   Bebas Neue  → display — bold headers, scores, logo (GITROAST)
//   Fira Code   → mono    — terminal, stats, badge text (developer aesthetic)
//   Plus Jakarta Sans → body — readable prose, descriptions
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap", // WHY swap: shows fallback font while loading
  variable: "--font-display-loaded",
});
const firaCode = Fira_Code({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-loaded",
});
const plusJakartaSans = Plus_Jakarta_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body-loaded",
});

// ── Viewport ──────────────────────────────────────────────────
// WHAT: Controls mobile browser chrome behaviour
// WHY here (not in metadata): Next.js 14+ requires viewport in its own export
//     Mixing it into metadata causes a build warning
// WHY themeColor #FF4500: browser tab header turns fire-orange on mobile
//     consistent with brand, looks intentional
export const viewport = {
  themeColor: "#FF4500",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

// ── Metadata ──────────────────────────────────────────────────
// WHAT: Sets <title>, <meta description>, Open Graph, Twitter Card for ALL pages.
//       Individual pages can override these via their own generateMetadata().
// WHY metadataBase: required for Next.js to resolve relative OG image URLs
//     /og-default.png → https://gitroast-dev.vercel.app/og-default.png
// WHY Twitter card summary_large_image: shows the full 1200×630 OG image
//     when anyone shares gitroast on Twitter → viral image preview
export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: "GitRoast 🔥 — Get Your GitHub Brutally Roasted",
  description:
    "Paste your GitHub username. Get savagely roasted. Share the pain.",
  keywords:
    "github roast, developer humor, github profile, code roast, github stats",
  authors: [{ name: "GitRoast" }],
  applicationName: "GitRoast",
  openGraph: {
    title: "GitRoast 🔥 — Get Your GitHub Brutally Roasted",
    description:
      "Paste your GitHub username. Get savagely roasted. Share the pain.",
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
  robots: { index: true, follow: true },
};

// ── Root Layout Component ─────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`
        ${bebasNeue.variable}
        ${firaCode.variable}
        ${plusJakartaSans.variable}
      `}
    >
      <body>
        {/* WHAT: Initializes brand toast colors globally — runs once on mount
            WHY first in body: ensures brand colors set before any page renders */}
        <ToastConfig />

        {/* WHAT: Catches all unhandled JS errors + promise rejections
            WHY here: applies globally to every page — one registration */}
        <GlobalErrorTracker />

        {/* WHAT: Provides GitHub OAuth state to entire app
            WHY wraps children: every page can call useAuth() safely */}
        <AuthProvider>
          {/* WHAT: Shows branded loading screen during page hydration
              WHY Suspense: required wrapper for async server components
              WHY fallback null: HydrationWrapper handles the loading UI */}
          <Suspense fallback={null}>
            <HydrationWrapper>{children}</HydrationWrapper>
          </Suspense>
        </AuthProvider>

        {/* WHAT: Fixed bottom footer — brand + links + copyright
            WHY outside AuthProvider: footer has no auth dependency
            WHY outside HydrationWrapper: footer renders immediately — 
                never part of the loading state */}
        <Footer />

        {/* Google Analytics */}
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
