import { ImageResponse } from "next/og";

export const runtime = "edge";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function getScoreColor(score) {
  if (!score) return "#E84E2A";
  if (score < 40) return "#F0705A";
  if (score < 70) return "#E6B84A";
  return "#7FD3A0";
}

function getSnippet(text) {
  if (!text) return "Your GitHub has a story.";
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
      const res = await fetch(
        `${apiBase}/api/history/${encodeURIComponent(username)}`,
        {
          next: { revalidate: 3600 },
        },
      );
      if (res.ok) {
        const json = await res.json();

        roastData = json?.history?.[0] || null;
      }
    } catch {
    }
  }

  const score = roastData?.score || null;
  const grade = roastData?.grade || null;
  const snippet = getSnippet(roastData?.roastText);
  const isPro = roastData?.isPro || false;
  const isAI = roastData?.roastSource === "ai";
  const scoreColor = getScoreColor(score);

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: "#171711",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        fontFamily: '"Courier New", monospace',
      }}
    >
      {}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          height: "3px",
          background: "linear-gradient(90deg, #E84E2A, #E84E2A, #E6B84A)",
          display: "flex",
        }}
      />

      {}
      <div
        style={{
          position: "absolute",
          bottom: "-120px",
          left: "150px",
          width: "900px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(232, 78, 42,0.18) 0%, transparent 70%)",
          borderRadius: "50%",
          display: "flex",
        }}
      />

      {}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          bottom: "0",
          border: "1px solid #2E2D24",
          display: "flex",
        }}
      />

      {}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: "1",
          padding: "48px 64px 0 64px",
        }}
      >
        {}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "28px",
          }}
        >
          {}
          <div
            style={{
              display: "flex",
              fontSize: "34px",
              fontWeight: "900",
              fontFamily: 'Georgia, serif',
              color: "#E84E2A",
              letterSpacing: "3px",
            }}
          >
            GitRoast
          </div>

          {}
          <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
            {isAI && (
              <div
                style={{
                  display: "flex",
                  fontSize: "13px",
                  padding: "5px 14px",
                  background: "rgba(230, 184, 74,0.12)",
                  border: "1px solid rgba(230, 184, 74,0.4)",
                  borderRadius: "6px",
                  color: "#E6B84A",
                  letterSpacing: "1px",
                }}
              >
                AI ROAST
              </div>
            )}
            <div
              style={{
                display: "flex",
                fontSize: "13px",
                padding: "5px 14px",
                background: isPro
                  ? "rgba(232, 78, 42,0.12)"
                  : "rgba(255,255,255,0.04)",
                border: isPro
                  ? "1px solid rgba(232, 78, 42,0.4)"
                  : "1px solid #2E2D24",
                borderRadius: "6px",
                color: isPro ? "#E84E2A" : "#3A3A3A",
                letterSpacing: "1px",
              }}
            >
              {isPro ? "PRO" : "FREE ROAST"}
            </div>
          </div>
        </div>

        {}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "24px",
          }}
        >
          {}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "18px",
            }}
          >
            {username && (
              <img
                src={`https://avatars.githubusercontent.com/${username}?s=120`}
                width="64"
                height="64"
                style={{
                  borderRadius: "50%",
                  border: "2px solid #E84E2A",
                }}
                alt={username}
              />
            )}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "44px",
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
                  fontSize: "16px",
                  color: "#555555",
                }}
              >
                GitHub Roast Report
              </div>
            </div>
          </div>

          {}
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
                  fontFamily: 'Georgia, serif',
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

        {}
        <div
          style={{
            display: "flex",
            flex: "1",
            padding: "22px 26px",
            background: "#110900",
            borderLeft: "4px solid #E84E2A",
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

      {}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 64px",
          borderTop: "1px solid #2E2D24",
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
          Your GitHub has a story. Get roasted too.
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

