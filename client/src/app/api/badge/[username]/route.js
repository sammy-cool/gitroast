import { intensityLabel } from '@/utils/vocab';

export const runtime = 'edge';

// README badge in the GitRoast design system: ink surface, ember flame mark, honest public score.
const INK = '#171711';
const LINE = '#2E2D24';
const TEXT = '#F3EFE8';
const MUTED = '#A9A395';
const EMBER = '#E84E2A';
const FLAME = 'M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-1.7.8-3 1.7-4 .2 1.2.9 2 1.8 2.2C10.2 8.2 10.5 5.6 12 3z';
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

function escapeXml(unsafe) {
    if (!unsafe) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Readable on the ink surface (not the light-theme accents).
function truncateAtWord(text, max) {
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 3);
    const lastSpace = cut.lastIndexOf(' ');
    return `${(lastSpace > 20 ? cut.slice(0, lastSpace) : cut).trimEnd()}...`;
}

function getScoreColor(score) {
    if (score === null || score === undefined) return MUTED;
    if (score < 40) return '#F0705A';
    if (score < 70) return '#E6B84A';
    return '#7FD3A0';
}

const HEADERS = {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
};

export async function GET(request, { params }) {
    const resolvedParams = await params;
    const username = (resolvedParams?.username || '').trim().toLowerCase();
    const { searchParams } = new URL(request.url);
    const style = searchParams.get('style') === 'shield' ? 'shield' : 'card';

    let roast = null;
    if (/^[a-z0-9-]{1,39}$/.test(username)) {
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
            /* an unreachable API renders the "not roasted yet" badge */
        }
    }

    const score = roast?.score ?? null;
    const grade = roast?.grade ?? (score !== null ? 'F' : '?');
    const color = getScoreColor(score);
    const safeUser = escapeXml(username || 'developer');

    if (style === 'shield') {
        const intensity = roast?.intensity ? intensityLabel(roast.intensity) : '';
        const label = 'GitRoast';
        const value = score !== null ? `${score}${intensity ? ` • ${intensity}` : ''}` : 'not roasted yet';
        const labelW = 22 + label.length * 7.2;
        const valueW = 10 + value.length * 6.7;
        const width = Math.round(labelW + valueW + 4);
        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" viewBox="0 0 ${width} 28" role="img" aria-label="${safeUser} GitRoast score ${score ?? 'not available'}">
  <title>${safeUser} on GitRoast</title>
  <rect width="${width}" height="28" rx="14" fill="${INK}"/>
  <rect x="0.5" y="0.5" width="${width - 1}" height="27" rx="13.5" fill="none" stroke="${LINE}"/>
  <g transform="translate(8 5) scale(0.75)" fill="none" stroke="${EMBER}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${FLAME}"/></g>
  <g font-size="11" font-weight="600">
    <text x="30" y="18" font-family="${SANS}" fill="${TEXT}">${label}</text>
    <text x="${Math.round(labelW + 6)}" y="18" font-family="${MONO}" fill="${color}">${escapeXml(value)}</text>
  </g>
</svg>`.trim();
        return new Response(svg, { headers: HEADERS });
    }

    const displayScore = score !== null ? `${score}` : '--';
    const displayGrade = score !== null ? `GRADE ${grade}` : 'NOT ROASTED YET';
    const gradeW = Math.max(74, 18 + displayGrade.length * 6.4);
    const rawSnippet = roast?.roastText
        ? truncateAtWord(roast.roastText, 58)
        : 'Your GitHub has a story. We brought matches.';
    const safeSnippet = escapeXml(rawSnippet);

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="380" height="112" viewBox="0 0 380 112" role="img" aria-label="${safeUser} GitRoast score ${score ?? 'not available'}">
  <title>${safeUser} on GitRoast</title>
  <defs><clipPath id="card"><rect x="0.75" y="0.75" width="378.5" height="110.5" rx="14"/></clipPath></defs>
  <rect x="0.75" y="0.75" width="378.5" height="110.5" rx="14" fill="${INK}"/>
  <rect x="0" y="0" width="380" height="4" fill="${EMBER}" clip-path="url(#card)"/>
  <rect x="0.75" y="0.75" width="378.5" height="110.5" rx="14" fill="none" stroke="${LINE}" stroke-width="1.5"/>

  <g transform="translate(18 16)">
    <rect width="24" height="24" rx="7" fill="${EMBER}"/>
    <g transform="translate(5 5) scale(0.58)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${FLAME}"/></g>
  </g>
  <text x="50" y="33" font-family="${SANS}" font-size="14" font-weight="600" fill="${TEXT}">GitRoast</text>
  <text x="18" y="62" font-family="${MONO}" font-size="13" font-weight="600" fill="${MUTED}">@${safeUser}</text>

  <g text-anchor="end">
    <text x="362" y="47" font-family="Georgia, 'Times New Roman', serif" font-size="38" fill="${color}">${displayScore}<tspan font-family="${MONO}" font-size="12" fill="${MUTED}">/100</tspan></text>
    <rect x="${362 - gradeW}" y="55" width="${gradeW}" height="19" rx="9.5" fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-opacity="0.45"/>
    <text x="${362 - gradeW / 2}" y="68" font-family="${MONO}" font-size="10" font-weight="700" fill="${color}" text-anchor="middle" letter-spacing="0.5">${displayGrade}</text>
  </g>

  <line x1="18" y1="82" x2="362" y2="82" stroke="${LINE}"/>
  <text x="18" y="100" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="11.5" fill="${MUTED}">&quot;${safeSnippet}&quot;</text>
</svg>`.trim();

    return new Response(svg, { headers: HEADERS });
}
