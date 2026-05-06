// ============================================================
// GITROAST — Dynamic OG Image Route
// ============================================================
// WHAT: Generates a unique 1200×630 PNG preview image per roast.
//       Called by Twitter/LinkedIn/WhatsApp when someone shares
//       a roast link — shows the actual score, grade, roast snippet.
//
// WHY Next.js Route Handler (not Express backend):
//   ImageResponse uses a browser-like rendering engine (Satori)
//   built into Next.js — renders JSX to PNG natively.
//   Express cannot do this without puppeteer (heavy, slow).
//   Next.js Edge Runtime serves this globally via Vercel CDN.
//
// WHY /api/og not /api/roast/og:
//   Clean URL, easy to remember, standard convention.
//   Twitter card validator hits: /api/og?username=sam
//
// FREE vs PRO differentiation:
//   Free → score shown, grade shown, roast snippet shown
//          "FREE ROAST" label — no Pro badge
//   Pro  → same + "AI ROAST ⚡" badge + "PRO" label
//          subtle but visible signal of premium quality
//
// FALLBACK: if username not found or fetch fails →
//           returns generic GitRoast branded image (never 404)
//
// WHERE: client/src/app/api/og/route.js
// ============================================================

import { ImageResponse } from "next/og";

// WHY Edge runtime:
//   Satori (used by ImageResponse) requires Edge runtime
//   Edge = globally distributed, faster cold starts than Node.js
//   Standard Next.js Node runtime does NOT support ImageResponse
export const runtime = "edge";

// WHY these dimensions:
//   1200×630 = Twitter/OG recommended size
//   Displays as "summary_large_image" card on Twitter
//   Also correct for LinkedIn, Facebook, WhatsApp previews
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

// ── Score color helper ────────────────────────────────────────
// WHAT: Returns fire/warn/bad color based on score
// WHY: Matches RoastCard color logic exactly — consistent branding
function getScoreColor(score) {
  if (score < 40) return "#FF3D3D"; // --bad  → catastrophic
  if (score < 70) return "#FFB700"; // --warn → rough/mediocre
  return "#00E676"; // --good → decent/respectable
}

