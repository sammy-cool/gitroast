// ============================================================
// GITROAST — Dynamic OG Image Route
// ============================================================
// WHAT: Generates a unique 1200×630 PNG preview image per roast.
//       Called by Twitter/LinkedIn/WhatsApp when a roast link is shared.
//
// WHY Next.js Route Handler not Express:
//   ImageResponse uses Satori — a JSX-to-PNG renderer built into Next.js.
//   Satori runs on Edge Runtime — globally distributed, fast cold starts.
//   Express cannot render JSX to PNG without puppeteer (heavy, slow).
//
// ⚠️ SATORI RULES (critical — breaks with 500 if violated):
//   1. Every div with 2+ children MUST have display: 'flex'
//   2. No CSS shorthand (no margin: '10px 20px' — use marginTop etc.)
//   3. No CSS variables (no var(--fire) — use raw hex values)
//   4. No @keyframes or CSS animations
//   5. Images must be remote URLs or base64 — no local imports
//   6. Limited font support — only loaded fonts work
//
// WHERE: client/src/app/api/og/route.js
// ============================================================

import { ImageResponse } from "next/og";

// WHY edge runtime: required for ImageResponse/Satori to work
//     standard Node.js runtime does NOT support ImageResponse
export const runtime = "edge";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function getScoreColor(score) {
  if (!score) return "#FF6B00";
  if (score < 40) return "#FF3D3D";
  if (score < 70) return "#FFB700";
  return "#00E676";
}

function getSnippet(text) {
  if (!text) return "Get your GitHub brutally roasted.";
  return text.length > 130 ? text.slice(0, 127) + "..." : text;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username")?.toLowerCase();

  let roastData = null;

  if (username) {
    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiBase}/api/history/${username}`, {
        next: { revalidate: 3600 },
      });
      if (res.ok) {
        const json = await res.json();

        roastData = json?.history?.[0] || null;
      }
    } catch {
      // WHY silent: fallback to generic image — never 500 from fetch failure
    }
  }

  const score = roastData?.score || null;
  const grade = roastData?.grade || null;
  const snippet = getSnippet(roastData?.roastText);
  const isPro = roastData?.isPro || false;
  const isAI = roastData?.roastSource === "ai";
  const scoreColor = getScoreColor(score);

  return new ImageResponse(
    // ── Root — WHY display flex: Satori requires flex on ALL multi-child divs
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: "#070707",
        display: "flex", // ← REQUIRED by Satori
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Courier New", monospace',
      }}
    >
      {/* Top gradient accent bar */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          height: "3px",
          background: "linear-gradient(90deg, #FF4500, #FF6B00, #FFB700)",
          display: "flex", // WHY: Satori rule — even single-child divs need flex
        }}
      />

      {/* Ambient glow — bottom center */}
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          left: "150px",
          width: "900px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(255,69,0,0.18) 0%, transparent 70%)",
          borderRadius: "50%",
          display: "flex",
        }}
      />

      {/* Outer border */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          border: "1px solid #1C1C1C",
          display: "flex",
        }}
      />

      {/* ── Main content area ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1",
          padding: "48px 64px 0 64px",
        }}
      >
        {/* Header row: logo + badges */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              fontSize: "34px",
              fontWeight: "900",
              fontFamily: 'Impact, "Arial Black", sans-serif',
              color: "#FF6B00",
              letterSpacing: "3px",
            }}
          >
            GITROAST 🔥
          </div>

          {/* Badges */}
          <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
            {isAI && (
              <div
                style={{
                  display: "flex",
                  fontSize: "13px",
                  padding: "5px 14px",
                  background: "rgba(255,183,0,0.12)",
                  border: "1px solid rgba(255,183,0,0.4)",
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
                display: "flex",
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

        {/* Username + score row */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          {/* Left: username + label */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "54px",
                fontWeight: "700",
                color: "#F5F5F5",
                lineHeight: "1",
              }}
            >
              @{username || "your-username"}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "18px",
                color: "#555555",
              }}
            >
              GitHub Roast Report
            </div>
          </div>

          {/* Right: score + grade */}
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
                  display: "flex",
                  fontSize: "92px",
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
                  display: "flex",
                  fontSize: "14px",
                  color: "#555555",
                }}
              >
                /100 ROAST SCORE
              </div>
              {grade && (
                <div
                  style={{
                    display: "flex",
                    fontSize: "16px",
                    padding: "4px 16px",
                    background: `${scoreColor}22`,
                    border: `1px solid ${scoreColor}44`,
                    borderRadius: "6px",
                    color: scoreColor,
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

        {/* Roast snippet */}
        <div
          style={{
            display: "flex",
            flex: "1",
            padding: "22px 26px",
            background: "#110900",
            borderLeft: "4px solid #FF4500",
            borderRadius: "0 10px 10px 0",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "20px",
              color: "#888888",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              lineHeight: "1.6",
            }}
          >
            &ldquo;{snippet}&rdquo;
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 64px",
          borderTop: "1px solid #1C1C1C",
          background: "#080808",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "13px",
            color: "#3A3A3A",
            letterSpacing: "2px",
          }}
        >
          ROASTED BY GITROAST
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "13px",
            color: "#3A3A3A",
          }}
        >
          Get your GitHub roasted too 🔥
        </div>
      </div>
    </div>,
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
