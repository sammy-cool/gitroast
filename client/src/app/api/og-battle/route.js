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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const user1 = searchParams.get("user1") || "player1";
  const user2 = searchParams.get("user2") || "player2";

  let score1 = null;
  let score2 = null;
  let winner = null;

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const [res1, res2] = await Promise.all([
      fetch(`${apiBase}/api/history/${encodeURIComponent(user1)}?limit=1`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${apiBase}/api/history/${encodeURIComponent(user2)}?limit=1`, {
        next: { revalidate: 3600 },
      }),
    ]);

    if (res1.ok) {
      const json = await res1.json();
      score1 = json?.history?.[0]?.score || null;
    }
    if (res2.ok) {
      const json = await res2.json();
      score2 = json?.history?.[0]?.score || null;
    }

    if (score1 !== null && score2 !== null) {
      if (score1 < score2) winner = user1;
      else if (score2 < score1) winner = user2;
    }
  } catch {
  }

  const color1 = getScoreColor(score1);
  const color2 = getScoreColor(score2);

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        background: "#171711",
        display: "flex",
        flexDirection: "column",
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
          bottom: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(232, 78, 42,0.15) 0%, transparent 70%)",
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
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "40px 64px 24px 64px",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "30px",
            fontWeight: "900",
            fontFamily: 'Georgia, serif',
            color: "#E84E2A",
            letterSpacing: "3px",
          }}
        >
          GitRoast Battle
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "14px",
            color: "#3A3A3A",
            letterSpacing: "2px",
          }}
        >
          ROAST BATTLE
        </div>
      </div>

      {}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: "1",
          alignItems: "center",
          padding: "0 48px",
          gap: "0",
        }}
      >
        {}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: "1",
            gap: "12px",
          }}
        >
          {}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#161616",
              border: `3px solid ${color1}`,
              fontSize: "32px",
              fontWeight: "900",
              fontFamily: 'Georgia, serif',
              color: color1,
            }}
          >
            {user1[0].toUpperCase()}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "28px",
              color: "#F5F5F5",
              fontWeight: "700",
            }}
          >
            @{user1}
          </div>

          {score1 !== null ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "72px",
                  fontWeight: "900",
                  fontFamily: 'Georgia, serif',
                  color: color1,
                  lineHeight: "1",
                }}
              >
                {score1}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "13px",
                  color: "#555555",
                }}
              >
                /100 ROAST SCORE
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                fontSize: "16px",
                color: "#3A3A3A",
              }}
            >
              Not yet roasted
            </div>
          )}

          {winner === user1 && (
            <div
              style={{
                display: "flex",
                fontSize: "13px",
                padding: "4px 14px",
                background: "rgba(240, 112, 90,0.15)",
                border: "1px solid rgba(240, 112, 90,0.4)",
                borderRadius: "6px",
                color: "#F0705A",
                letterSpacing: "1px",
              }}
            >
              MOST ROASTABLE
            </div>
          )}
        </div>

        {}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 32px",
            gap: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "56px",
              fontWeight: "900",
              fontFamily: 'Georgia, serif',
              color: "#E84E2A",
              letterSpacing: "4px",
            }}
          >
            VS
          </div>
          {winner && (
            <div
              style={{
                display: "flex",
                fontSize: "24px",
                color: "#F0705A",
              }}
            >
              {winner === user1 ? "←" : "→"}
            </div>
          )}
        </div>

        {}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: "1",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#161616",
              border: `3px solid ${color2}`,
              fontSize: "32px",
              fontWeight: "900",
              fontFamily: 'Georgia, serif',
              color: color2,
            }}
          >
            {user2[0].toUpperCase()}
          </div>

          <div
            style={{
              display: "flex",
              fontSize: "28px",
              color: "#F5F5F5",
              fontWeight: "700",
            }}
          >
            @{user2}
          </div>

          {score2 !== null ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: "72px",
                  fontWeight: "900",
                  fontFamily: 'Georgia, serif',
                  color: color2,
                  lineHeight: "1",
                }}
              >
                {score2}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: "13px",
                  color: "#555555",
                }}
              >
                /100 ROAST SCORE
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                fontSize: "16px",
                color: "#3A3A3A",
              }}
            >
              Not yet roasted
            </div>
          )}

          {winner === user2 && (
            <div
              style={{
                display: "flex",
                fontSize: "13px",
                padding: "4px 14px",
                background: "rgba(240, 112, 90,0.15)",
                border: "1px solid rgba(240, 112, 90,0.4)",
                borderRadius: "6px",
                color: "#F0705A",
                letterSpacing: "1px",
              }}
            >
              MOST ROASTABLE
            </div>
          )}
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
          Start your own battle
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

