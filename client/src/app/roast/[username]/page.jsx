// ============================================================
// GITROAST — Roast Result Page (SSR Shell)
// ============================================================
// WHAT: Server component that generates per-roast metadata
//       then hands rendering to RoastPageClient.
//
// WHY server component:
//   generateMetadata runs on the server — can fetch roast data
//   and build custom OG tags per username.
//   Client component cannot export generateMetadata.
//
// WHY dynamic OG image URL:
//   Each roast gets a unique preview card showing real score/grade.
//   When @someone shares /roast/torvalds on Twitter:
//     → Twitter fetches /api/og?username=torvalds
//     → Gets a 1200×630 PNG with Linus's actual score
//     → Much more compelling than a generic GitRoast image
//     → Higher click-through rate → more users → more roasts
//
// WHERE: client/src/app/roast/[username]/page.jsx
// ============================================================

import { Suspense } from 'react'
import RoastPageClient from './RoastPageClient'

// WHY generateMetadata (not static metadata export):
//   Static metadata is the same for every page.
//   generateMetadata runs per-request with access to params
//   so /roast/torvalds and /roast/sam get different titles + OG images.
export async function generateMetadata({ params }) {
    const { username } = await params

    // WHY NEXT_PUBLIC_SITE_URL:
    //   OG image URL must be absolute — Twitter/LinkedIn need full URL
    //   In development: http://localhost:3000
    //   In production:  https://gitroast-dev.vercel.app
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    // WHY dynamic OG image URL:
    //   Each username gets their own preview card
    //   /api/og?username=torvalds → Edge function renders score + roast
    const ogImageUrl = `${siteUrl}/api/og?username=${encodeURIComponent(username)}`

    return {
        // WHY template format: "Get @torvalds Roasted — GitRoast 🔥"
        //   Username first = most scannable in browser tab + search results
        title: `Get @${username} Roasted — GitRoast 🔥`,
        description: `See @${username}'s GitHub brutally roasted. Score, grade, and a savage roast. Can you do worse?`,

        openGraph: {
            title: `@${username}'s GitHub got roasted 🔥`,
            description: `See the score, grade, and roast. Then get roasted yourself.`,
            type: 'website',
            url: `${siteUrl}/roast/${username}`,
            // WHY dynamic image: each roast shows different score/grade preview
            images: [{
                url: ogImageUrl,
                width: 1200,
                height: 630,
                alt: `@${username}'s GitRoast score card`,
            }],
        },

        twitter: {
            card: 'summary_large_image',
            // WHY: Large image card on Twitter = more visual real estate
            //      More attention = higher click-through rate
            title: `@${username}'s GitHub got roasted 🔥`,
            description: `See the damage. Then get roasted yourself.`,
            images: [ogImageUrl],
        },
    }
}

// WHAT: Passes parsed username down to client component
// WHY async: params is a Promise in Next.js 15+ — must await
export default async function RoastPage({ params }) {
    const { username } = await params

    return (
        <Suspense fallback={null}>
            <RoastPageClient username={username} />
        </Suspense>
    )
}