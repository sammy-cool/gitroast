'use client';

// ============================================================
// GITROAST — Enhanced Contact & Feedback Page
// ============================================================
// WHAT: Replaces raw mailto redirect with an interactive, branded
//       contact portal for developer inquiries, bug reports, feature
//       ideas, and roast feedback.
// WHY:
//   - Mailto links fail silently for users without configured mail clients
//   - Structured categories speed up triage (bugs, pro support, disputes)
//   - 1-click clipboard copy gives developers immediate access
//   - Brand consistency: dark aesthetic, Bebas Neue, Fira Code
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import { createToast } from 'customizable-toast-notification';
import { useAuth } from '@/context/AuthContext';
import { dispatchContactMessage } from '@/services/roastService';

const SUPPORT_EMAIL = 'priyanshu.alt191@gmail.com';

const CATEGORIES = [
  { id: 'feedback', label: '💡 Feature Request / Idea', emoji: '💡' },
  { id: 'bug', label: '🐛 Bug Report', emoji: '🐛' },
  { id: 'pro', label: '⚡ Pro Plan / Payment Inquiry', emoji: '⚡' },
  { id: 'dispute', label: '🔥 Roast Dispute / Removal', emoji: '🔥' },
  { id: 'general', label: '🤝 General / Hello', emoji: '🤝' },
];

