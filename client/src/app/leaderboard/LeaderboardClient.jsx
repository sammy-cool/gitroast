'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/Icon';
import { toast } from '@/utils/toast';
import { getEvidenceBoard, getCompanyLeaderboard, getRoastStats } from '@/services/roastService';
import './leaderboard.css';

const PAGE_SIZE = 5;
const WINDOWS = [[4, '4 weeks'], [12, '12 weeks'], [52, '12 months'], [0, 'All time']];

export function LeaderboardSkeleton() {
  return (
    <div className="lb-skel" aria-label="Loading evidence board">
      {[0, 1, 2, 3, 4].map((i) => <div key={i} className="gr-state gr-state--loading lb-skel__row" />)}
    </div>
  );
}

const initials = (n = '') => n.slice(0, 2).toUpperCase();

export default function LeaderboardClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const page = Math.max(1, parseInt(sp.get('page'), 10) || 1);
  const [tab, setTab] = useState('developers');
  const [q, setQ] = useState('');
  const [weeks, setWeeks] = useState(12);
  const [language, setLanguage] = useState('');
  const [data, setData] = useState(null);
  const [companies, setCompanies] = useState(null);
  const [state, setState] = useState('loading');
  const [rival1, setRival1] = useState('');
  const [rival2, setRival2] = useState('');
  const [total, setTotal] = useState(null);
  const [fetchedAt, setFetchedAt] = useState(null);
  const [, tick] = useState(0);

  const load = useCallback(async () => {
    setState('loading');
    try {
      const res = await getEvidenceBoard({ page, limit: PAGE_SIZE, weeks, language, q: q.trim() });
      setData(res);
      setFetchedAt(Date.now());
      setState('ready');
    } catch {
      setState('error');
    }
  }, [page, weeks, language, q]);

  useEffect(() => { if (tab === 'developers') load(); }, [tab, page, weeks, language]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { getRoastStats().then((n) => n > 0 && setTotal(n)); }, []);
  useEffect(() => {
    if (tab === 'companies' && companies === null) getCompanyLeaderboard().then(setCompanies);
  }, [tab, companies]);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const updatedLabel = fetchedAt ? (() => { const m = Math.floor((Date.now() - fetchedAt) / 60000); return m < 1 ? 'Updated just now' : `Updated ${m} min ago`; })() : '';

  const goPage = (n) => router.push(n <= 1 ? '/leaderboard' : `/leaderboard?page=${n}`);

  function challenge(username) {
    if (!rival1) { setRival1(username); return; }
    if (rival1 !== username) setRival2(username);
  }
  function preview() {
    if (!rival1 || !rival2) return toast.info('Choose two profiles', { description: 'Use Challenge on a profile to pick your rival.' });
    router.push(`/battle/${rival1}/vs/${rival2}`);
  }

  const entries = data?.entries || [];
  const pg = data?.pagination;
  const company = companies?.[0];

  return (
    <main className="lb">
      <section className="lb-hero">
        <div className="lb-hero__inner">
          <p className="gr-eyebrow lb-hero__eyebrow">Wall of Shame / Public profiles</p>
          <h1 className="lb-hero__title">Public evidence. Friendly rivalry. Zero dunking down.</h1>
          <div className="lb-hero__row">
            <p className="lb-hero__lede">Discover developers and companies by visible craft signals, then settle the important question: whose Git history has better lore?</p>
            <dl className="lb-hero__stats">
              <div><dt>Profiles roasted</dt><dd>{total ? total.toLocaleString() : '—'}</dd><small>All-time public analyses</small></div>
              <div><dt>This board</dt><dd className="lb-ember">{pg ? pg.total.toLocaleString() : '—'}</dd><small>Visible profiles (Ghost Mode excluded)</small></div>
            </dl>
          </div>
        </div>
      </section>

      <div className="gr-page lb-body">
        <div className="lb-toolbar">
          <div className="gr-seg" role="tablist" aria-label="Board">
            <button type="button" role="tab" aria-selected={tab === 'developers'} onClick={() => setTab('developers')}>Developers</button>
            <button type="button" role="tab" aria-selected={tab === 'companies'} onClick={() => setTab('companies')}>Companies</button>
            <button type="button" role="tab" aria-selected={false} onClick={() => router.push('/battle')}>Battles</button>
          </div>
          <Link href="/battle" className="gr-btn gr-btn--primary"><Icon name="plus" /> Set up a rivalry</Link>
        </div>

        {tab === 'developers' && (
          <form className="lb-filters" role="search" onSubmit={(e) => { e.preventDefault(); goPage(1); load(); }}>
            <input className="gr-input" aria-label="Search handle, company or repository" placeholder="Search handle, company or repository" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="gr-input lb-select" aria-label="Window" value={weeks} onChange={(e) => { setWeeks(Number(e.target.value)); goPage(1); }}>
              {WINDOWS.map(([v, l]) => <option key={v} value={v}>Window: {l}</option>)}
            </select>
            <input className="gr-input lb-select" aria-label="Language" placeholder="Language: Any" value={language} onChange={(e) => setLanguage(e.target.value)} onBlur={() => goPage(1)} />
          </form>
        )}

        <div className="lb-cols">
          <section aria-labelledby="lb-h">
            <p className="gr-eyebrow">Season 08</p>
            <h2 id="lb-h" className="gr-h2 lb-h">{tab === 'developers' ? 'The evidence board' : 'Company board'}</h2>
            {tab === 'developers' && updatedLabel && <p className="gr-eyebrow lb-updated">{updatedLabel}</p>}
            <p className="lb-note">{tab === 'developers' ? 'Ranking favors balanced, recent public evidence — not raw activity volume.' : 'Companies ranked by public chaos score from roasted contributors.'}</p>

            {tab === 'developers' && state === 'loading' && <LeaderboardSkeleton />}
            {tab === 'developers' && state === 'error' && (
              <div className="gr-state gr-state--error" role="alert"><span className="gr-state__tag">Error</span><p className="gr-state__title">The board is unavailable</p><p className="gr-help">Nothing was changed.</p><button type="button" className="gr-btn gr-btn--outline" onClick={load}>Retry</button></div>
            )}
            {tab === 'developers' && state === 'ready' && entries.length === 0 && (
              <div className="gr-state"><span className="gr-state__tag">Empty</span><p className="gr-state__title">No public profiles match</p><p className="gr-help">Try a wider window or clear the filters.</p></div>
            )}
            {tab === 'developers' && state === 'ready' && (
              <ol className="lb-list">
                {entries.map((e) => (
                  <li key={e.username} className={`lb-row${e.rank === 1 ? ' lb-row--first' : ''}${rival1 === e.username || rival2 === e.username ? ' lb-row--picked' : ''}`}>
                    <span className="lb-rank">{e.rank}</span>
                    <Link href={`/history/${e.username}`} className="lb-who">
                      <span className="rc-avatar" style={{ width: 40, height: 40, fontSize: 13 }}>{initials(e.username)}</span>
                      <span><b>{e.username}</b><small>{e.nickname ? `${e.nickname} • ` : ''}{e.topLanguage || 'Mixed'} • {e.roastCount} roast{e.roastCount > 1 ? 's' : ''}</small></span>
                    </Link>
                    {e.topSignal && <span className="gr-pill gr-pill--mint lb-signal">{e.topSignal.label} {e.topSignal.value}</span>}
                    <span className="lb-score"><b>{e.score}</b><small>BALANCED</small></span>
                    <button type="button" className={`gr-btn ${rival1 === e.username ? 'gr-btn--primary' : 'gr-btn--quiet'} lb-challenge`} onClick={() => challenge(e.username)}>
                      <Icon name="flame" size={16} /> {rival1 === e.username ? 'Selected' : 'Challenge'}
                    </button>
                  </li>
                ))}
              </ol>
            )}

            {tab === 'companies' && companies === null && <LeaderboardSkeleton />}
            {tab === 'companies' && companies?.length === 0 && <div className="gr-state"><span className="gr-state__tag">Empty</span><p className="gr-state__title">No companies yet</p></div>}
            {tab === 'companies' && companies?.length > 0 && (
              <ol className="lb-list">
                {companies.map((c) => (
                  <li key={c.org} className="lb-row">
                    <span className="lb-rank">{c.rank}</span>
                    <Link href={`/history/${c.org}`} className="lb-who"><span className="rc-avatar" style={{ width: 40, height: 40, fontSize: 13 }}>{initials(c.name)}</span><span><b>{c.name}</b><small>@{c.org} • {c.employeesRoasted} devs</small></span></Link>
                    <span className="lb-tag">{c.tagline}</span>
                    <span className="lb-score"><b>{c.chaosScore}</b><small>CHAOS</small></span>
                  </li>
                ))}
              </ol>
            )}

            {tab === 'developers' && pg && pg.totalPages > 1 && (
              <nav className="lb-pager" aria-label="Pagination">
                <button type="button" className="lb-pg" aria-label="Previous page" disabled={!pg.hasPrev} onClick={() => goPage(page - 1)}>←</button>
                {Array.from({ length: Math.min(3, pg.totalPages) }, (_, i) => i + 1).map((n) => <button key={n} type="button" className="lb-pg" aria-current={n === page ? 'page' : undefined} onClick={() => goPage(n)}>{n}</button>)}
                {pg.totalPages > 3 && <><span aria-hidden="true">…</span><button type="button" className="lb-pg" aria-current={page === pg.totalPages ? 'page' : undefined} onClick={() => goPage(pg.totalPages)}>{pg.totalPages}</button></>}
                <button type="button" className="lb-pg" aria-label="Next page" disabled={!pg.hasNext} onClick={() => goPage(page + 1)}>→</button>
              </nav>
            )}
            {tab === 'developers' && pg && <p className="gr-help">Showing {entries.length ? entries[0].rank : 0}–{entries.length ? entries[entries.length - 1].rank : 0} of {pg.total.toLocaleString()} visible profiles</p>}
          </section>

          <aside className="lb-rail">
            <section className="gr-card gr-card--dark" aria-label="Rivalry setup">
              <p className="gr-eyebrow lb-on-dark">Rivalry setup</p>
              <h2 className="gr-h3 lb-on-dark">Two profiles enter. The evidence decides.</h2>
              <div className="lb-vs">
                <button type="button" className="lb-slot" onClick={() => setRival1('')}>{rival1 ? <><span className="rc-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(rival1)}</span>{rival1}</> : 'Choose rival'}</button>
                <span className="lb-vs__t">VS</span>
                <button type="button" className="lb-slot" onClick={() => setRival2('')}>{rival2 ? <><span className="rc-avatar" style={{ width: 32, height: 32, fontSize: 11 }}>{initials(rival2)}</span>{rival2}</> : 'Choose rival'}</button>
              </div>
              <button type="button" className="gr-btn gr-btn--primary gr-btn--block" onClick={preview}><Icon name="flame" size={16} /> Preview battle</button>
              <p className="lb-fine">Only public, non-Ghost profiles appear here. Private results stay private.</p>
            </section>

            {company && (
              <section className="gr-card" aria-label="Company spotlight">
                <p className="gr-eyebrow">Company spotlight</p>
                <h2 className="rr-rail__title">{company.name}</h2>
                <p className="gr-help">Chaos score {company.chaosScore} • {company.employeesRoasted} public contributors</p>
                <button type="button" className="gr-btn gr-btn--outline gr-btn--block" onClick={() => setTab('companies')}>View company board</button>
              </section>
            )}

            <section className="gr-card gr-card--blue" aria-label="Inclusive by design">
              <Icon name="shield" size={22} />
              <h2 className="rr-rail__title">Inclusive by design</h2>
              <p className="gr-help">Rankings exclude identity, geography, follower count and private activity. Ghost Mode removes you from the board at any time.</p>
              <Link href="/about#methodology" className="rc-link">Read ranking safeguards →</Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
