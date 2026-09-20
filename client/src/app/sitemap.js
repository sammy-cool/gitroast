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
      },
      {
        url: `${SITE_URL}/roast/${encodeURIComponent(username)}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: Math.max(0.5, priority - 0.05),
      }
    );
  }

  // 1. Fetch live feed items
  try {
    const feedRes = await fetch(`${API_BASE}/api/roast/feed`, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60 },
    });
    if (feedRes.ok) {
      const data = await feedRes.json();
      const items = Array.isArray(data) ? data : (Array.isArray(data?.feed) ? data.feed : []);
      items.forEach((item) => {
        addProfile(item.username, item.createdAt, 0.75);
      });
    }
  } catch {
    // Graceful fallback if backend is warming up
  }

  // 2. Fetch Wall of Shame top developers
  try {
    const lbRes = await fetch(`${API_BASE}/api/history/leaderboard/worst?page=1&limit=50`, {
      signal: AbortSignal.timeout(4000),
      next: { revalidate: 60 },
    });
    if (lbRes.ok) {
      const lbData = await lbRes.json();
      const rows = Array.isArray(lbData?.data) ? lbData.data : (Array.isArray(lbData) ? lbData : []);
      rows.forEach((row) => {
        addProfile(row.username, row.updatedAt || row.createdAt, 0.8);
      });
    }
  } catch {
    // Graceful fallback
  }

  return [...staticRoutes, ...dynamicRoutes];
}
