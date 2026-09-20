// ============================================================
// GITROAST — Dynamic SVG GitHub README Badge (Query Param Variant)
// ============================================================
// WHAT: Handles /api/badge?username=torvalds
// ============================================================

export const runtime = 'edge';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const username = (searchParams.get('username') || '').trim();
    const style = searchParams.get('style') || 'card';

    if (!username) {
        return new Response(
            JSON.stringify({
                error: 'MISSING_USERNAME',
                message: 'username query parameter is required (e.g. /api/badge?username=torvalds)',
            }),
            {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    const targetUrl = new URL(`/api/badge/${encodeURIComponent(username)}?style=${encodeURIComponent(style)}`, request.url);
    return Response.redirect(targetUrl, 307);
}
