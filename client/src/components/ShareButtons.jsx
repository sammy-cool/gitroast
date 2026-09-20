"use client";

import { createToast } from "customizable-toast-notification";
import { useState } from "react";
import { trackShare } from "@/services/roastService";
import RoastCertificate from "./RoastCertificate";
import GitHubWrapped from "./GitHubWrapped";

export default function ShareButtons({
    username,
    roastId,
    roastText,
    isPro,
    onProClick,
    score,
    grade,
}) {
    const [copied, setCopied] = useState(false);
    const [copiedText, setCopiedText] = useState(false);
    const [copiedBadge, setCopiedBadge] = useState(false);
    const [showBadgePreview, setShowBadgePreview] = useState(false);
    const [downloading, setDownloading] = useState(false);

    function handleShare() {
        const url = `${window.location.origin}/history/${username}`;
        navigator.clipboard
            .writeText(url)
            .then(() => {
                setCopied(true);
                trackShare(roastId);
                createToast({
                    type: "success",
                    message: "🔥 Roast link copied! Go share your shame.",
                    position: "top-center",
                    showProgressBar: true,
                    duration: 3000,
                });
                setTimeout(() => setCopied(false), 2500);
            })
            .catch(() => {
                createToast({
                    type: "error",
                    message: "Could not copy link. Try manually.",
                    position: "top-center",
                    duration: 5000,
                    showCloseButton: true,
                });
            });
    }

    function handleCopyText() {
        if (!roastText) return;
        const textToCopy = `"${roastText}" — Roasted by GitRoast`;
        navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
                setCopiedText(true);
                createToast({
                    type: "success",
                    message: "📋 Roast text copied! Paste it anywhere.",
                    position: "top-center",
                    showProgressBar: true,
                    duration: 3000,
                });
                setTimeout(() => setCopiedText(false), 2500);
            })
            .catch(() => {
                createToast({
                    type: "error",
                    message: "Could not copy text. Try manually.",
                    position: "top-center",
                    duration: 5000,
                    showCloseButton: true,
                });
            });
    }

    function handleTwitterShare() {
        const url = `${window.location.origin}/history/${username}`;
        const snippet = roastText
            ? `"${roastText.slice(0, 120)}${roastText.length > 120 ? "..." : ""}"`
            : `I just got my GitHub brutally roasted 🔥`;
        const tweet = `${snippet}\n\nCheck my roast at ${url} 🔥 #GitRoast #GitHub`;
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
            "_blank",
            "noopener,noreferrer",
        );
        trackShare(roastId);
        createToast({
            type: "success",
            message: "🐦 Twitter opened! Share your shame.",
            position: "top-center",
            duration: 3000,
        });
    }

    function handleCopyBadge() {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://gitroast.dev";
        const badgeMarkdown = `[![GitRoast Score](${origin}/api/badge/${username})](${origin}/history/${username})`;
        navigator.clipboard
            .writeText(badgeMarkdown)
            .then(() => {
                setCopiedBadge(true);
                trackShare(roastId);
                createToast({
                    type: "success",
                    message: "🛡️ README Badge Markdown copied! Paste in your GitHub profile README.",
                    position: "top-center",
                    showProgressBar: true,
                    duration: 4000,
                });
                setTimeout(() => setCopiedBadge(false), 2500);
            })
            .catch(() => {
                createToast({
                    type: "error",
                    message: "Could not copy badge code. Try manually.",
                    position: "top-center",
                    duration: 4000,
                });
            });
    }

    async function handleDownload() {
        setDownloading(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const element = document.getElementById("roast-card-capture");
            if (!element) throw new Error("Card element not found");

            const scale = isPro ? 2 : 1;
            const canvas = await html2canvas(element, {
                scale,
                useCORS: true,
                backgroundColor: "#0F0F0F",
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight,
            });

            if (!isPro) {
                const ctx = canvas.getContext("2d");
                ctx.save();
                ctx.globalAlpha = 0.18;
                ctx.fillStyle = "#FF6B00";
                ctx.font = 'bold 38px "Courier New", monospace';
                ctx.textAlign = "center";
                const angle = -Math.PI / 6;
                const stepX = 260;
                const stepY = 180;
                const text = "ROASTED BY GITROAST";
                for (let y = -100; y < canvas.height + 100; y += stepY) {
                    for (let x = -100; x < canvas.width + 100; x += stepX) {
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(angle);
                        ctx.fillText(text, 0, 0);
                        ctx.restore();
                    }
                }
                ctx.restore();
            }

            const link = document.createElement("a");
            link.download = `gitroast-${username}.png`;
            link.href = canvas.toDataURL("image/png", 1.0);
            link.click();

            createToast({
                type: "success",
                message: isPro
                    ? "⚡ HD roast card downloaded! No watermark, full quality."
                    : "🔥 Card downloaded! Go Pro to remove the watermark.",
                position: "top-center",
                showProgressBar: true,
                duration: 4000,
            });
            trackShare(roastId);
        } catch (err) {
            console.error("[Download] Failed:", err);
            createToast({
                type: "error",
                message: "Download failed. Try again.",
                position: "top-center",
                duration: 4000,
                showCloseButton: true,
            });
        } finally {
            setDownloading(false);
        }
    }

    function handlePro() {
        createToast({
            type: "info",
            message: "⚡ Unlock AI roasts, private repos + HD watermark-free card.",
            position: "top-center",
            duration: 6000,
            showCloseButton: true,
            showProgressBar: true,
            cta: {
                label: "See Plans ⚡",
                onClick: onProClick,
                autoClose: true,
            },
        });
    }

    return (
        <div className="share-section">
            {/* Watermark row */}
            <div className="watermark-row">
                <span className="font-mono watermark-url">gitroast</span>
                <span
                    className={`font-mono watermark-badge ${isPro ? "watermark-badge--pro" : ""}`}
                >
                    {isPro ? "PRO ⚡ · HD · NO WATERMARK" : "FREE · WATERMARKED"}
                </span>
            </div>

            {/* Primary row */}
            <div className="share-buttons">
                <button className="btn btn-primary share-btn" onClick={handleShare}>
                    {copied ? "✓ Copied!" : "🔥 Share Roast"}
                </button>
                <button
                    className="btn btn-twitter share-btn"
                    onClick={handleTwitterShare}
                    title="Share on Twitter / X"
                >
                    𝕏 Tweet This
                </button>
            </div>

            {/* Download */}
            <div className="secondary-buttons">
                <button
                    className={`btn download-btn ${isPro ? "download-btn--pro" : "download-btn--free"}`}
                    onClick={handleDownload}
                    disabled={downloading}
                    title={
                        isPro
                            ? "Download HD card — no watermark"
                            : "Download card — watermarked"
                    }
                >
                    {downloading
                        ? "⏳ Generating..."
                        : isPro
                            ? "⬇️ Download HD Card — No Watermark"
                            : "⬇️ Download Card (Watermarked)"}
                </button>
            </div>

            {/* Certificate & Wrapped — WHY here: natural grouping with other downloads */}
            <div className="extras-row">
                <RoastCertificate
                    username={username}
                    score={score}
                    grade={grade}
                    roastText={roastText}
                    isPro={isPro}
                />
                <GitHubWrapped
                    username={username}
                    isPro={isPro}
                />
            </div>

            {/* Badge & Embed row */}
            <div className="badge-row">
                <button
                    type="button"
                    className="btn btn-badge"
                    onClick={handleCopyBadge}
                    title="Copy Markdown code to embed your live roast badge in your GitHub README"
                >
                    {copiedBadge ? "✓ Badge Markdown Copied!" : "🛡️ Copy GitHub README Badge"}
                </button>
                <button
                    type="button"
                    className="btn btn-badge-toggle"
                    onClick={() => setShowBadgePreview(!showBadgePreview)}
                    title="Toggle live badge preview"
                >
                    {showBadgePreview ? "▲ Hide" : "▼ Preview"}
                </button>
            </div>

            {showBadgePreview && (
                <div className="badge-preview-box">
                    <p className="font-mono badge-preview-title">LIVE README BADGE PREVIEW:</p>
                    <div className="badge-img-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/api/badge/${username}`}
                            alt={`@${username} GitRoast Badge`}
                            className="badge-preview-img"
                            loading="eager"
                        />
                    </div>
                    <code className="font-mono badge-code-snippet">
                        {`[![GitRoast Score](${typeof window !== "undefined" ? window.location.origin : "https://gitroast.dev"}/api/badge/${username})](${typeof window !== "undefined" ? window.location.origin : "https://gitroast.dev"}/history/${username})`}
                    </code>
                </div>
            )}

            {/* Tertiary row */}
            <div className="tertiary-buttons">
                <button
                    className="btn btn-ghost copy-text-btn"
                    onClick={handleCopyText}
                >
                    {copiedText ? "✓ Copied!" : "📋 Copy Roast Text"}
                </button>
                {!isPro && (
                    <button className="btn btn-outline pro-btn" onClick={handlePro}>
                        ⚡ Go Pro — ₹99
                    </button>
                )}
            </div>

            {!isPro && (
                <p className="pro-hint font-mono">
                    ⚡ Pro = HD card · No watermark · AI roast · Nuclear mode · Private
                    repos
                </p>
            )}

            <style jsx>{`
        .share-section {
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .watermark-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .watermark-url {
          color: var(--text-ghost);
          font-size: 11px;
        }
        .watermark-badge {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          background: #111;
          border: 1px dashed #222;
          color: #3a3a3a;
          letter-spacing: 1px;
        }
        .watermark-badge--pro {
          border-color: rgba(255, 69, 0, 0.4);
          color: var(--fire);
          background: rgba(255, 69, 0, 0.08);
          border-style: solid;
        }
        .share-buttons {
          display: flex;
          gap: 8px;
        }
        .share-btn {
          flex: 1;
          padding: 12px;
          border-radius: var(--radius-md);
          font-size: 14px;
        }
        .btn-twitter {
          background: #000;
          color: #fff;
          border: 1px solid #333;
          transition: var(--ease);
        }
        .btn-twitter:hover {
          background: #111;
          border-color: #555;
        }
        .secondary-buttons {
          display: flex;
        }
        .download-btn {
          width: 100%;
          padding: 13px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 700;
          transition: var(--ease);
          letter-spacing: 0.2px;
        }
        .download-btn--free {
          background: var(--bg-elevated);
          color: var(--text-secondary);
          border: 1px solid var(--border-hover);
        }
        .download-btn--free:hover:not(:disabled) {
          border-color: rgba(255, 69, 0, 0.4);
          color: var(--text-primary);
        }
        .download-btn--pro {
          background: var(--fire-grad);
          color: #fff;
          border: none;
          box-shadow: 0 4px 20px rgba(255, 69, 0, 0.25);
        }
        .download-btn--pro:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 28px rgba(255, 69, 0, 0.4);
        }
        .download-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .tertiary-buttons {
          display: flex;
          gap: 8px;
        }
        .copy-text-btn {
          flex: 1;
          padding: 9px 12px;
          font-size: 13px;
        }
        .pro-btn {
          flex: 1;
          padding: 9px 12px;
          font-size: 13px;
        }
        .pro-hint {
          color: var(--text-muted);
          font-size: 11px;
          text-align: center;
          line-height: 1.6;
        }
        .badge-row {
          display: flex;
          gap: 8px;
        }
        .btn-badge {
          flex: 1;
          padding: 10px 14px;
          background: rgba(255, 69, 0, 0.08);
          border: 1px dashed rgba(255, 69, 0, 0.4);
          color: var(--fire);
          font-size: 13px;
          font-weight: 600;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--ease);
          text-align: center;
        }
        .btn-badge:hover {
          background: rgba(255, 69, 0, 0.16);
          border-color: var(--fire);
          transform: translateY(-1px);
        }
        .btn-badge-toggle {
          padding: 10px 14px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 12px;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--ease);
        }
        .btn-badge-toggle:hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
        }
        .badge-preview-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
          background: #0D0D0D;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }
        .badge-preview-title {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 1px;
        }
        .badge-img-wrap {
          display: flex;
          justify-content: center;
          padding: 6px 0;
        }
        .badge-preview-img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
        }
        .badge-code-snippet {
          font-size: 10px;
          color: var(--text-muted);
          background: #050505;
          padding: 6px 10px;
          border-radius: 4px;
          border: 1px solid #1A1A1A;
          overflow-x: auto;
          white-space: nowrap;
        }

        .extras-row {
          display: flex;
          gap: 8px;
        }
        @media (max-width: 480px) {
          .badge-row {
            flex-direction: column;
          }
          .extras-row {
            flex-direction: column;
          }
        }
        @media (max-width: 380px) {
          .share-buttons,
          .tertiary-buttons {
            flex-direction: column;
          }
        }
      `}</style>
        </div>
    );
}
