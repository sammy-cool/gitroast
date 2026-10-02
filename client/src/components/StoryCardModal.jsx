'use client';

// ============================================================
// GITROAST — StoryCardModal Component (9:16 Vertical Export)
// ============================================================
// WHAT: Interactive modal providing a 9:16 vertical story card generator
//       tailored for Instagram Stories, TikTok, LinkedIn, and mobile sharing.
//
// WHY:
//   Standard 16:9 or 1:1 square cards leave massive black bars when shared
//   on mobile stories. A dedicated 9:16 canvas with customizable viral stickers
//   and high-density typographic layout maximizes social virality and referral traffic.
//
// WHERE & WHEN TO USE:
//   Rendered inside ShareButtons.jsx when a developer completes a roast
//   and clicks "📱 Story Format (9:16)".
//
// USE CASES:
//   1. Posting developer roast stories on Instagram, TikTok, and Snapchat.
//   2. Sharing vertical certificates on LinkedIn feed or mobile WhatsApp status.
//   3. High-resolution 1080x1920 PNG export for mobile wallpapers or memes.
//
// WHEN NOT TO USE:
//   Do not use for GitHub README markdown embeds (use SVG badge instead).
// ============================================================

import React, { useState, useRef } from 'react';
import { toast, toastPromise } from '@/utils/toast';

const AVAILABLE_STICKERS = [
  { id: 'tests', label: '🚨 0 UNIT TESTS DETECTED', color: '#EF4444' },
  { id: 'spaghetti', label: '🍝 SPAGHETTI ARCHITECTURE', color: '#F59E0B' },
  { id: 'coffee', label: '☕ POWERED BY COFFEE & REGRET', color: '#8B5CF6' },
  { id: 'blame', label: '🧲 GIT BLAME MAGNET', color: '#EC4899' },
  { id: 'lgtm', label: '🤡 LGTM WITHOUT READING', color: '#10B981' },
];

