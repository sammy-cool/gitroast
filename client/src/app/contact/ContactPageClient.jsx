'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast, toastPromise, notify } from '@/utils/toast';
import { useAuth } from '@/context/AuthContext';
import { dispatchContactMessage } from '@/services/roastService';
import Breadcrumb from '@/components/Breadcrumb';
import './contact.css';

const SUPPORT_EMAIL = 'priyanshu.alt191@gmail.com';

const CATEGORIES = [
  { id: 'feedback', label: 'Feature request or idea' },
  { id: 'bug', label: 'Bug report' },
  { id: 'pro', label: 'Plan or payment inquiry' },
  { id: 'dispute', label: 'Roast dispute or removal' },
  { id: 'general', label: 'General' },
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
      navigator.clipboard.writeText(SUPPORT_EMAIL).then(() => notify.copied({ what: 'Support email' })).catch(() => toast.info(`Email: ${SUPPORT_EMAIL}`));
    } else {
      toast.info(`Email: ${SUPPORT_EMAIL}`);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return toast.warning('Add a message first', { description: 'Tell us what is on your mind.' });
    setSending(true);
    try {
      const res = await toastPromise(
        dispatchContactMessage({ category, name: name.trim() || undefined, email: email.trim() || undefined, message: message.trim() }),
        {
          loading: 'Sending your message…',
          success: (data) => `Message received. Reference #${data?.ticketId || 'GR-CONFIRMED'}`,
          error: (err) => err?.message || 'Could not send. You can also email us directly.',
        },
      );
      setTicketId(res?.ticketId || `GR-${Math.floor(100000 + Math.random() * 900000)}`);
      setSubmitted(true);
    } catch {
      /* toast already shown */
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="ct">
      <div className="gr-page ct-body">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
        <header className="ct-head">
          <p className="gr-eyebrow">Direct dispatch</p>
          <h1 className="gr-h1">Contact the shame lab.</h1>
          <p className="gr-lede">Found a bug? Want a feature? Angry about your grade? We read and reply to every message.</p>
        </header>

        <section className="ct-channels" aria-label="Contact channels">
          <div className="gr-card">
            <span className="gr-eyebrow">Direct inbox</span>
            <p className="ct-val gr-mono">{SUPPORT_EMAIL}</p>
            <div className="ct-row">
              <button type="button" className="gr-btn gr-btn--primary" onClick={handleCopyEmail}>Copy email</button>
              <a className="gr-btn gr-btn--outline" href={`mailto:${SUPPORT_EMAIL}?subject=[GitRoast%20Support]%20Developer%20Inquiry`}>Open mail app</a>
            </div>
          </div>
          <div className="gr-card gr-card--mint">
            <span className="gr-eyebrow">Response time</span>
            <p className="ct-val">Under 24 hours</p>
            <p className="gr-help">Roast removal requests are honored without a paid plan.</p>
          </div>
          <div className="gr-card">
            <span className="gr-eyebrow">Creator</span>
            <p className="ct-val">Priyanshu Patel · Full Stack</p>
            <div className="ct-row">
              <a href="/resume/Priyanshu_Resume.pdf" download="Priyanshu_Resume.pdf" className="gr-btn gr-btn--outline">Download resume</a>
              <a href="/resume/Priyanshu_Resume.pdf" target="_blank" rel="noopener noreferrer" className="gr-btn gr-btn--quiet">View</a>
            </div>
          </div>
        </section>

        <section className="gr-card ct-form-card" aria-labelledby="ct-form-h">
          {submitted ? (
            <div className="gr-state gr-state--success" role="status">
              <span className="gr-state__tag">Success</span>
              <h2 id="ct-form-h" className="gr-h3">Message received.</h2>
              <p className="gr-help">Reference ticket <b className="gr-mono">#{ticketId}</b>. We will follow up shortly.</p>
              <div className="ct-row">
                <button type="button" className="gr-btn gr-btn--primary" onClick={() => { setMessage(''); setSubmitted(false); }}>Send another</button>
                <button type="button" className="gr-btn gr-btn--outline" onClick={() => navigator.clipboard?.writeText(ticketId).then(() => notify.copied({ what: `Ticket #${ticketId}` }))}>Copy ticket ID</button>
                <Link href="/" className="gr-btn gr-btn--quiet">Back home</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="ct-form">
              <h2 id="ct-form-h" className="gr-h3">Send us a note.</h2>
              <fieldset className="ct-fieldset">
                <legend className="gr-label">Topic</legend>
                <div className="ct-chips">
                  {CATEGORIES.map((c) => (
                    <button key={c.id} type="button" className="gr-chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</button>
                  ))}
                </div>
              </fieldset>
              <div className="ct-two">
                <div>
                  <label className="gr-label" htmlFor="contact-name">GitHub handle or name</label>
                  <input id="contact-name" className="gr-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="@username or name" maxLength={50} />
                </div>
                <div>
                  <label className="gr-label" htmlFor="contact-email">Email for replies</label>
                  <input id="contact-email" type="email" className="gr-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="developer@domain.com" maxLength={100} />
                </div>
              </div>
              <div>
                <label className="gr-label" htmlFor="contact-msg">Message</label>
                <textarea id="contact-msg" rows={6} className="gr-input ct-textarea" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Feedback, feature wishes, bug descriptions, or complaints about your score." maxLength={1000} required />
                <p className="gr-help ct-count">{message.length}/1000</p>
              </div>
              <div className="ct-row">
                <button type="submit" className="gr-btn gr-btn--primary" disabled={sending}>{sending ? 'Sending…' : 'Send message'}</button>
                <button type="button" className="gr-btn gr-btn--quiet" onClick={handleCopyEmail}>Copy email instead</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
