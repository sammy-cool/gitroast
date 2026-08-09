// ============================================================
// GITROAST — Battle OG Image Route
// ============================================================
// WHAT: Generates a 1200×630 PNG preview for battle URLs.
//       When /battle/user1/vs/user2 is shared on Twitter/LinkedIn,
//       this shows both usernames in a VS-style battle card.
//
// WHY separate from /api/og:
//   Battle card needs a VS layout (two players side by side)
//   Roast card has single user + score layout
//   Different visual design = different route
//
// WHY Edge runtime:
//   ImageResponse uses Satori — requires Edge runtime
//   Cannot use standard Node.js runtime
//
// SATORI RULES (must follow — same as /api/og):
//   Every div with 2+ children MUST have display: 'flex'
//   No CSS variables — use raw hex values
//   No CSS shorthand
//   No animations
//
// WHERE: client/src/app/api/og-battle/route.js
// ============================================================

import { ImageResponse } from "next/og";

export const runtime = "edge";

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function getScoreColor(score) {
  if (!score) return "#FF6B00";
  if (score < 40) return "#FF3D3D";
  if (score < 70) return "#FFB700";
  return "#00E676";
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const user1 = searchParams.get("user1") || "player1";
  const user2 = searchParams.get("user2") || "player2";

  // WHY fetch both scores in parallel:
  //   Two independent requests — parallel is faster
  //   If either fails → show default (no score shown)
  let score1 = null;
  let score2 = null;
  let winner = null;

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const [res1, res2] = await Promise.all([
      fetch(`${apiBase}/api/history/${user1}?limit=1`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${apiBase}/api/history/${user2}?limit=1`, {
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

    // WHY lower score = winner:
    //   Lower score = more roastable = winner of shame
    if (score1 !== null && score2 !== null) {
      if (score1 < score2) winner = user1;
      else if (score2 < score1) winner = user2;
    }
  } catch {
    // WHY silent: fallback to names-only card — never 500
  }

  const color1 = getScoreColor(score1);
  const color2 = getScoreColor(score2);

  return new ImageResponse(
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
      {/* Top gradient bar */}
      <div
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          height: "3px",
          background: "linear-gradient(90deg, #FF4500, #FF6B00, #FFB700)",
          display: "flex",
        }}
      />

      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-100px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "800px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(255,69,0,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
          display: "flex",
        }}
      />

      {/* Border */}
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

      {/* Header */}
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
            fontFamily: 'Impact, "Arial Black", sans-serif',
            color: "#FF6B00",
            letterSpacing: "3px",
          }}
        >
          GITROAST ⚔️
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

      {/* Main battle row */}
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
        {/* Player 1 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flex: "1",
            gap: "12px",
          }}
        >
          {/* Avatar circle */}
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
              fontFamily: 'Impact, "Arial Black", sans-serif',
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
                  fontFamily: 'Impact, "Arial Black", sans-serif',
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
                background: "rgba(255,61,61,0.15)",
                border: "1px solid rgba(255,61,61,0.4)",
                borderRadius: "6px",
                color: "#FF3D3D",
                letterSpacing: "1px",
              }}
            >
              💀 MOST ROASTABLE
            </div>
          )}
        </div>

        {/* VS divider */}
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
              fontFamily: 'Impact, "Arial Black", sans-serif',
              color: "#FF6B00",
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
                color: "#FF3D3D",
              }}
            >
              {winner === user1 ? "←" : "→"}
            </div>
          )}
        </div>

        {/* Player 2 */}
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
              fontFamily: 'Impact, "Arial Black", sans-serif',
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
                  fontFamily: 'Impact, "Arial Black", sans-serif',
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
                background: "rgba(255,61,61,0.15)",
                border: "1px solid rgba(255,61,61,0.4)",
                borderRadius: "6px",
                color: "#FF3D3D",
                letterSpacing: "1px",
              }}
            >
              💀 MOST ROASTABLE
            </div>
          )}
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
          Start your own battle 🔥
        </div>
      </div>
    </div>,
    { width: OG_WIDTH, height: OG_HEIGHT },
  );
}
