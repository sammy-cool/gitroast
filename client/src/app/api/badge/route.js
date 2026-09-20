// ============================================================
// GITROAST — Dynamic SVG GitHub README Badge (Query Param Variant)
// ============================================================
// WHAT: Handles /api/badge?username=torvalds
// ============================================================

export const runtime = 'edge';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || '';
    const style = searchParams.get('style') || 'card';

    const targetUrl = new URL(`/api/badge/${encodeURIComponent(username)}?style=${encodeURIComponent(style)}`, request.url);
    return Response.redirect(targetUrl, 307);
}
