// Returns the visitor's country (ISO-3166 alpha-2) from the edge header so the
// client can request regional pricing from the API. Falls back to "US".
export const dynamic = "force-dynamic";

export async function GET(request) {
  const raw = request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "";
  const country = /^[A-Za-z]{2}$/.test(raw) ? raw.toUpperCase() : "US";
  return Response.json({ country }, { headers: { "Cache-Control": "private, max-age=3600" } });
}
