const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default async function sitemap() {
    const staticRoutes = [
        {
            url: SITE_URL,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${SITE_URL}/leaderboard`,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 0.9,
        },
        {
            url: `${SITE_URL}/battle`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.85,
        },
        {
            url: `${SITE_URL}/pricing`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${SITE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.75,
        },
        {
            url: `${SITE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
        },
    ]

    // Fetch recent roasts to dynamically include recently roasted profiles in the sitemap
    let dynamicRoutes = []
    try {
        const res = await fetch(`${API_BASE}/api/roast/feed`, {
            signal: AbortSignal.timeout(3000),
            next: { revalidate: 3600 },
        })
        if (res.ok) {
            const data = await res.json()
            const items = Array.isArray(data) ? data : (Array.isArray(data?.feed) ? data.feed : [])
            if (items.length > 0) {
                dynamicRoutes = items.flatMap(item => [
                    {
                        url: `${SITE_URL}/history/${encodeURIComponent(item.username)}`,
                        lastModified: item.createdAt ? new Date(item.createdAt) : new Date(),
                        changeFrequency: 'weekly',
                        priority: 0.7,
                    },
                    {
                        url: `${SITE_URL}/roast/${encodeURIComponent(item.username)}`,
                        lastModified: item.createdAt ? new Date(item.createdAt) : new Date(),
                        changeFrequency: 'weekly',
                        priority: 0.65,
                    },
                ])
            }
        }
    } catch {
        // Fallback gracefully to static routes if server is asleep
    }

    return [...staticRoutes, ...dynamicRoutes]
}