export default function StoryCardModal({
  isOpen,
  onClose,
  username,
  score,
  grade,
  headline,
  roastText,
  shameCommits = [],
  topLanguage = 'JavaScript',
  totalRepos = 0,
  abandonedRepos = 0,
  totalStars = 0,
  isPro = false,
}) {
  const [selectedStickers, setSelectedStickers] = useState(['tests']);
  const [downloading, setDownloading] = useState(false);
  const [copying, setCopying] = useState(false);
  const storyCaptureRef = useRef(null);

  if (!isOpen) return null;

  const toggleSticker = (id) => {
    setSelectedStickers((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      await toastPromise(
        (async () => {
          const html2canvas = (await import('html2canvas')).default;
          const element = storyCaptureRef.current;
          if (!element) throw new Error('Story card element not found');

          // Scale: 3 ensures 360x640 becomes 1080x1920 (Standard HD Story Resolution)
          const canvas = await html2canvas(element, {
            scale: 3,
            useCORS: true,
            backgroundColor: '#F7F5F0',
            logging: false,
            windowWidth: 360,
            windowHeight: 640,
          });

          if (!isPro) {
            const ctx = canvas.getContext('2d');
            ctx.save();
            ctx.globalAlpha = 0.14;
            ctx.fillStyle = '#FF4500';
            ctx.font = 'bold 54px monospace';
            ctx.textAlign = 'center';
            const angle = -Math.PI / 4;
            const stepX = 400;
            const stepY = 280;
            const text = 'GITROAST.DEV 🔥';
            for (let y = -200; y < canvas.height + 200; y += stepY) {
              for (let x = -200; x < canvas.width + 200; x += stepX) {
                ctx.save();
                ctx.translate(x, y);
                ctx.rotate(angle);
                ctx.fillText(text, 0, 0);
                ctx.restore();
              }
            }
            ctx.restore();
          }

          const link = document.createElement('a');
          link.download = `gitroast-story-${username}.png`;
          link.href = canvas.toDataURL('image/png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })(),
        {
          loading: '🎨 Rendering 1080×1920 vertical Story card...',
          success: isPro
            ? '📥 1080×1920 HD Story saved (No Watermark)!'
            : '📥 1080×1920 Story saved (Watermarked)!',
          error: 'Failed to generate Story card image.',
        }
      );
    } catch (err) {
      console.error('Story download error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (copying) return;
    setCopying(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const element = storyCaptureRef.current;
      if (!element) throw new Error('Story card element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#F7F5F0',
        logging: false,
        windowWidth: 360,
        windowHeight: 640,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast.error('Could not create image blob');
          setCopying(false);
          return;
        }

        try {
          if (navigator.clipboard && navigator.clipboard.write) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            toast.success('📋 Story card copied to clipboard! Ready to paste into Instagram or WhatsApp.');
          } else {
            toast.info('Clipboard image copy not supported on this browser. Use Download instead.');
          }
        } catch {
          toast.info('Clipboard access restricted. Use the Download button to save the image.');
        } finally {
          setCopying(false);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy story error:', err);
      setCopying(false);
    }
  };

  const scoreColor =
    score < 40 ? 'var(--bad, #EF4444)' :
    score < 70 ? 'var(--warn, #F59E0B)' :
    'var(--good, #10B981)';

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://gitroast.dev/history/${username}`;

  return (
    <div className="story-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="story-modal-surface" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2 className="modal-title font-display">📱 INSTAGRAM / TIKTOK STORY (9:16)</h2>
            <p className="modal-subtitle font-mono">1080×1920 vertical format with customizable viral stickers</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Modal Body: Left Canvas Preview + Right Sticker Selector & Controls */}
        <div className="modal-body">
          
          {/* 9:16 Vertical Card Capture Zone */}
          <div className="story-card-wrapper">
            <div id="story-card-capture" ref={storyCaptureRef} className="story-card font-mono">
              
              {/* Top Bar */}
              <div className="story-top-bar">
                <span className="story-brand font-display">GITROAST 🔥</span>
                <span className="story-dossier-tag">SHAME DOSSIER // 2025</span>
              </div>

              {/* Developer Profile Row */}
              <div className="story-profile-row">
                <div className="story-avatar-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://avatars.githubusercontent.com/${username}?s=120`}
                    alt={`@${username}`}
                    className="story-avatar-img"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="story-profile-text">
                  <span className="story-username">@{username}</span>
                  <span className="story-lang-chip">{topLanguage || 'Code'}</span>
                </div>
                <div className="story-grade-seal" style={{ borderColor: scoreColor }}>
                  <span className="seal-grade font-display" style={{ color: scoreColor }}>
                    {grade || 'F'}
                  </span>
                  <span className="seal-score">{score || 0}/100</span>
                </div>
              </div>

              {/* Tabloid Crime Headline */}
              <div className="story-headline-box">
                <p className="story-headline font-display">
                  {headline || 'COMMIT CRIMES & ABANDONED REPOSITORIES'}
                </p>
              </div>

              {/* The Brutal Roast Quote */}
              <div className="story-roast-box">
                <span className="roast-quote-mark font-display">&ldquo;</span>
                <p className="story-roast-text">
                  {roastText ? roastText.slice(0, 220) : 'Your commit history is a cry for help.'}
                  {roastText && roastText.length > 220 ? '...' : ''}
                </p>
                <span className="roast-quote-mark roast-quote-mark--end font-display">&rdquo;</span>
              </div>

              {/* Commit Shame Capsule */}
              {shameCommits && shameCommits.length > 0 && (
                <div className="story-commit-shame">
                  <span className="commit-shame-label font-mono">CRIME COMMIT:</span>
                  <span className="commit-shame-pill font-mono">
                    &ldquo;{shameCommits[0]}&rdquo;
                  </span>
                </div>
              )}

              {/* Key Forensic Stats */}
              <div className="story-stats-grid">
                <div className="story-stat-item">
                  <span className="stat-label">TOTAL REPOS</span>
                  <span className="stat-value">{totalRepos}</span>
                </div>
                <div className="story-stat-item">
                  <span className="stat-label">ABANDONED</span>
                  <span className="stat-value stat-value--bad">{abandonedRepos}</span>
                </div>
                <div className="story-stat-item">
                  <span className="stat-label">STARS</span>
                  <span className="stat-value">{totalStars}</span>
                </div>
              </div>

              {/* Active Viral Stickers */}
              {selectedStickers.length > 0 && (
                <div className="story-stickers-container">
                  {selectedStickers.map((stickerId) => {
                    const st = AVAILABLE_STICKERS.find((s) => s.id === stickerId);
                    if (!st) return null;
                    return (
                      <div
                        key={st.id}
                        className="story-sticker font-display"
                        style={{ borderColor: st.color, color: st.color }}
                      >
                        {st.label}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Bottom Verification Footer & QR Code */}
              <div className="story-footer">
                <div className="story-qr-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt="Scan to verify"
                    className="story-qr-img"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60"><rect width="60" height="60" fill="%23FFFFFF"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="8" fill="%23111827">VERIFY</text></svg>';
                    }}
                  />
                </div>
                <div className="story-footer-text">
                  <p className="footer-site font-mono">gitroast.dev/history/{username}</p>
                  <p className="footer-callout font-mono">SCAN OR VISIT TO AUDIT YOUR CODE</p>
                </div>
              </div>

            </div>
          </div>

          {/* Controls Side Panel */}
          <div className="story-controls-panel">
            
            <div className="panel-section">
              <h3 className="section-title font-mono">⚡ CUSTOM VIRAL STICKERS</h3>
              <p className="section-desc font-mono">Toggle stamps to decorate your story before export:</p>
              <div className="stickers-list">
                {AVAILABLE_STICKERS.map((st) => {
                  const isChecked = selectedStickers.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      className={`sticker-toggle-btn font-mono ${isChecked ? 'sticker-toggle-btn--active' : ''}`}
                      onClick={() => toggleSticker(st.id)}
                    >
                      <span className="sticker-checkbox">{isChecked ? '✓' : '+'}</span>
                      <span className="sticker-name">{st.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="panel-section">
              <h3 className="section-title font-mono">📐 STORY SPECS</h3>
              <div className="specs-box font-mono">
                <div className="spec-row">
                  <span>Aspect Ratio</span>
                  <span className="spec-val">9:16 Vertical</span>
                </div>
                <div className="spec-row">
                  <span>Export Resolution</span>
                  <span className="spec-val">1080 × 1920 px (HD)</span>
                </div>
                <div className="spec-row">
                  <span>Recommended For</span>
                  <span className="spec-val">IG Stories, TikTok, LinkedIn</span>
                </div>
                <div className="spec-row">
                  <span>Tier Status</span>
                  <span className="spec-val" style={{ color: isPro ? '#10B981' : '#F59E0B' }}>
                    {isPro ? 'Pro (No Watermark)' : 'Free (Watermarked)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="panel-actions">
              <button
                type="button"
                className="btn btn-primary export-action-btn font-mono"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? '⏳ Rendering 1080×1920...' : '⬇️ Download 9:16 Story PNG'}
              </button>
              
              <button
                type="button"
                className="btn btn-secondary export-action-btn font-mono"
                onClick={handleCopyToClipboard}
                disabled={copying}
              >
                {copying ? '⏳ Copying...' : '📋 Copy Image to Clipboard'}
              </button>
            </div>

          </div>

        </div>

      </div>

      <style jsx>{`
        .story-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          overflow-y: auto;
        }

        .story-modal-surface {
          background: var(--bg-card, #FFFFFF);
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-lg, 16px);
          box-shadow: 0 24px 60px -15px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 840px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes modalPop {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1.5rem 1.75rem 1rem;
          border-bottom: 1px solid var(--border, #E2E8F0);
        }

        .modal-title {
          font-size: 1.5rem;
          margin: 0;
          color: var(--text-primary, #0F172A);
        }

        .modal-subtitle {
          font-size: 12px;
          color: var(--text-secondary, #475569);
          margin-top: 4px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: var(--text-muted, #64748B);
          padding: 4px 8px;
          border-radius: 6px;
          transition: background 0.15s, color 0.15s;
        }
        .close-btn:hover {
          background: #F1F5F9;
          color: var(--text-primary, #0F172A);
        }

        .modal-body {
          display: flex;
          flex-direction: row;
          gap: 2rem;
          padding: 1.75rem;
          background: var(--bg-primary, #F8FAFC);
        }

        /* ── Story Card (360x640 preview, 9:16 aspect ratio) ── */
        .story-card-wrapper {
          flex-shrink: 0;
          display: flex;
          justify-content: center;
        }

        .story-card {
          width: 330px;
          height: 586px; /* 9:16 exact preview */
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 1.25rem 1.25rem 1rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .story-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.6rem;
          border-bottom: 1px dashed #E2E8F0;
        }

        .story-brand {
          font-size: 1.1rem;
          color: var(--fire, #FF4500);
          letter-spacing: 0.5px;
        }

        .story-dossier-tag {
          font-size: 9px;
          color: #64748B;
          letter-spacing: 0.5px;
        }

        .story-profile-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 0.6rem;
        }

        .story-avatar-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: 2px solid var(--fire, #FF4500);
          overflow: hidden;
          flex-shrink: 0;
        }

        .story-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .story-profile-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .story-username {
          font-size: 14px;
          font-weight: 700;
          color: #0F172A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .story-lang-chip {
          font-size: 9px;
          background: #EFF6FF;
          color: #0284C7;
          border-radius: 4px;
          padding: 1px 6px;
          width: fit-content;
        }

        .story-grade-seal {
          border: 2px solid;
          border-radius: 8px;
          padding: 4px 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
        }

        .seal-grade {
          font-size: 1.4rem;
          font-weight: 900;
        }

        .seal-score {
          font-size: 8px;
          color: #64748B;
          margin-top: 2px;
        }

        .story-headline-box {
          background: #111827;
          color: #FFFFFF;
          padding: 6px 10px;
          border-radius: 6px;
          margin: 0.5rem 0;
        }

        .story-headline {
          font-size: 1.15rem;
          letter-spacing: 0.5px;
          margin: 0;
          line-height: 1.15;
          text-align: center;
        }

        .story-roast-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 0.75rem 0.9rem;
          position: relative;
        }

        .roast-quote-mark {
          font-size: 1.8rem;
          color: var(--fire, #FF4500);
          line-height: 0;
          display: inline-block;
          vertical-align: top;
          margin-right: 4px;
        }

        .roast-quote-mark--end {
          margin-left: 4px;
          margin-right: 0;
        }

        .story-roast-text {
          font-size: 10.5px;
          line-height: 1.4;
          color: #334155;
          margin: 0;
          display: inline;
        }

        .story-commit-shame {
          display: flex;
          flex-direction: column;
          gap: 3px;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          padding: 6px 8px;
        }

        .commit-shame-label {
          font-size: 8px;
          font-weight: 700;
          color: #DC2626;
        }

        .commit-shame-pill {
          font-size: 9.5px;
          color: #991B1B;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .story-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          text-align: center;
        }

        .story-stat-item {
          background: #F1F5F9;
          border-radius: 6px;
          padding: 5px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label {
          font-size: 7.5px;
          color: #64748B;
        }

        .stat-value {
          font-size: 12px;
          font-weight: 700;
          color: #0F172A;
        }

        .stat-value--bad {
          color: #EF4444;
        }

        .story-stickers-container {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .story-sticker {
          font-size: 11px;
          border: 1.5px dashed;
          background: #FFFFFF;
          border-radius: 6px;
          padding: 3px 6px;
          text-align: center;
          letter-spacing: 0.5px;
          transform: rotate(-1deg);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
        }

        .story-footer {
          display: flex;
          align-items: center;
          gap: 8px;
          padding-top: 0.5rem;
          border-top: 1px dashed #E2E8F0;
        }

        .story-qr-wrap {
          width: 44px;
          height: 44px;
          flex-shrink: 0;
          border: 1px solid #CBD5E1;
          border-radius: 4px;
          padding: 2px;
          background: #FFFFFF;
        }

        .story-qr-img {
          width: 100%;
          height: 100%;
        }

        .story-footer-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .footer-site {
          font-size: 8.5px;
          font-weight: 700;
          color: #0F172A;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin: 0;
        }

        .footer-callout {
          font-size: 7.5px;
          color: #64748B;
          margin: 0;
        }

        /* ── Controls Side Panel ── */
        .story-controls-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          justify-content: space-between;
        }

        .panel-section {
          background: #FFFFFF;
          border: 1px solid var(--border, #E2E8F0);
          border-radius: var(--radius-md, 12px);
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .section-title {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary, #0F172A);
          margin: 0;
        }

        .section-desc {
          font-size: 11px;
          color: var(--text-secondary, #475569);
          margin: 0 0 0.4rem 0;
        }

        .stickers-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .sticker-toggle-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 7px 10px;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
          background: #F8FAFC;
          cursor: pointer;
          font-size: 11px;
          color: #334155;
          text-align: left;
          transition: all 0.15s ease;
        }

        .sticker-toggle-btn:hover {
          border-color: var(--fire, #FF4500);
          background: #FFF7ED;
        }

        .sticker-toggle-btn--active {
          border-color: var(--fire, #FF4500);
          background: #FFF7ED;
          color: var(--fire, #FF4500);
          font-weight: 700;
        }

        .sticker-checkbox {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
        }

        .sticker-toggle-btn--active .sticker-checkbox {
          background: var(--fire, #FF4500);
          color: #FFFFFF;
        }

        .specs-box {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 11px;
        }

        .spec-row {
          display: flex;
          justify-content: space-between;
          padding-bottom: 4px;
          border-bottom: 1px dashed #E2E8F0;
          color: var(--text-secondary, #475569);
        }

        .spec-val {
          font-weight: 700;
          color: var(--text-primary, #0F172A);
        }

        .panel-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .export-action-btn {
          width: 100%;
          padding: 12px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 8px;
        }

        @media (max-width: 768px) {
          .modal-body {
            flex-direction: column;
            align-items: center;
          }
          .story-controls-panel {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
