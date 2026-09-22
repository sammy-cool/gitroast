const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gitroast.dev';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// WHAT: Dynamic sitemap revalidation interval (seconds)
// WHY: 60 seconds ensures newly roasted profiles and leaderboard additions
//      are automatically populated into the sitemap without manual redeployments.
export const revalidate = 60;

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
  ];

  const seenUsernames = new Set();
  const dynamicRoutes = [];

  // Helper to add profile routes safely
  function addProfile(username, date, priority = 0.7) {
    if (!username || seenUsernames.has(username.toLowerCase())) return;
    seenUsernames.add(username.toLowerCase());

    const lastModified = date ? new Date(date) : new Date();

    dynamicRoutes.push(
      {
        url: `${SITE_URL}/history/${encodeURIComponent(username)}`,
        lastModified,
        changeFrequency: 'weekly',
        priority,
      }
    );
  }

  try {
    const [feedResult, lbResult] = await Promise.allSettled([
      fetch(`${API_BASE}/api/roast/feed`, { signal: AbortSignal.timeout(6000), next: { revalidate: 60 } }),
      fetch(`${API_BASE}/api/history/leaderboard/worst?page=1&limit=50`, { signal: AbortSignal.timeout(6000), next: { revalidate: 60 } }),
    ]);

    if (feedResult.status === 'fulfilled' && feedResult.value.ok) {
      const data = await feedResult.value.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.feed) ? data.feed : []);
      items.forEach((item) => {
        addProfile(item.username, item.createdAt, 0.75);
      });
    }

    if (lbResult.status === 'fulfilled' && lbResult.value.ok) {
      const lbData = await lbResult.value.json();
      const rows = Array.isArray(lbData?.data) ? lbData.data : (Array.isArray(lbData) ? lbData : []);
      rows.forEach((row) => {
        addProfile(row.username, row.updatedAt || row.createdAt, 0.8);
      });
    }
  } catch {
    // Graceful fallback if backend is warming up
  }

  return [...staticRoutes, ...dynamicRoutes];
}
