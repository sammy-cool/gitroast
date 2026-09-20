// ============================================================
// GITROAST — Dynamic SVG GitHub README Badge
// ============================================================
// WHAT: Generates an embeddable SVG badge for GitHub README.md profiles.
//       Supports:
//       1. Card style (default): 380x110 sleek dark card with fire gradient, score, and grade
//       2. Shield style (?style=shield): Compact 180x28 shield badge
//
// WHY SVG:
//   - Pixel-perfect crisp rendering on retina displays
//   - Zero image libraries required (pure XML string)
//   - Fast rendering, low bandwidth (< 3KB)
//   - Caches smoothly with GitHub's Camo CDN proxy
//
// USAGE:
//   [![GitRoast Score](https://gitroast.dev/api/badge/torvalds)](https://gitroast.dev/history/torvalds)
// ============================================================

export const runtime = 'edge';

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function getScoreColor(score) {
    if (score === null || score === undefined) return '#FF6B00';
    if (score < 40) return '#FF3D3D';
    if (score < 70) return '#FFB700';
    return '#00E676';
}

export async function GET(request, { params }) {
    const resolvedParams = await params;
    const username = (resolvedParams?.username || '').trim().toLowerCase();
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style') || 'card';

    let roast = null;

    if (username) {
        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://gitroast-latest.onrender.com';
            const res = await fetch(`${apiBase}/api/history/${encodeURIComponent(username)}`, {
                headers: { 'Content-Type': 'application/json' },
                next: { revalidate: 1800 },
            });
            if (res.ok) {
                const data = await res.json();
                roast = data?.history?.[0] || null;
            }
        } catch {
            // Silently fall back to unroasted / placeholder badge
        }
    }

    const score = roast?.score ?? null;
    const grade = roast?.grade ?? (score !== null ? 'F' : '?');
    const color = getScoreColor(score);
    const safeUser = escapeXml(username || 'developer');

    // ── SHIELD STYLE (Compact 190x28) ──────────────────────────
    if (style === 'shield') {
        const labelText = `gitroast`;
        const valueText = score !== null ? `score ${score}/100 🔥` : `unroasted 🔥`;

        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="190" height="28" viewBox="0 0 190 28" role="img" aria-label="${safeUser} gitroast score">
  <linearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#FF4500" />
    <stop offset="100%" stop-color="#FF8C00" />
  </linearGradient>
  <clipPath id="r">
    <rect width="190" height="28" rx="6" fill="#fff" />
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="70" height="28" fill="#141414" />
    <rect x="70" width="120" height="28" fill="#0A0A0A" />
    <rect x="70" width="120" height="28" fill="${color}" fill-opacity="0.12" />
    <line x1="70" y1="0" x2="70" y2="28" stroke="#262626" stroke-width="1" />
  </g>
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">
    <text x="12" y="18" fill="#888888">${labelText}</text>
    <text x="80" y="18" fill="${color}">${valueText}</text>
  </g>
</svg>`.trim();

        return new Response(svg, {
            headers: {
                'Content-Type': 'image/svg+xml; charset=utf-8',
                'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    }

    // ── CARD STYLE (Default 380x112) ────────────────────────────
    const displayScore = score !== null ? `${score}` : '--';
    const displayGrade = score !== null ? `GRADE: ${grade}` : 'NOT ROASTED YET';
    const rawSnippet = roast?.roastText
        ? (roast.roastText.length > 55 ? roast.roastText.slice(0, 52) + '...' : roast.roastText)
        : 'Dare to get your GitHub brutally roasted?';
    const safeSnippet = escapeXml(rawSnippet);

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="380" height="112" viewBox="0 0 380 112" role="img" aria-label="${safeUser} roast badge">
  <defs>
    <linearGradient id="fireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF4500" />
      <stop offset="50%" stop-color="#FF6B00" />
      <stop offset="100%" stop-color="#FFB700" />
    </linearGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#141414" />
      <stop offset="100%" stop-color="#0A0A0A" />
    </linearGradient>
  </defs>

  <!-- Background Card -->
  <rect x="1" y="1" width="378" height="110" rx="10" fill="url(#cardBg)" stroke="#222222" stroke-width="1.5" />
  
  <!-- Accent Top Border -->
  <path d="M 1 11 A 10 10 0 0 1 11 1 L 369 1 A 10 10 0 0 1 379 11 L 379 3 L 1 3 Z" fill="url(#fireGrad)" />

  <!-- Logo + User Header -->
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
    <text x="18" y="26" font-size="12" font-weight="900" fill="#FF6B00" letter-spacing="1">GITROAST 🔥</text>
    <text x="18" y="46" font-size="16" font-weight="700" fill="#F5F5F5">@${safeUser}</text>
  </g>

  <!-- Score & Grade Block -->
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" text-anchor="end">
    <text x="362" y="44" font-size="32" font-weight="900" fill="${color}">${displayScore}<tspan font-size="13" font-weight="500" fill="#666">/100</tspan></text>
    <rect x="274" y="52" width="88" height="18" rx="4" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-opacity="0.35" stroke-width="1" />
    <text x="318" y="65" font-size="10" font-weight="700" fill="${color}" text-anchor="middle" letter-spacing="0.5">${displayGrade}</text>
  </g>

  <!-- Divider -->
  <line x1="18" y1="76" x2="362" y2="76" stroke="#1F1F1F" stroke-width="1" />

  <!-- Roast Snippet -->
  <g font-family="Georgia, serif" font-style="italic" font-size="11" fill="#8E8E8E">
    <text x="18" y="95">"${safeSnippet}"</text>
  </g>
</svg>`.trim();

    return new Response(svg, {
        headers: {
            'Content-Type': 'image/svg+xml; charset=utf-8',
            'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}
