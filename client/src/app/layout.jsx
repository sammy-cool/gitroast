import Script from "next/script";
import { Bebas_Neue, Fira_Code, Plus_Jakarta_Sans } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import ToastConfig from "@/components/ToastConfig";
import Footer from "@/components/Footer";
import "./globals.css";
import HydrationWrapper from "@/components/HydrationWrapper";

// ─── Fonts ────────────────────────────────────────────────
const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
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

// ─── Viewport ─────────────────────────────────────────────
export const viewport = {
  themeColor: "#FF4500",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

// ─── Metadata ─────────────────────────────────────────────
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
    url: "https://gitroast.dev",
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

// ─── Root Layout ──────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`
        ${bebasNeue.variable}
        ${firaCode.variable}
        ${plusJakartaSans.variable}
      `}
    >
      <body>
        <ToastConfig />

        <AuthProvider>
          <HydrationWrapper>
            <Suspense fallback={null}>
              {children}
            </Suspense>
          </HydrationWrapper>
        </AuthProvider>

        {/* WHY Footer outside AuthProvider:
            Footer has no auth dependency
            Renders on every page automatically */}
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
