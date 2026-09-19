"use client";

// ============================================================
// GITROAST — GitHubWrapped Component
// ============================================================
// WHAT: Spotify Wrapped-style "Your 2025 GitHub Roast Report".
//       Shows annual stats, archetype, worst month, streaks,
//       most abandoned repo, and generates a downloadable card.
//
// WHY this feature:
//   Spotify Wrapped is the single most viral end-of-year mechanic.
//   Developers love seeing their quirks summarized with humor.
//   Shareable card on Twitter, LinkedIn, Discord drives viral loop.
// ============================================================

import { useState, useRef } from "react";
import { createToast } from "customizable-toast-notification";
import { getWrapped } from "@/services/roastService";
import { useAuth } from "@/context/AuthContext";

export default function GitHubWrapped({ username, isPro }) {
    const { getToken } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [wrappedData, setWrappedData] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const cardRef = useRef(null);

    async function handleOpen() {
        setIsOpen(true);
        if (wrappedData) return;

        setLoading(true);
        try {
            const token = getToken ? getToken() : null;
            const data = await getWrapped(username, 2025, token);
            setWrappedData(data);
        } catch (err) {
            console.error("[Wrapped] Load error:", err);
            createToast({
                type: "error",
                message: err.message || "Failed to load 2025 Wrapped report.",
                position: "top-center",
                duration: 4000,
            });
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload() {
        if (!wrappedData) return;
        setDownloading(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const el = cardRef.current;
            if (!el) throw new Error("Card capture element not found");

            el.style.display = "block";

            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#0A0A0A",
                logging: false,
                windowWidth: 700,
                windowHeight: 900,
            });

            el.style.display = "none";

            // Watermark for free tier
            if (!isPro) {
                const ctx = canvas.getContext("2d");
                ctx.save();
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = "#FF6B00";
                ctx.font = 'bold 32px "Courier New", monospace';
                ctx.textAlign = "center";
                const angle = -Math.PI / 6;
                for (let y = -100; y < canvas.height + 100; y += 180) {
                    for (let x = -100; x < canvas.width + 100; x += 260) {
                        ctx.save();
                        ctx.translate(x, y);
                        ctx.rotate(angle);
                        ctx.fillText("GITROAST WRAPPED 2025", 0, 0);
                        ctx.restore();
                    }
                }
                ctx.restore();
            }

            const link = document.createElement("a");
            link.download = `gitroast-wrapped-2025-${username}.png`;
            link.href = canvas.toDataURL("image/png", 1.0);
            link.click();

            createToast({
                type: "success",
                message: isPro
                    ? "⚡ 2025 Wrapped Card downloaded (HD No Watermark)!"
                    : "🔥 2025 Wrapped Card downloaded! Go Pro for watermark-free.",
                position: "top-center",
                duration: 4000,
            });
        } catch (err) {
            console.error("[Wrapped] Download failed:", err);
            createToast({
                type: "error",
                message: "Download failed. Please try again.",
                position: "top-center",
                duration: 4000,
            });
            if (cardRef.current) cardRef.current.style.display = "none";
        } finally {
            setDownloading(false);
        }
    }

    function handleShareTweet() {
        if (!wrappedData) return;
        const text = `My 2025 GitHub Wrapped Archetype: "${wrappedData.archetypeEmoji} ${wrappedData.archetype}".\n\nTotal Commits: ${wrappedData.totalCommits}\nWorst Month: ${wrappedData.worstMonth.month} (${wrappedData.worstMonth.commits} commits)\nAnnual Grade: ${wrappedData.annualGrade}\n\nRoasted by @GitRoast 🔥\n${window.location.origin}/history/${username}`;
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
            "_blank",
            "noopener,noreferrer",
        );
    }

    const maxMonthly = wrappedData
        ? Math.max(1, ...wrappedData.monthlyCommits.map((m) => m.count))
        : 1;

    return (
        <>
            {/* Trigger Button */}
            <button
                type="button"
                className="wrapped-trigger-btn font-mono"
                onClick={handleOpen}
                title="View 2025 GitHub Wrapped Roast Report"
            >
                🎁 2025 Wrapped
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="wrapped-backdrop"
                    onClick={() => setIsOpen(false)}
                    role="dialog"
                    aria-modal="true"
                >
                    <div
                        className="wrapped-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="close-btn"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close Wrapped Modal"
                        >
                            ✕
                        </button>

                        {loading ? (
                            <div className="wrapped-loading">
                                <div className="spinner font-display">🔥</div>
                                <p className="font-mono loading-text">
                                    Calculating your 2025 developer sins...
                                </p>
                            </div>
                        ) : wrappedData ? (
                            <div className="wrapped-content">
                                {/* Header */}
                                <div className="wrapped-header">
                                    <span className="wrapped-badge font-mono">
                                        GITROAST 2025 WRAPPED
                                    </span>
                                    <h2 className="wrapped-title font-display">
                                        @{wrappedData.username}&rsquo;S YEAR IN REVIEW
                                    </h2>
                                    <p className="wrapped-subtitle font-mono">
                                        Every commit, excuse, and abandoned dream laid bare.
                                    </p>
                                </div>

                                {/* Archetype Highlight */}
                                <div className="archetype-card">
                                    <div className="archetype-emoji font-display">
                                        {wrappedData.archetypeEmoji}
                                    </div>
                                    <div className="archetype-details">
                                        <span className="archetype-tag font-mono">
                                            YOUR 2025 ARCHETYPE
                                        </span>
                                        <h3 className="archetype-name font-display">
                                            {wrappedData.archetype}
                                        </h3>
                                        <p className="archetype-desc">
                                            {wrappedData.archetypeDesc}
                                        </p>
                                    </div>
                                </div>

                                {/* 4-Stat Grid */}
                                <div className="wrapped-grid">
                                    <div className="stat-card">
                                        <span className="stat-label font-mono">Total Commits</span>
                                        <span className="stat-num font-display">
                                            {wrappedData.totalCommits}
                                        </span>
                                        <span className="stat-sub font-mono">in 2025</span>
                                    </div>

                                    <div className="stat-card">
                                        <span className="stat-label font-mono">Worst Month</span>
                                        <span className="stat-num font-display text-danger">
                                            {wrappedData.worstMonth.month}
                                        </span>
                                        <span className="stat-sub font-mono">
                                            {wrappedData.worstMonth.comment}
                                        </span>
                                    </div>

                                    <div className="stat-card">
                                        <span className="stat-label font-mono">Best Streak</span>
                                        <span className="stat-num font-display text-fire">
                                            {wrappedData.bestStreak}d
                                        </span>
                                        <span className="stat-sub font-mono">
                                            Died on {wrappedData.streakDiedOn}
                                        </span>
                                    </div>

                                    <div className="stat-card">
                                        <span className="stat-label font-mono">Most Abandoned</span>
                                        <span className="stat-num font-mono text-repo">
                                            {wrappedData.mostAbandonedRepo.name}
                                        </span>
                                        <span className="stat-sub font-mono">
                                            {wrappedData.mostAbandonedRepo.note}
                                        </span>
                                    </div>
                                </div>

                                {/* Monthly Activity Chart */}
                                <div className="chart-section">
                                    <div className="chart-title font-mono">
                                        <span>MONTHLY COMMIT SPREAD</span>
                                        <span className="chart-year font-mono">2025</span>
                                    </div>
                                    <div className="chart-bars">
                                        {wrappedData.monthlyCommits.map((m) => {
                                            const heightPct = Math.max(
                                                8,
                                                Math.round((m.count / maxMonthly) * 100),
                                            );
                                            const isWorst = m.month === wrappedData.worstMonth.month;
                                            return (
                                                <div key={m.month} className="bar-col">
                                                    <div
                                                        className={`bar ${isWorst ? "bar-worst" : ""}`}
                                                        style={{ height: `${heightPct}%` }}
                                                        title={`${m.month}: ${m.count} commits`}
                                                    />
                                                    <span className="bar-label font-mono">
                                                        {m.month.slice(0, 1)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Annual Grade & Roast */}
                                <div className="verdict-banner">
                                    <div className="verdict-grade-block">
                                        <span className="grade-label font-mono">ANNUAL GRADE</span>
                                        <span className="grade-value font-display">
                                            {wrappedData.annualGrade}
                                        </span>
                                        <span className="score-value font-mono">
                                            {wrappedData.annualScore}/100
                                        </span>
                                    </div>
                                    <p className="verdict-roast font-mono">
                                        &ldquo;{wrappedData.annualRoast}&rdquo;
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="wrapped-actions">
                                    <button
                                        type="button"
                                        className="btn btn-primary action-btn font-mono"
                                        onClick={handleDownload}
                                        disabled={downloading}
                                    >
                                        {downloading ? "⏳ Capturing..." : "⬇️ Download Card"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-twitter action-btn font-mono"
                                        onClick={handleShareTweet}
                                    >
                                        𝕏 Share on X
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Hidden Printable Card for html2canvas */}
            <div
                ref={cardRef}
                style={{ display: "none" }}
                aria-hidden="true"
                className="hidden-card-capture"
            >
                {wrappedData && (
                    <div className="capture-container">
                        <div className="capture-header">
                            <span className="capture-logo font-mono">GITROAST 🔥</span>
                            <span className="capture-badge font-mono">2025 WRAPPED</span>
                        </div>

                        <div className="capture-user">
                            <h1 className="capture-username font-display">
                                @{wrappedData.username}
                            </h1>
                            <p className="capture-sub font-mono">
                                2025 GitHub Year In Review
                            </p>
                        </div>

                        <div className="capture-archetype">
                            <span className="capture-emoji">
                                {wrappedData.archetypeEmoji}
                            </span>
                            <div>
                                <span className="capture-arch-label font-mono">
                                    ARCHETYPE
                                </span>
                                <h3 className="capture-arch-title font-display">
                                    {wrappedData.archetype}
                                </h3>
                                <p className="capture-arch-desc font-mono">
                                    {wrappedData.archetypeDesc}
                                </p>
                            </div>
                        </div>

                        <div className="capture-stats-grid">
                            <div className="capture-stat-box">
                                <span className="cs-label font-mono">Total Commits</span>
                                <span className="cs-val font-display">
                                    {wrappedData.totalCommits}
                                </span>
                            </div>
                            <div className="capture-stat-box">
                                <span className="cs-label font-mono">Worst Month</span>
                                <span className="cs-val font-display cs-danger">
                                    {wrappedData.worstMonth.month}
                                </span>
                            </div>
                            <div className="capture-stat-box">
                                <span className="cs-label font-mono">Best Streak</span>
                                <span className="cs-val font-display cs-fire">
                                    {wrappedData.bestStreak}d
                                </span>
                            </div>
                            <div className="capture-stat-box">
                                <span className="cs-label font-mono">Grade</span>
                                <span className="cs-val font-display">
                                    {wrappedData.annualGrade}
                                </span>
                            </div>
                        </div>

                        <div className="capture-quote-box">
                            <p className="capture-quote font-mono">
                                &ldquo;{wrappedData.annualRoast}&rdquo;
                            </p>
                        </div>

                        <div className="capture-footer font-mono">
                            <span>gitroast · github roast report 2025</span>
                            <span>Grade: {wrappedData.annualGrade} ({wrappedData.annualScore}/100)</span>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
        .wrapped-trigger-btn {
          flex: 1;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: rgba(255, 107, 0, 0.08);
          border: 1px solid rgba(255, 107, 0, 0.35);
          color: #ffb700;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.5px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .wrapped-trigger-btn:hover {
          background: rgba(255, 107, 0, 0.16);
          border-color: #ff6b00;
          color: #ff4500;
          transform: translateY(-1px);
        }

        /* Modal Backdrop */
        .wrapped-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }

        .wrapped-modal {
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          overflow-y: auto;
          background: #0d0d0d;
          border: 1px solid rgba(255, 107, 0, 0.3);
          border-radius: var(--radius-lg, 12px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 32px rgba(255, 69, 0, 0.15);
          position: relative;
          padding: 28px;
        }

        .close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          line-height: 1;
          transition: color 0.15s;
        }
        .close-btn:hover {
          color: var(--text-primary);
        }

        .wrapped-loading {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .spinner {
          font-size: 42px;
          animation: spinPulse 1.4s ease-in-out infinite;
        }
        .loading-text {
          font-size: 13px;
          color: var(--text-secondary);
          letter-spacing: 0.5px;
        }

        .wrapped-header {
          text-align: center;
          margin-bottom: 20px;
        }
        .wrapped-badge {
          display: inline-block;
          font-size: 10px;
          letter-spacing: 2px;
          padding: 3px 10px;
          border-radius: 20px;
          background: rgba(255, 69, 0, 0.12);
          border: 1px solid rgba(255, 69, 0, 0.4);
          color: #ff6b00;
          margin-bottom: 8px;
        }
        .wrapped-title {
          font-size: 32px;
          line-height: 1.1;
          letter-spacing: 1px;
          background: linear-gradient(135deg, #fff 0%, #ffb700 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .wrapped-subtitle {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* Archetype */
        .archetype-card {
          background: #141414;
          border: 1px solid rgba(255, 107, 0, 0.25);
          border-radius: var(--radius-md);
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 18px;
        }
        .archetype-emoji {
          font-size: 40px;
          flex-shrink: 0;
        }
        .archetype-details {
          flex: 1;
        }
        .archetype-tag {
          font-size: 9px;
          letter-spacing: 2px;
          color: #ff6b00;
          display: block;
          margin-bottom: 2px;
        }
        .archetype-name {
          font-size: 22px;
          line-height: 1.1;
          color: #fff;
          margin-bottom: 4px;
        }
        .archetype-desc {
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.45;
        }

        /* Grid */
        .wrapped-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .stat-card {
          background: #111;
          border: 1px solid #222;
          border-radius: var(--radius-md);
          padding: 12px 14px;
          display: flex;
          flex-direction: column;
        }
        .stat-label {
          font-size: 10px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }
        .stat-num {
          font-size: 24px;
          line-height: 1.1;
          color: #fff;
        }
        .stat-sub {
          font-size: 10px;
          color: var(--text-ghost);
          margin-top: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .text-danger {
          color: #ff4500;
        }
        .text-fire {
          color: #ffb700;
        }
        .text-repo {
          font-size: 14px;
          font-weight: 700;
          color: #00e676;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Monthly Chart */
        .chart-section {
          background: #111;
          border: 1px solid #222;
          border-radius: var(--radius-md);
          padding: 12px 14px;
          margin-bottom: 18px;
        }
        .chart-title {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 1px;
          margin-bottom: 10px;
        }
        .chart-year {
          color: #ff6b00;
        }
        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 60px;
          padding-top: 4px;
        }
        .bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          justify-content: flex-end;
          gap: 4px;
        }
        .bar {
          width: 100%;
          background: #2a2a2a;
          border-radius: 2px;
          transition: height 0.3s ease;
        }
        .bar:hover {
          background: #ff6b00;
        }
        .bar-worst {
          background: rgba(255, 69, 0, 0.5);
        }
        .bar-label {
          font-size: 9px;
          color: var(--text-ghost);
        }

        /* Verdict */
        .verdict-banner {
          background: rgba(255, 69, 0, 0.05);
          border: 1px dashed rgba(255, 69, 0, 0.3);
          border-radius: var(--radius-md);
          padding: 14px 16px;
          margin-bottom: 20px;
          display: flex;
          gap: 14px;
          align-items: center;
        }
        .verdict-grade-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          border-right: 1px solid rgba(255, 69, 0, 0.2);
          padding-right: 14px;
        }
        .grade-label {
          font-size: 8px;
          letter-spacing: 1px;
          color: #ff6b00;
        }
        .grade-value {
          font-size: 32px;
          color: #fff;
          line-height: 1;
        }
        .score-value {
          font-size: 10px;
          color: var(--text-muted);
        }
        .verdict-roast {
          font-size: 11.5px;
          color: var(--text-secondary);
          line-height: 1.5;
          font-style: italic;
        }

        /* Actions */
        .wrapped-actions {
          display: flex;
          gap: 10px;
        }
        .action-btn {
          flex: 1;
          padding: 12px;
          font-size: 13px;
          border-radius: var(--radius-md);
          text-align: center;
        }
        .btn-twitter {
          background: #000;
          color: #fff;
          border: 1px solid #333;
        }
        .btn-twitter:hover {
          background: #111;
          border-color: #555;
        }

        /* Capture Styles (Hidden div) */
        .hidden-card-capture {
          position: absolute;
          left: -9999px;
          top: -9999px;
        }
        .capture-container {
          width: 650px;
          background: #0a0a0a;
          border: 2px solid #ff4500;
          padding: 36px;
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .capture-header {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #222;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .capture-logo {
          font-size: 18px;
          font-weight: 700;
          color: #ff4500;
        }
        .capture-badge {
          font-size: 11px;
          color: #ffb700;
          letter-spacing: 2px;
        }
        .capture-username {
          font-size: 42px;
          line-height: 1;
          color: #ff6b00;
          letter-spacing: 1px;
        }
        .capture-sub {
          font-size: 12px;
          color: #888;
          margin-bottom: 24px;
        }
        .capture-archetype {
          background: #141414;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 20px;
        }
        .capture-emoji {
          font-size: 48px;
        }
        .capture-arch-label {
          font-size: 9px;
          letter-spacing: 2px;
          color: #ff6b00;
        }
        .capture-arch-title {
          font-size: 26px;
          color: #fff;
          margin: 2px 0 4px;
        }
        .capture-arch-desc {
          font-size: 11px;
          color: #aaa;
          line-height: 1.4;
        }
        .capture-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 20px;
        }
        .capture-stat-box {
          background: #111;
          border: 1px solid #222;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }
        .cs-label {
          font-size: 9px;
          color: #888;
          display: block;
          margin-bottom: 4px;
        }
        .cs-val {
          font-size: 24px;
          color: #fff;
        }
        .cs-danger {
          color: #ff4500;
        }
        .cs-fire {
          color: #ffb700;
        }
        .capture-quote-box {
          background: rgba(255, 69, 0, 0.06);
          border: 1px dashed rgba(255, 69, 0, 0.4);
          border-radius: 8px;
          padding: 14px;
          margin-bottom: 20px;
        }
        .capture-quote {
          font-size: 12px;
          color: #ccc;
          line-height: 1.5;
          font-style: italic;
          text-align: center;
        }
        .capture-footer {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #666;
          border-top: 1px solid #222;
          padding-top: 12px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes spinPulse {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }

        @media (max-width: 480px) {
          .wrapped-grid {
            grid-template-columns: 1fr;
          }
          .verdict-banner {
            flex-direction: column;
            text-align: center;
          }
          .verdict-grade-block {
            border-right: none;
            border-bottom: 1px solid rgba(255, 69, 0, 0.2);
            padding-right: 0;
            padding-bottom: 8px;
          }
        }
      `}</style>
        </>
    );
}
