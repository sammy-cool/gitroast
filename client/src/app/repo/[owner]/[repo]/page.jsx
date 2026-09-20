// ============================================================
// GITROAST — Repository Roast SSR Page
// ============================================================
// WHAT: Server component generating dynamic metadata and JSON-LD
//       schema for repository-level deep roasts.
// ============================================================

import { Suspense } from 'react'
import RepoRoastClient from './RepoRoastClient'

export async function generateMetadata({ params }) {
  const { owner, repo } = await params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'
  const repoSlug = `${owner}/${repo}`

  return {
    title: `Roast ${repoSlug} — GitRoast 🔥`,
    description: `Deep repository roast for ${repoSlug}. Inspect commit sins, missing tests, README emptiness, and code smells.`,
    keywords: [
      `roast ${repoSlug}`,
      `${repo} github roast`,
      `${owner} github repo`,
      'repository code review',
      'github repo sins',
    ],
    alternates: {
      canonical: `${siteUrl}/repo/${owner}/${repo}`,
    },
    openGraph: {
      title: `${repoSlug} got roasted on GitRoast 🔥`,
      description: `Commit hygiene, missing tests, and architectural sins of ${repoSlug} exposed.`,
      type: 'website',
      url: `${siteUrl}/repo/${owner}/${repo}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${repoSlug} got roasted on GitRoast 🔥`,
      description: `Commit hygiene and architectural sins exposed.`,
      creator: '@gitroast',
    },
  }
}

export default async function RepoRoastPage({ params }) {
  const { owner, repo } = await params
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `GitRoast — ${owner}/${repo}`,
    url: `${siteUrl}/repo/${owner}/${repo}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `${owner}/${repo}`,
          item: `${siteUrl}/repo/${owner}/${repo}`,
        },
      ],
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense fallback={<div className="loading font-mono">Loading repo analysis...</div>}>
        <RepoRoastClient owner={owner} repo={repo} />
      </Suspense>
    </>
  )
}