export default function ContactPageClient() {
  const { user } = useAuth();
  const [category, setCategory] = useState('feedback');
  const [name, setName] = useState(user?.username ? `@${user.username}` : '');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [sending, setSending] = useState(false);

  function handleCopyEmail() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPPORT_EMAIL);
      createToast({
        type: 'success',
        message: '📋 Email copied to clipboard! (priyanshu.alt191@gmail.com)',
        position: 'top-center',
        duration: 3500,
        showProgressBar: true,
      });
    } else {
      createToast({
        type: 'info',
        message: `Email: ${SUPPORT_EMAIL}`,
        position: 'top-center',
      });
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!message.trim()) {
      createToast({
        type: 'warning',
        message: 'Please provide a message before sending!',
        position: 'top-center',
      });
      return;
    }

    setSending(true);

    try {
      const res = await dispatchContactMessage({
        category,
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        message: message.trim(),
      });

      const ref = res.ticketId || `GR-${Math.floor(100000 + Math.random() * 900000)}`;
      setTicketId(ref);
      setSubmitted(true);

      createToast({
        type: 'success',
        message: `🔥 Message dispatched! Reference #${ref}`,
        position: 'top-center',
        duration: 5000,
        showProgressBar: true,
      });
    } catch (err) {
      createToast({
        type: 'error',
        message: err.message || 'Dispatch failed. You can also email us directly!',
        position: 'top-center',
        duration: 6000,
        cta: {
          label: 'Copy Email',
          onClick: handleCopyEmail,
        },
      });
    } finally {
      setSending(false);
    }
  }

  function handleReset() {
    setMessage('');
    setSubmitted(false);
  }

  return (
    <main className="contact-page">
      <div className="contact-glow" />

      {/* ── Top Navigation ── */}
      <nav className="contact-nav">
        <Link href="/" className="font-display nav-logo text-fire" title="GitRoast Home">
          GITROAST 🔥
        </Link>
        <div className="nav-links">
          <Link href="/about" className="btn btn-ghost nav-btn">
            About
          </Link>
          <Link href="/" className="btn btn-ghost nav-btn">
            ← Home
          </Link>
        </div>
      </nav>

      {/* ── Header ── */}
      <header className="contact-header">
        <span className="badge font-mono">DIRECT DISPATCH</span>
        <h1 className="font-display contact-title text-fire">CONTACT THE SHAME LAB</h1>
        <p className="contact-sub font-mono">
          Found a bug? Want a feature? Angry about your F- grade? We read and reply to every message.
        </p>
      </header>

      {/* ── Direct Quick-Action Cards ── */}
      <div className="channels-grid">
        <div className="channel-card card">
          <div className="channel-icon">📧</div>
          <div className="channel-info">
            <span className="channel-label font-mono">DIRECT INBOX</span>
            <span className="channel-val font-mono">{SUPPORT_EMAIL}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary channel-btn"
            onClick={handleCopyEmail}
          >
            📋 Copy Email
          </button>
        </div>

        <div className="channel-card card">
          <div className="channel-icon">⚡</div>
          <div className="channel-info">
            <span className="channel-label font-mono">SLA PROMISE</span>
            <span className="channel-val font-mono">Fast Response &lt; 24h</span>
          </div>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=[GitRoast%20Support]%20Developer%20Inquiry`}
            className="btn btn-ghost channel-btn"
          >
            ✉️ Open Mail App
          </a>
        </div>

        <div className="channel-card card resume-card">
          <div className="channel-icon">📄</div>
          <div className="channel-info">
            <span className="channel-label font-mono">CREATOR RESUME</span>
            <span className="channel-val font-mono">Priyanshu Patel · Full Stack</span>
          </div>
          <div className="resume-btn-group">
            <a
              href="/resume/Priyanshu_Resume.pdf"
              download="Priyanshu_Resume.pdf"
              className="btn btn-primary channel-btn"
              title="Download Priyanshu's Resume PDF"
            >
              📥 Download PDF
            </a>
            <a
              href="/resume/Priyanshu_Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost channel-btn"
              title="View Resume in new tab"
            >
              👁️ View
            </a>
          </div>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="card form-card">
        {submitted ? (
          <div className="success-state font-mono">
            <div className="success-icon">🔥</div>
            <h2 className="font-display success-title text-fire">MESSAGE RECEIVED</h2>
            <p className="success-ref">
              Reference Ticket: <strong>#{ticketId}</strong>
            </p>
            <p className="success-desc">
              Thanks for reaching out! We have dispatched your note to the GitRoast team and will follow up shortly.
            </p>
            <div className="success-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleReset}
              >
                Send Another Message
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                    navigator.clipboard.writeText(ticketId);
                    createToast({
                      type: 'success',
                      message: `📋 Copied Ticket #${ticketId} to clipboard!`,
                      position: 'top-center',
                      duration: 3000,
                    });
                  }
                }}
              >
                📋 Copy Ticket ID
              </button>
              <Link href="/" className="btn btn-ghost">
                ← Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form">
            <h2 className="font-display form-heading text-fire">SEND US A NOTE</h2>

            {/* Category selection */}
            <div className="form-group">
              <label className="form-label font-mono">Topic / Category:</label>
              <div className="category-chips">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-chip font-mono ${category === cat.id ? 'category-chip--active' : ''}`}
                    onClick={() => setCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Name / Handle & Email */}
            <div className="form-row">
              <div className="form-group flex-1">
                <label className="form-label font-mono" htmlFor="contact-name">
                  GitHub Handle / Name:
                </label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="@username or name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input font-mono"
                  maxLength={50}
                />
              </div>

              <div className="form-group flex-1">
                <label className="form-label font-mono" htmlFor="contact-email">
                  Your Email (for replies):
                </label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="developer@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input font-mono"
                  maxLength={100}
                />
              </div>
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label font-mono" htmlFor="contact-msg">
                Message:
              </label>
              <textarea
                id="contact-msg"
                rows={5}
                placeholder="Tell us what's on your mind — feedback, feature wishes, bug descriptions, or complaints about your savage score..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-textarea font-mono"
                maxLength={1000}
                required
              />
              <span className="char-count font-mono">{message.length}/1000</span>
            </div>

            {/* Submit */}
            <div className="form-submit-row">
              <button
                type="submit"
                className="btn btn-primary submit-btn"
                disabled={sending}
              >
                {sending ? 'Dispatching...' : '🔥 Dispatch Message'}
              </button>
              <button
                type="button"
                className="btn btn-ghost copy-btn"
                onClick={handleCopyEmail}
              >
                📋 Copy Email
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .contact-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1rem 7rem;
          gap: 1.5rem;
          max-width: 680px;
          margin: 0 auto;
          position: relative;
          color: var(--text-primary);
        }

        .contact-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 70% 35% at 50% 0%,
            rgba(255, 69, 0, 0.12) 0%,
            transparent 100%
          );
          pointer-events: none;
          z-index: 0;
        }

        .contact-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          position: relative;
          z-index: 1;
        }
        .nav-logo {
          font-size: 22px;
          text-decoration: none;
          letter-spacing: 0.5px;
        }
        .nav-links {
          display: flex;
          gap: 8px;
        }
        .contact-nav :global(.nav-btn) {
          font-size: 13px;
          text-decoration: none;
        }

        .contact-header {
          text-align: center;
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          margin-top: 0.5rem;
        }
        .badge {
          font-size: 10px;
          letter-spacing: 2px;
          padding: 3px 10px;
          background: rgba(255, 69, 0, 0.12);
          border: 1px solid rgba(255, 69, 0, 0.28);
          border-radius: var(--radius-sm);
          color: var(--fire);
        }
        .contact-title {
          font-size: clamp(32px, 8vw, 48px);
          line-height: 1.05;
        }
        .contact-sub {
          max-width: 520px;
          font-size: 12px;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .channels-grid {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
          position: relative;
          z-index: 1;
        }
        .channel-card {
          padding: 1.15rem 1rem;
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: space-between;
        }
        .resume-btn-group {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .channel-icon {
          font-size: 22px;
          flex-shrink: 0;
        }
        .channel-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }
        .channel-label {
          font-size: 10px;
          color: var(--text-muted);
          letter-spacing: 0.5px;
        }
        .channel-val {
          font-size: 11px;
          color: var(--text-primary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .channel-card :global(.channel-btn),
        .channel-btn {
          font-size: 11px;
          padding: 6px 12px;
          flex-shrink: 0;
          text-decoration: none;
        }

        .form-card {
          width: 100%;
          padding: 2rem 1.75rem;
          position: relative;
          z-index: 1;
        }

        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-heading {
          font-size: 22px;
          margin-bottom: -4px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }
        .form-row {
          display: flex;
          gap: 12px;
        }
        .flex-1 {
          flex: 1;
        }
        .form-label {
          font-size: 11px;
          color: var(--text-secondary);
        }

        .category-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .category-chip {
          font-size: 11px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          background: #111;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .category-chip:hover {
          border-color: rgba(255, 69, 0, 0.4);
          color: var(--text-primary);
        }
        .category-chip--active {
          background: rgba(255, 69, 0, 0.12);
          border-color: var(--fire);
          color: var(--fire-warm);
        }

        .form-input,
        .form-textarea {
          background: #0d0d0d;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 10px 12px;
          color: var(--text-primary);
          font-size: 12px;
          outline: none;
          transition: border-color 0.15s;
        }
        .form-input:focus,
        .form-textarea:focus {
          border-color: var(--fire);
        }
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        .char-count {
          font-size: 10px;
          color: var(--text-muted);
          text-align: right;
          margin-top: 2px;
        }

        .form-submit-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .submit-btn {
          flex: 1;
          padding: 12px;
          font-size: 14px;
        }
        .copy-btn {
          font-size: 13px;
          padding: 12px 18px;
        }

        /* Success state */
        .success-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 2rem 1rem;
          gap: 12px;
        }
        .success-icon {
          font-size: 44px;
        }
        .success-title {
          font-size: 32px;
        }
        .success-ref {
          font-size: 13px;
          color: var(--fire);
          background: rgba(255, 69, 0, 0.1);
          padding: 4px 12px;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 69, 0, 0.25);
        }
        .success-desc {
          font-size: 13px;
          color: var(--text-secondary);
          max-width: 440px;
          line-height: 1.6;
        }
        .success-actions {
          display: flex;
          gap: 10px;
          margin-top: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        .success-actions :global(.btn) {
          text-decoration: none;
        }

        @media (max-width: 580px) {
          .channels-grid {
            grid-template-columns: 1fr;
          }
          .resume-btn-group {
            width: 100%;
            margin-top: 4px;
          }
          .resume-btn-group :global(.channel-btn),
          .resume-btn-group .channel-btn {
            flex: 1;
            text-align: center;
          }
          .form-row {
            flex-direction: column;
          }
          .form-card {
            padding: 1.5rem 1rem;
          }
          .form-submit-row {
            flex-direction: column;
          }
          .submit-btn,
          .copy-btn {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
