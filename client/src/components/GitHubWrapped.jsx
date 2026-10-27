"use client";


import { defaultWrappedYear } from "@/utils/wrapped";
import { useState, useRef, useCallback } from "react";
import useModalA11y from "@/hooks/useModalA11y";
import { toast, toastPromise } from "@/utils/toast";
import { getWrapped } from "@/services/roastService";
import { useAuth } from "@/context/AuthContext";

const YEAR = defaultWrappedYear()

export default function GitHubWrapped({ username, isPro }) {
    const { getToken } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dialogRef = useRef(null);
    const closeModal = useCallback(() => setIsOpen(false), []);
    useModalA11y(dialogRef, closeModal, isOpen);
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
            const data = await getWrapped(username, YEAR, token);
            setWrappedData(data);
        } catch (err) {
            console.error("[Wrapped] Load error:", err);
            toast.error(err.message || `Failed to load ${YEAR} Wrapped report.`);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    }

    async function handleDownload() {
        if (!wrappedData) return;
        setDownloading(true);
        try {
            await toastPromise(
                (async () => {
                    const html2canvas = (await import("html2canvas")).default;
                    const el = cardRef.current;
                    if (!el) throw new Error("Card capture element not found");


                    const canvas = await html2canvas(el, {
                        scale: 2,
                        useCORS: true,
                        backgroundColor: "#171711",
                        logging: false,
                        windowWidth: 700,
                        windowHeight: 900,
                    });


                    if (!isPro) {
                        const ctx = canvas.getContext("2d");
                        ctx.save();
                        ctx.globalAlpha = 0.15;
                        ctx.fillStyle = "#E84E2A";
                        ctx.font = 'bold 32px "Courier New", monospace';
                        ctx.textAlign = "center";
                        const angle = -Math.PI / 6;
                        for (let y = -100; y < canvas.height + 100; y += 180) {
                            for (let x = -100; x < canvas.width + 100; x += 260) {
                                ctx.save();
                                ctx.translate(x, y);
                                ctx.rotate(angle);
                                ctx.fillText(`GITROAST WRAPPED ${YEAR}`, 0, 0);
                                ctx.restore();
                            }
                        }
                        ctx.restore();
                    }

                    const link = document.createElement("a");
                    link.download = `gitroast-wrapped-${YEAR}-${username}.png`;
                    link.href = canvas.toDataURL("image/png", 1.0);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })(),
                {
                    loading: `Generating ${YEAR} GitHub Wrapped card...`,
                    success: isPro
                        ? `${YEAR} Wrapped Card downloaded (HD No Watermark)!`
                        : `${YEAR} Wrapped card downloaded. Go Pro for watermark-free.`,
                    error: "Download failed. Please try again.",
                }
            );
        } catch (err) {
            console.error("[Wrapped] Download failed:", err);
            if (cardRef.current) cardRef.current.style.display = "none";
        } finally {
            setDownloading(false);
        }
    }

    function handleShareTweet() {
        if (!wrappedData) return;
        const worstMonthText = wrappedData.worstMonth?.month
            ? `Worst Month: ${wrappedData.worstMonth.month} (${wrappedData.worstMonth.commits || 0} commits)`
            : 'Worst Month: None';
        const text = `My ${YEAR} GitHub Wrapped Archetype: "${wrappedData.archetypeEmoji ? `${wrappedData.archetypeEmoji} ` : ''}${wrappedData.archetype || 'Developer'}".\n\nTotal Commits: ${wrappedData.totalCommits || 0}\n${worstMonthText}\nAnnual Grade: ${wrappedData.annualGrade || 'B'}\n\nRoasted by @GitRoast 🔥\n${window.location.origin}/history/${username}`;
        window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
            "_blank",
            "noopener,noreferrer",
        );
        toast.success(`Twitter opened! Share your ${YEAR} Wrapped.`);
    }

    const maxMonthly = wrappedData?.monthlyCommits?.length
        ? Math.max(1, ...wrappedData.monthlyCommits.map((m) => m.count || 0))
        : 1;

    return (
        <>
            {}
            <button
                type="button"
                className="wrapped-trigger-btn font-mono"
                onClick={handleOpen}
                title={`View ${YEAR} GitHub Wrapped Roast Report`}
            >
                {YEAR} Wrapped
            </button>

            {}
            {isOpen && (
                <div
                    className="wrapped-backdrop"
                    onClick={closeModal}
                >
                    <div
                        ref={dialogRef}
                        className="wrapped-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-label={`${YEAR} GitHub Wrapped`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="close-btn"
                            onClick={closeModal}
                            aria-label="Close Wrapped"
                        >
                            ✕
                        </button>

                        {loading ? (
                            <div className="wrapped-loading">
                                <div className="spinner font-display" aria-hidden="true">●</div>
                                <p className="font-mono loading-text">
                                    Calculating your {YEAR} developer sins...
                                </p>
                            </div>
                        ) : wrappedData ? (
                            <div className="wrapped-content">
                                {}
                                <div className="wrapped-header">
                                    <span className="wrapped-badge font-mono">
                                        GITROAST {YEAR} WRAPPED
                                    </span>
                                    <h2 className="wrapped-title font-display">
                                        @{wrappedData.username}&rsquo;S YEAR IN REVIEW
                                    </h2>
                                    <p className="wrapped-subtitle font-mono">
                                        Every commit, excuse, and abandoned dream laid bare.
                                    </p>
                                </div>

                                {}
                                <div className="archetype-card">
                                    <div className="archetype-emoji font-display">
                                        {wrappedData.archetypeEmoji}
                                    </div>
                                    <div className="archetype-details">
                                        <span className="archetype-tag font-mono">
                                            YOUR {YEAR} ARCHETYPE
                                        </span>
                                        <h3 className="archetype-name font-display">
                                            {wrappedData.archetype}
                                        </h3>
                                        <p className="archetype-desc">
                                            {wrappedData.archetypeDesc}
                                        </p>
                                    </div>
                                </div>

                                {}
                                <div className="wrapped-grid">
                                    <div className="stat-card">
                                        <span className="stat-label font-mono">Total Commits</span>
                                        <span className="stat-num font-display">
                                            {wrappedData.totalCommits}
                                        </span>
                                        <span className="stat-sub font-mono">in {YEAR}</span>
                                    </div>

                                    <div className="stat-card">
                                        <span className="stat-label font-mono">Worst Month</span>
                                        <span className="stat-num font-display text-danger">
                                            {wrappedData.worstMonth?.month || 'N/A'}
                                        </span>
                                        <span className="stat-sub font-mono">
                                            {wrappedData.worstMonth?.comment || 'No commits'}
                                        </span>
                                    </div>

                                    <div className="stat-card">
                                        <span className="stat-label font-mono">Best Streak</span>
                                        <span className="stat-num font-display text-fire">
                                            {wrappedData.bestStreak || 0}d
                                        </span>
                                        <span className="stat-sub font-mono">
                                            Died on {wrappedData.streakDiedOn || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="stat-card">
                                        <span className="stat-label font-mono">Most Abandoned</span>
                                        <span className="stat-num font-mono text-repo">
                                            {wrappedData.mostAbandonedRepo?.name || 'None'}
                                        </span>
                                        <span className="stat-sub font-mono">
                                            {wrappedData.mostAbandonedRepo?.note || 'Clean slate'}
                                        </span>
                                    </div>
                                </div>

                                {}
                                <div className="chart-section">
                                    <div className="chart-title font-mono">
                                        <span>MONTHLY COMMIT SPREAD</span>
                                        <span className="chart-year font-mono">{YEAR}</span>
                                    </div>
                                    <div className="chart-bars">
                                        {(wrappedData.monthlyCommits || []).map((m) => {
                                            const heightPct = Math.max(
                                                8,
                                                Math.round(((m.count || 0) / maxMonthly) * 100),
                                            );
                                            const isWorst = m.month === wrappedData.worstMonth?.month;
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

                                {}
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

                                {}
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

            {}
            <div
                ref={cardRef}
                style={{ position: "absolute", left: "-9999px", top: "-9999px" }}
                aria-hidden="true"
                className="hidden-card-capture"
            >
                {wrappedData && (
                    <div className="capture-container">
                        <div className="capture-header">
                            <span className="capture-logo font-mono">GITROAST</span>
                            <span className="capture-badge font-mono">{YEAR} WRAPPED</span>
                        </div>

                        <div className="capture-user">
                            <h1 className="capture-username font-display">
                                @{wrappedData.username}
                            </h1>
                            <p className="capture-sub font-mono">
                                {YEAR} GitHub Year In Review
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
                                    {wrappedData.worstMonth?.month || 'N/A'}
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
                            <span>gitroast · github roast report {YEAR}</span>
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
          background: rgba(232, 78, 42, 0.08);
          border: 1px solid rgba(232, 78, 42, 0.35);
          color: #E6B84A;
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
          background: rgba(232, 78, 42, 0.16);
          border-color: #E84E2A;
          color: #E84E2A;
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
          border: 1px solid rgba(232, 78, 42, 0.3);
          border-radius: var(--radius-lg, 12px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 32px rgba(232, 78, 42, 0.15);
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
          background: rgba(232, 78, 42, 0.12);
          border: 1px solid rgba(232, 78, 42, 0.4);
          color: #E84E2A;
          margin-bottom: 8px;
        }
        .wrapped-title {
          font-size: 32px;
          line-height: 1.1;
          letter-spacing: 1px;
          background: linear-gradient(135deg, #fff 0%, #E6B84A 100%);
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
          background: #22221A;
          border: 1px solid rgba(232, 78, 42, 0.25);
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
          color: #E84E2A;
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
          color: #E84E2A;
        }
        .text-fire {
          color: #E6B84A;
        }
        .text-repo {
          font-size: 14px;
          font-weight: 700;
          color: #7FD3A0;
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
          color: #E84E2A;
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
          background: #E84E2A;
        }
        .bar-worst {
          background: rgba(232, 78, 42, 0.5);
        }
        .bar-label {
          font-size: 9px;
          color: var(--text-ghost);
        }

        /* Verdict */
        .verdict-banner {
          background: rgba(232, 78, 42, 0.05);
          border: 1px dashed rgba(232, 78, 42, 0.3);
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
          border-right: 1px solid rgba(232, 78, 42, 0.2);
          padding-right: 14px;
        }
        .grade-label {
          font-size: 8px;
          letter-spacing: 1px;
          color: #E84E2A;
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
          background: #171711;
          border: 2px solid #E84E2A;
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
          color: #E84E2A;
        }
        .capture-badge {
          font-size: 11px;
          color: #E6B84A;
          letter-spacing: 2px;
        }
        .capture-username {
          font-size: 42px;
          line-height: 1;
          color: #E84E2A;
          letter-spacing: 1px;
        }
        .capture-sub {
          font-size: 12px;
          color: #888;
          margin-bottom: 24px;
        }
        .capture-archetype {
          background: #22221A;
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
          color: #E84E2A;
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
          color: #E84E2A;
        }
        .cs-fire {
          color: #E6B84A;
        }
        .capture-quote-box {
          background: rgba(232, 78, 42, 0.06);
          border: 1px dashed rgba(232, 78, 42, 0.4);
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
            border-bottom: 1px solid rgba(232, 78, 42, 0.2);
            padding-right: 0;
            padding-bottom: 8px;
          }
        }
      `}</style>
        </>
    );
}

