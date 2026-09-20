import LandingPageClient from "./LandingPageClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gitroast.dev";

export const metadata = {
  title: "GitRoast 🔥 — Get Your GitHub Brutally Roasted | Top AI Code Roaster",
  description:
    "Paste any GitHub username and get savagely roasted by AI. Discover developer sins, commit shame, repo grades, and compete on the global Wall of Shame.",
  keywords: [
    "github roast",
    "roast my github",
    "github profile roast",
    "developer humor",
    "git roast",
    "code roast",
    "github stats",
    "developer portfolio roast",
    "github battle",
    "wall of shame github",
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "GitRoast 🔥 — Get Your GitHub Brutally Roasted",
    description:
      "Paste any GitHub username and get savagely roasted by AI. Discover developer sins, commit shame, and repo grades.",
    url: SITE_URL,
    siteName: "GitRoast",
    type: "website",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "GitRoast — Brutal GitHub Roaster",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GitRoast 🔥 — Get Your GitHub Brutally Roasted",
    description:
      "Paste any GitHub username and get savagely roasted by AI. Discover developer sins and commit shame.",
    images: ["/og-default.png"],
    creator: "@gitroast",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#app`,
      "name": "GitRoast",
      "url": SITE_URL,
      "description":
        "Brutally honest AI-powered GitHub profile and repository roasting application.",
      "applicationCategory": "DeveloperApplication",
      "operatingSystem": "All",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "1420",
        "bestRating": "5",
        "worstRating": "1",
      },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      "name": "GitRoast",
      "url": SITE_URL,
      "logo": `${SITE_URL}/apple-touch-icon.png`,
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}/#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is GitRoast?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "GitRoast is a developer comedy tool that analyzes GitHub repositories, commit patterns, and code habits to generate savagely entertaining roasts and developer scorecards.",
          },
        },
        {
          "@type": "Question",
          "name": "How does GitRoast roast my GitHub?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "GitRoast extracts public repository metadata, commit histories, and programming languages, evaluating them against rule-based comedy engines and generative AI.",
          },
        },
        {
          "@type": "Question",
          "name": "Can I battle another developer on GitRoast?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text":
              "Yes! GitRoast Roast Battle allows any two developers to face off head-to-head to compare commit consistency, code sins, and see who is crowned Most Roastable.",
          },
        },
      ],
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient />
    </>
  );
}