// ── Grade background helper ───────────────────────────────────
function getGradeBg(grade) {
  if (grade === "F" || grade === "F-") return "rgba(255, 61, 61, 0.15)";
  if (grade === "D") return "rgba(255, 183, 0, 0.15)";
  return "rgba(0, 230, 118, 0.15)";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.toLowerCase();

  // ── Fetch roast data ────────────────────────────────────────
  // WHAT: Gets the latest roast for this username from the backend
  // WHY latest: OG image should reflect the most recent roast
  // WHY try/catch: if fetch fails, show fallback — never 404
  let roastData = null;

  if (username) {
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiBase}/api/history/${username}?limit=1`, {
        // WHY next.revalidate 3600:
        //   OG images are cached by Twitter/LinkedIn for hours anyway
        //   Revalidating every hour keeps it reasonably fresh
        //   without hammering the backend on every social media preview
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const json = await res.json();
        roastData = json?.roasts?.[0] || null;
      }
    } catch {
      // WHY: silently fall through to generic fallback
      //      a broken OG image is worse than a generic one
    }
  }

  // ── Roast snippet helper ──────────────────────────────────────
  // WHAT: Truncates roast text to fit in the OG image
  // WHY 140 chars: enough to be compelling, not so long it overflows
  function getSnippet(text) {
    if (!text) return "Get your GitHub brutally roasted.";
    return text.length > 140 ? text.slice(0, 137) + "..." : text;
  }

  const score = roastData?.score || null;
  const grade = roastData?.grade || null;
  const snippet = getSnippet(roastData?.roastText);
  const isPro = roastData?.isPro || false;
  const source = roastData?.roastSource || "rules";
  const isAI = source === "ai";

  const scoreColor = score ? getScoreColor(score) : "#FF6B00";
  const gradeBg = grade ? getGradeBg(grade) : "rgba(255,69,0,0.15)";

  return new ImageResponse(
    // ── Root container ──────────────────────────────────────
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: "#070707",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Courier New", monospace',
      }}
    >
      {/* ── Ambient glow ─────────────────────────────────── */}
      {/* WHY: matches the app's radial glow — brand consistency */}
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "900px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(255,69,0,0.2) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* ── Top accent line ──────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          height: "3px",
          background: "linear-gradient(90deg, #FF4500, #FF6B00, #FFB700)",
        }}
      />

      {/* ── Border ───────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          inset: "0",
          border: "1px solid #1C1C1C",
          pointerEvents: "none",
        }}
      />

      {/* ── Main content ─────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1",
          padding: "52px 64px",
          gap: "0",
        }}
      >
        {/* ── Header row: logo + badges ──────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: "36px",
              fontWeight: "900",
              fontFamily: 'Impact, "Arial Black", sans-serif',
              background: "linear-gradient(135deg, #FF4500, #FF6B00, #FFB700)",
              backgroundClip: "text",
              // WHY -webkit-text-fill-color:
              //   Satori (ImageResponse renderer) requires webkit prefix
              //   for gradient text — standard backgroundClip alone won't work
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "3px",
            }}
          >
            GITROAST 🔥
          </div>

          {/* Badges row */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {isAI && (
              <div
                style={{
                  fontSize: "13px",
                  padding: "5px 14px",
                  background: "rgba(255, 183, 0, 0.12)",
                  border: "1px solid rgba(255, 183, 0, 0.4)",
                  borderRadius: "6px",
                  color: "#FFB700",
                  letterSpacing: "1px",
                }}
              >
                ⚡ AI ROAST
              </div>
            )}
            <div
              style={{
                fontSize: "13px",
                padding: "5px 14px",
                background: isPro
                  ? "rgba(255,69,0,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: isPro
                  ? "1px solid rgba(255,69,0,0.4)"
                  : "1px solid #1C1C1C",
                borderRadius: "6px",
                color: isPro ? "#FF6B00" : "#3A3A3A",
                letterSpacing: "1px",
              }}
            >
              {isPro ? "PRO ⚡" : "FREE ROAST"}
            </div>
          </div>
        </div>

        {/* ── Username + score row ────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "28px",
          }}
        >
          {/* Username + tagline */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                fontSize: "58px",
                fontWeight: "700",
                color: "#F5F5F5",
                fontFamily: '"Courier New", monospace',
                lineHeight: "1",
              }}
            >
              @{username || "your-username"}
            </div>
            <div
              style={{
                fontSize: "20px",
                color: "#555555",
                fontFamily: '"Courier New", monospace',
              }}
            >
              GitHub Roast Report
            </div>
          </div>

          {/* Score + grade */}
          {score && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "96px",
                  fontWeight: "900",
                  fontFamily: 'Impact, "Arial Black", sans-serif',
                  color: scoreColor,
                  lineHeight: "1",
                }}
              >
                {score}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#555555",
                  fontFamily: '"Courier New", monospace',
                }}
              >
                /100 ROAST SCORE
              </div>
              {grade && (
                <div
                  style={{
                    fontSize: "18px",
                    padding: "4px 16px",
                    background: gradeBg,
                    border: `1px solid ${scoreColor}40`,
                    borderRadius: "6px",
                    color: scoreColor,
                    fontFamily: '"Courier New", monospace',
                    fontWeight: "700",
                    letterSpacing: "2px",
                  }}
                >
                  GRADE: {grade}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Roast snippet ───────────────────────────────── */}
        <div
          style={{
            flex: "1",
            padding: "24px 28px",
            background: "linear-gradient(135deg, #110900 0%, #0F0F0F 100%)",
            borderLeft: "4px solid #FF4500",
            borderRadius: "0 10px 10px 0",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: "22px",
              color: "#AAAAAA",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              lineHeight: "1.6",
            }}
          >
            &ldquo;{snippet}&rdquo;
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────── */}
      <div
        style={{
          padding: "16px 64px",
          borderTop: "1px solid #1C1C1C",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "#080808",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            color: "#3A3A3A",
            fontFamily: '"Courier New", monospace',
            letterSpacing: "2px",
          }}
        >
          ROASTED BY GITROAST
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#3A3A3A",
            fontFamily: '"Courier New", monospace',
          }}
        >
          Get your GitHub roasted too 🔥
        </div>
      </div>
    </div>,
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
    },
  );
}
