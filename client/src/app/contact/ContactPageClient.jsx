// Rule 7: Eradicate all remaining hardcoded Dark Mode Hex Codes. Switched to Luminous light-mode variables.
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
import { toast, toastPromise } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { dispatchContactMessage } from '@/services/roastService';
import Breadcrumb from '@/components/Breadcrumb';

const SUPPORT_EMAIL = 'priyanshu.alt191@gmail.com';

const CATEGORIES = [
  { id: 'bug', label: '🐛 Bug Report', emoji: '🐛' },
  { id: 'feedback', label: '💡 Feature Request', emoji: '💡' },
  { id: 'pro', label: '⚡ Pro Billing', emoji: '⚡' },
  { id: 'dispute', label: '⚖️ Roast Dispute', emoji: '⚖️' },
  { id: 'general', label: '📬 General', emoji: '📬' },
];

export default function ContactPageClient() {
  const { user } = useAuth();
  const [category, setCategory] = useState('bug');
  const [name, setName] = useState(user?.username ? `@${user.username}` : '');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [sending, setSending] = useState(false);
  const [previewTicketId] = useState(() => `GR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`);

  function handleCopyEmail() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(SUPPORT_EMAIL);
      toast.copy(`📋 Email copied to clipboard! (${SUPPORT_EMAIL})`);
    } else {
      toast.info(`Email: ${SUPPORT_EMAIL}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!message.trim()) {
      toast.warning('Please provide a message before sending!');
      return;
    }

    setSending(true);

    try {
      const res = await toastPromise(
        dispatchContactMessage({
          category,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim(),
        }),
        {
          loading: '📬 Dispatching message to GitRoast team...',
          success: (data) => `🔥 Message dispatched! Reference #${data?.ticketId || previewTicketId}`,
          error: (err) => err?.message || 'Dispatch failed. You can also email us directly!',
        }
      );

      const ref = res?.ticketId || previewTicketId;
      setTicketId(ref);
      setSubmitted(true);
    } catch {
      // toastPromise already displayed error feedback
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

      {/* ── Breadcrumb ── */}
      <div className="breadcrumb-wrap">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
      </div>

      {/* ── Header Matching Approved Mockup ── */}
      <header className="contact-header">
        <h1 className="font-display contact-title">GET IN TOUCH WITH THE PIT CREW</h1>
        <p className="contact-sub font-mono">
          Report a bug, dispute a savage roast, or inquire about team plans
        </p>
      </header>

      {/* ── Form Card Matching Mockup ── */}
      <div className="card form-card">
        {submitted ? (
          <div className="success-state font-mono">
            <div className="success-icon">🔥</div>
            <h2 className="font-display success-title text-fire">MESSAGE RECEIVED</h2>
            <p className="success-ref">
              Reference Ticket: <strong>#{ticketId}</strong>
            </p>
            <p className="success-desc">
              Thanks for reaching out! We have dispatched your note to the GitRoast pit crew and will follow up shortly.
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
                    toast.copy(`📋 Copied Ticket #${ticketId} to clipboard!`);
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
            {/* Category selection chips */}
            <div className="category-chips-row">
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

            {/* Inputs */}
            <div className="form-group">
              <input
                id="contact-email"
                type="email"
                placeholder="Your Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input font-mono"
                maxLength={100}
                required
              />
            </div>

            <div className="form-group">
              <input
                id="contact-name"
                type="text"
                placeholder="GitHub Username (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input font-mono"
                maxLength={50}
              />
            </div>

            {/* Message with helper counter */}
            <div className="form-group">
              <textarea
                id="contact-msg"
                rows={5}
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="form-textarea font-mono"
                maxLength={1000}
                required
              />
              <div className="counter-row font-mono">
                helper counter: {message.length}/1000
              </div>
            </div>

            {/* Ticket & SLA Badges */}
            <div className="ticket-sla-row font-mono">
              <span className="ticket-badge">Ticket ID: {previewTicketId}</span>
              <span className="sla-badge">✅ Guaranteed 4-Hour Response SLA</span>
            </div>

            {/* Submit & Quick Copy row */}
            <div className="form-submit-row">
              <button
                type="submit"
                className="btn btn-primary submit-btn font-mono"
                disabled={sending}
              >
                {sending ? 'Dispatching...' : '🔥 Dispatch Message'}
              </button>
              <button
                type="button"
                className="btn btn-copy-email font-mono"
                onClick={handleCopyEmail}
                title="Copy direct email address to clipboard"
              >
                <span>Or copy direct email: {SUPPORT_EMAIL}</span>
                <span className="copy-icon">📋</span>
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
        .breadcrumb-wrap {
          width: 100%;
          position: relative;
          z-index: 1;
          margin-top: -0.5rem;
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

        .category-chips-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .category-chip {
          font-size: 12px;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          background: #FFFFFF;
          border: 1px solid var(--border);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .category-chip:hover {
          border-color: #EA580C;
          color: #EA580C;
        }
        .category-chip--active {
          background: #FFF7ED;
          border: 2px solid #EA580C;
          color: #C2410C;
          font-weight: 700;
        }

        .counter-row {
          text-align: right;
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 4px;
        }

        .ticket-sla-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .ticket-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 7px 14px;
          background: #EEF2F6;
          color: #1E293B;
          border-radius: var(--radius-sm);
          border: 1px solid #CBD5E1;
        }
        .sla-badge {
          font-size: 12px;
          font-weight: 600;
          padding: 7px 14px;
          background: #ECFDF5;
          color: #065F46;
          border-radius: var(--radius-sm);
          border: 1px solid #A7F3D0;
        }

        .btn-copy-email {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 18px;
          background: #FFFFFF;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: 13px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-copy-email:hover {
          border-color: var(--fire);
          color: var(--fire);
        }

        .form-input,
        .form-textarea {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          width: 100%;
        }
        .form-input:focus,
        .form-textarea:focus {
          border-color: var(--fire);
          box-shadow: 0 0 0 3px rgba(255, 69, 0, 0.1);
        }
        .form-textarea {
          resize: vertical;
          min-height: 120px;
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
