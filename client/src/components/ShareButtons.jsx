"use client";

import { useState } from "react";
import Link from "next/link";
import { toast, toastPromise } from "@/utils/toast";
import { trackShare } from "@/services/roastService";
import dynamic from 'next/dynamic';
const RoastCertificate = dynamic(() => import('./RoastCertificate'), { ssr: false });
const GitHubWrapped = dynamic(() => import('./GitHubWrapped'), { ssr: false });

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
    const [badgeStyle, setBadgeStyle] = useState("card");
    const [downloading, setDownloading] = useState(false);

    function handleShare() {
        const url = `${window.location.origin}/history/${username}`;
        navigator.clipboard
            .writeText(url)
            .then(() => {
                setCopied(true);
                trackShare(roastId);
                toast.copy("🔥 Roast link copied! Go share your shame.");
                setTimeout(() => setCopied(false), 2500);
            })
            .catch(() => {
                toast.error("Could not copy link. Try manually.");
            });
    }

    function handleCopyText() {
        if (!roastText) return;
        const textToCopy = `"${roastText}" — Roasted by GitRoast`;
        navigator.clipboard
            .writeText(textToCopy)
            .then(() => {
                setCopiedText(true);
                toast.copy("📋 Roast text copied! Paste it anywhere.");
                setTimeout(() => setCopiedText(false), 2500);
            })
            .catch(() => {
                toast.error("Could not copy text. Try manually.");
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
        toast.success("🐦 Twitter opened! Share your shame.");
    }

    function handleCopyBadge(styleToCopy = badgeStyle) {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://gitroast.dev";
        const query = styleToCopy === "shield" ? "?style=shield" : "";
        const badgeMarkdown = `[![GitRoast Score](${origin}/api/badge/${username}${query})](${origin}/history/${username})`;
        navigator.clipboard
            .writeText(badgeMarkdown)
            .then(() => {
                setCopiedBadge(true);
                trackShare(roastId);
                toast.copy("🛡️ Badge Markdown copied! Paste into your GitHub profile README.md.");
                setTimeout(() => setCopiedBadge(false), 2500);
            })
            .catch(() => {
                toast.error("Could not copy badge code. Try manually.");
            });
    }

    async function handleDownload() {
        if (downloading) return;
        setDownloading(true);
        try {
            await toastPromise(
                (async () => {
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

                    // ── Cross-Browser Programmatic File Download ────────────────
                    // ── WHAT: ────────────────────────────────────────────────────
                    // Creates, mounts, triggers, and cleans up an invisible <a> element to initiate download.
                    //
                    // ── WHY: ─────────────────────────────────────────────────────
                    // Modern browsers (Firefox, Safari on iOS/macOS) require anchor elements to be attached
                    // to the active document body to permit programmatic .click() download events.
                    //
                    // ── WHERE & WHEN TO USE: ─────────────────────────────────────
                    // In all client-side canvas-to-file export functions.
                    //
                    // ── USE CASES: ───────────────────────────────────────────────
                    // Exporting PNG cards, certificates, and reports.
                    //
                    // ── WHEN NOT TO USE: ─────────────────────────────────────────
                    // Do not use for server-streamed downloads (Content-Disposition handles those natively).
                    const link = document.createElement("a");
                    link.download = `gitroast-${username}.png`;
                    link.href = canvas.toDataURL("image/png", 1.0);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })(),
                {
                    loading: "🎨 Rendering roast card...",
                    success: isPro
                        ? "⚡ HD roast card downloaded! No watermark, full quality."
                        : "🔥 Card downloaded! Go Pro to remove the watermark.",
                    error: "Download failed. Please try again.",
                }
            );
            trackShare(roastId);
        } catch (err) {
            console.error("[Download] Failed:", err);
        } finally {
            setDownloading(false);
        }
    }

    function handlePro() {
        toast.proNudge(
            "⚡ Unlock AI roasts, private repos + HD watermark-free card.",
            onProClick,
            "See Plans ⚡"
        );
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
                <button
                    type="button"
                    className="btn btn-primary share-btn"
                    onClick={handleShare}
                >
                    {copied ? "✓ Copied!" : "🔥 Share Roast"}
                </button>
                <button
                    type="button"
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
                    type="button"
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

            {/* ── 3D Code Solar System Cosmic Visualizer ── */}
            {/* WHAT: Interactive WebGL launch button transporting user to real-time 3D planetary galaxy */}
            {/* WHY: High visual delight and viral curiosity: turns code metrics into orbiting celestial worlds */}
            {/* WHERE & WHEN TO USE: Rendered in share actions for every completed roast */}
            {/* USE CASES: Viewing candidate or self repos as orbiting planets and stars */}
            {/* WHEN NOT TO USE: Never render before roast analysis completes */}
            <Link href={`/universe/${username}`} className="universe-link-wrapper">
                <div className="btn-universe font-mono">
                    <span className="universe-star-icon" aria-hidden="true">✦</span>
                    <span className="universe-text">Launch 3D Code Solar System</span>
                    <span className="universe-pill">3D WEBGL</span>
                </div>
            </Link>

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
                    <div className="badge-preview-header">
                        <span className="font-mono badge-preview-title">README BADGE PREVIEW</span>
                        <div className="badge-style-tabs font-mono">
                            <button
                                type="button"
                                className={`badge-tab-btn ${badgeStyle === "card" ? "active" : ""}`}
                                onClick={() => setBadgeStyle("card")}
                            >
                                🔥 Card
                            </button>
                            <button
                                type="button"
                                className={`badge-tab-btn ${badgeStyle === "shield" ? "active" : ""}`}
                                onClick={() => setBadgeStyle("shield")}
                            >
                                🛡️ Shield
                            </button>
                        </div>
                    </div>
                    <div className="badge-img-wrap">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={badgeStyle === "shield" ? `/api/badge/${username}?style=shield` : `/api/badge/${username}`}
                            alt={`@${username} GitRoast Badge`}
                            className="badge-preview-img"
                            loading="eager"
                        />
                    </div>
                    <code className="font-mono badge-code-snippet">
                        {`[![GitRoast Score](${typeof window !== "undefined" ? window.location.origin : "https://gitroast.dev"}/api/badge/${username}${badgeStyle === "shield" ? "?style=shield" : ""})](${typeof window !== "undefined" ? window.location.origin : "https://gitroast.dev"}/history/${username})`}
                    </code>
                    <p className="badge-guide-text font-mono">
                        💡 <strong>How to use:</strong> Open your GitHub profile README (or any repo README.md) and paste this Markdown snippet. It updates automatically!
                    </p>
                </div>
            )}

            {/* Tertiary row */}
            <div className="tertiary-buttons">
                <button
                    type="button"
                    className="btn btn-ghost copy-text-btn"
                    onClick={handleCopyText}
                >
                    {copiedText ? "✓ Copied!" : "📋 Copy Roast Text"}
                </button>
                {!isPro && (
                    <button type="button" className="btn btn-outline pro-btn" onClick={handlePro}>
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
        .badge-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        .badge-style-tabs {
          display: flex;
          gap: 4px;
        }
        .badge-tab-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .badge-tab-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
        }
        .badge-tab-btn.active {
          background: rgba(255, 69, 0, 0.15);
          border-color: var(--fire);
          color: var(--fire);
          font-weight: 600;
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
        .badge-guide-text {
          font-size: 10px;
          color: #a0a0a0;
          line-height: 1.4;
          background: rgba(255, 255, 255, 0.02);
          padding: 6px 8px;
          border-radius: 4px;
          border-left: 2px solid var(--fire);
        }

        .extras-row {
          display: flex;
          gap: 8px;
        }

        :global(.universe-link-wrapper) {
          text-decoration: none;
          display: block;
          width: 100%;
        }
        .btn-universe {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px 16px;
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(124, 77, 255, 0.1) 100%);
          border: 1px solid rgba(0, 229, 255, 0.35);
          border-radius: var(--radius-md);
          color: #00E5FF;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(0, 229, 255, 0.08);
        }
        .btn-universe:hover {
          background: linear-gradient(135deg, rgba(0, 229, 255, 0.2) 0%, rgba(124, 77, 255, 0.2) 100%);
          border-color: #00E5FF;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(0, 229, 255, 0.25);
          color: #FFFFFF;
        }
        .universe-star-icon {
          color: #00E5FF;
          animation: pulseUniverse 1.8s infinite ease-in-out;
        }
        @keyframes pulseUniverse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); text-shadow: 0 0 8px #00E5FF; }
        }
        .universe-pill {
          font-size: 9px;
          letter-spacing: 1px;
          background: rgba(0, 229, 255, 0.2);
          border: 1px solid rgba(0, 229, 255, 0.3);
          color: #00E5FF;
          padding: 2px 6px;
          border-radius: 4px;
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
