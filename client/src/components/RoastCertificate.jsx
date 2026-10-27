"use client";


import { useState, useRef } from "react";
import { toastPromise } from "@/utils/toast";

const GRADE_MESSAGES = {
    A: "Awarded for suspicious competence in a field that expects mediocrity.",
    B: "Awarded for maintaining a GitHub that is, at minimum, not embarrassing.",
    C: "Awarded for a body of work that exists and continues to exist despite all odds.",
    D: "Awarded for consistent effort in the general direction of programming.",
    F: "Awarded for an extraordinary commitment to starting things and an equal commitment to not finishing them.",
    "F-": "Awarded in recognition of a GitHub profile that has achieved a level of chaos previously thought impossible.",
};

const SCORE_LABELS = {
    A: "SUSPICIOUSLY COMPETENT",
    B: "DECENT, ACTUALLY",
    C: "TECHNICALLY A DEVELOPER",
    D: "NEEDS IMPROVEMENT",
    F: "CERTIFIED DISASTER",
    "F-": "UNPRECEDENTED DISASTER",
};

export default function RoastCertificate({
    username,
    score,
    grade,
    roastText,
    isPro,
}) {
    const [generating, setGenerating] = useState(false);
    const certRef = useRef(null);

    const gradeMsg = GRADE_MESSAGES[grade] || GRADE_MESSAGES["F"];
    const scoreLabel = SCORE_LABELS[grade] || SCORE_LABELS["F"];
    const today = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    async function handleCertificate() {
        if (generating) return;
        setGenerating(true);

        try {
            await toastPromise(
                (async () => {
                    const html2canvas = (await import("html2canvas")).default;
                    const el = certRef.current;
                    if (!el) throw new Error("Certificate element not found");


                    const canvas = await html2canvas(el, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: "#F5F0E8",
                        logging: false,
                        windowWidth: 800,
                        windowHeight: 600,
                    });


                    if (!isPro) {
                        const ctx = canvas.getContext("2d");
                        ctx.save();
                        ctx.globalAlpha = 0.12;
                        ctx.fillStyle = "#E84E2A";
                        ctx.font = 'bold 32px "Courier New", monospace';
                        ctx.textAlign = "center";
                        const angle = -Math.PI / 6;
                        for (let y = -100; y < canvas.height + 100; y += 160) {
                            for (let x = -100; x < canvas.width + 100; x += 240) {
                                ctx.save();
                                ctx.translate(x, y);
                                ctx.rotate(angle);
                                ctx.fillText("ROASTED BY GITROAST", 0, 0);
                                ctx.restore();
                            }
                        }
                        ctx.restore();
                    }

                    const link = document.createElement("a");
                    link.download = `gitroast-certificate-${username}.png`;
                    link.href = canvas.toDataURL("image/png", 1.0);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })(),
                {
                    loading: "Minting your certificate…",
                    success: isPro
                        ? "HD certificate downloaded"
                        : "Certificate downloaded",
                    error: "Certificate generation failed. Try again.",
                }
            );
        } catch (err) {
            console.error("[Certificate] Failed:", err);
            if (certRef.current) certRef.current.style.display = "none";
        } finally {
            setGenerating(false);
        }
    }

    return (
        <>
            {}
            <button
                type="button"
                className="cert-btn font-mono"
                onClick={handleCertificate}
                disabled={generating}
                title="Download Certificate of GitHub Shame"
            >
                {generating ? "Generating…" : "Get certificate"}
            </button>

            {}
            <div ref={certRef} style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
                <div className="cert-container">
                    {}
                    <div className="cert-border">
                        {}
                        <div className="cert-header">
                            <div className="cert-logo font-mono">GITROAST</div>
                            <div className="cert-authority font-mono">
                                OFFICIAL SHAME AUTHORITY
                            </div>
                        </div>

                        {}
                        <div className="cert-title-block">
                            <p className="cert-title font-display">
                                Certificate of GitHub Shame
                            </p>
                            <div className="cert-divider" />
                        </div>

                        {}
                        <div className="cert-body">
                            <p className="cert-presents font-mono">This certifies that</p>

                            <p className="cert-username font-display">@{username}</p>

                            <p className="cert-desc font-mono">
                                has been officially and publicly roasted by the GitRoast Shame
                                Authority and found to be:
                            </p>

                            <div className="cert-verdict">
                                <p className="cert-score font-display">
                                    {score}
                                    <span className="cert-score-denom">/100</span>
                                </p>
                                <p className="cert-score-label font-mono">{scoreLabel}</p>
                                <p className="cert-grade font-display">Grade: {grade}</p>
                            </div>

                            <p className="cert-roast-label font-mono">The Official Roast:</p>
                            <p className="cert-roast-text font-mono">
                                &ldquo;{roastText?.slice(0, 180)}
                                {roastText?.length > 180 ? "..." : ""}&rdquo;
                            </p>

                            <p className="cert-grade-msg font-mono">{gradeMsg}</p>
                        </div>

                        {}
                        <div className="cert-footer">
                            <div className="cert-sign-block">
                                <div className="cert-sign-line" />
                                <p className="cert-sign-name font-mono">GitRoast Authority</p>
                                <p className="cert-sign-title font-mono">Chief Roast Officer</p>
                            </div>
                            <div className="cert-center-block">
                                <div className="cert-seal font-display" aria-hidden="true">★</div>
                                <div className="cert-qr-wrap">
                                    {}
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&margin=2&color=2c1810&bgcolor=fdfaf3&data=${encodeURIComponent(
                                            typeof window !== "undefined"
                                                ? `${window.location.origin}/history/${username}`
                                                : `https://gitroast.dev/history/${username}`
                                        )}`}
                                        alt={`QR Code verification for @${username}`}
                                        className="cert-qr"
                                        crossOrigin="anonymous"
                                        loading="eager"
                                        onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" fill="%23fdfaf3"/><rect x="8" y="8" width="56" height="56" fill="none" stroke="%232c1810" stroke-width="2"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="10" font-weight="bold" fill="%232c1810">VERIFY</text></svg>';
                                        }}
                                    />
                                    <span className="cert-qr-label font-mono">SCAN TO VERIFY</span>
                                </div>
                            </div>
                            <div className="cert-sign-block">
                                <div className="cert-sign-line" />
                                <p className="cert-sign-name font-mono">Date of Issue</p>
                                <p className="cert-sign-title font-mono">{today}</p>
                            </div>
                        </div>

                        <p className="cert-watermark font-mono">
                            gitroast · Roasting developers since 2025
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        /* Button */
        .cert-btn {
          width: 100%;
          padding: 10px;
          border-radius: var(--radius-md);
          background: transparent;
          border: 1px dashed var(--border-hover);
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.18s ease;
          letter-spacing: 0.5px;
        }
        .cert-btn:hover:not(:disabled) {
          border-color: var(--fire);
          color: var(--fire);
          background: rgba(232, 78, 42, 0.04);
        }
        .cert-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Certificate styling — parchment look */
        .cert-container {
          width: 800px;
          background: #f5f0e8;
          padding: 32px;
          font-family: "Courier New", monospace;
        }
        .cert-border {
          border: 4px double #8b6914;
          padding: 32px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          background: #fdfaf3;
          position: relative;
        }

        /* Corner decorations */
        .cert-border::before,
        .cert-border::after {
          content: "✦";
          position: absolute;
          color: #8b6914;
          font-size: 20px;
        }
        .cert-border::before {
          top: 8px;
          left: 12px;
        }
        .cert-border::after {
          bottom: 8px;
          right: 12px;
        }

        /* Header */
        .cert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          border-bottom: 2px solid #8b6914;
          padding-bottom: 12px;
        }
        .cert-logo {
          font-size: 18px;
          color: var(--ember-hover);
          font-weight: 700;
        }
        .cert-authority {
          font-size: 10px;
          color: #8b6914;
          letter-spacing: 2px;
        }

        /* Title */
        .cert-title-block {
          text-align: center;
        }
        .cert-title {
          font-size: 36px;
          color: #2c1810;
          letter-spacing: 2px;
          line-height: 1.1;
          font-family: Impact, "Arial Black", sans-serif;
        }
        .cert-divider {
          height: 2px;
          background: linear-gradient(90deg, transparent, #8b6914, transparent);
          margin-top: 8px;
        }

        /* Body */
        .cert-body {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .cert-presents {
          font-size: 13px;
          color: #5c4033;
          letter-spacing: 1px;
        }
        .cert-username {
          font-size: 48px;
          color: var(--ember-hover);
          font-family: Impact, "Arial Black", sans-serif;
          letter-spacing: 2px;
          line-height: 1;
        }
        .cert-desc {
          font-size: 12px;
          color: #5c4033;
          max-width: 500px;
          line-height: 1.6;
        }

        /* Verdict box */
        .cert-verdict {
          background: rgba(139, 105, 20, 0.08);
          border: 1px solid #8b6914;
          border-radius: 4px;
          padding: 16px 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .cert-score {
          font-size: 56px;
          color: var(--ember-hover);
          line-height: 1;
          font-family: Impact, "Arial Black", sans-serif;
        }
        .cert-score-denom {
          font-size: 24px;
          color: #8b6914;
        }
        .cert-score-label {
          font-size: 11px;
          color: #8b6914;
          letter-spacing: 3px;
          text-transform: uppercase;
        }
        .cert-grade {
          font-size: 28px;
          color: #2c1810;
          font-family: Impact, "Arial Black", sans-serif;
        }

        /* Roast text */
        .cert-roast-label {
          font-size: 10px;
          color: #8b6914;
          letter-spacing: 2px;
          text-transform: uppercase;
        }
        .cert-roast-text {
          font-size: 12px;
          color: #2c1810;
          font-style: italic;
          max-width: 560px;
          line-height: 1.6;
          text-align: center;
        }
        .cert-grade-msg {
          font-size: 11px;
          color: #5c4033;
          max-width: 500px;
          line-height: 1.5;
          font-style: italic;
        }

        /* Footer */
        .cert-footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 100%;
          margin-top: 8px;
          border-top: 2px solid #8b6914;
          padding-top: 16px;
        }
        .cert-sign-block {
          text-align: center;
        }
        .cert-sign-line {
          width: 140px;
          height: 1px;
          background: #8b6914;
          margin-bottom: 4px;
        }
        .cert-sign-name {
          font-size: 11px;
          color: #2c1810;
          font-weight: 700;
        }
        .cert-sign-title {
          font-size: 10px;
          color: #8b6914;
        }
        .cert-seal {
          font-size: 48px;
          line-height: 1;
        }
        .cert-center-block {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cert-qr-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
        }
        .cert-qr {
          width: 58px;
          height: 58px;
          border: 1px solid #8b6914;
          border-radius: 2px;
          display: block;
        }
        .cert-qr-label {
          font-size: 7.5px;
          color: #8b6914;
          letter-spacing: 1.5px;
          font-weight: 700;
        }

        .cert-watermark {
          font-size: 9px;
          color: #8b6914;
          letter-spacing: 1px;
          opacity: 0.6;
        }
      `}</style>
        </>
    );
}

