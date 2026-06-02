// Review portal: auth gate + candidate list + detail view
const { useState, useEffect, useMemo, useCallback } = React;

// Legacy password gate — only used when Supabase isn't configured (demo mode).
// With Supabase configured, the portal uses magic-link auth (see MagicLinkGate).
const CORRECT_PASSWORD = "phade"; // Bruce's password

function PinGate({ onUnlock }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState(false);
  const submit = () => {
    if (val.toLowerCase() === CORRECT_PASSWORD) onUnlock();
    else { setErr(true); setVal(''); }
  };
  return (
    <div className="pin-shell">
      <div className="bg"></div>
      <div className="pin-card">
        <div className="pin-brand">
          <img src="assets/logomark.png" alt="" />
          <span>CENTER CITY BARBERS</span>
        </div>
        <div className="eyebrow">Bruce's Review</div>
        <h1 style={{marginTop: 8}}>Who <em>is it?</em></h1>
        <p className="sub">Enter the password to review candidate applications.</p>
        <input
          className="pin-input"
          type="password"
          autoFocus
          value={val}
          placeholder="••••••"
          onChange={e => { setErr(false); setVal(e.target.value); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
        />
        {err && <div className="pin-error">Wrong password. Try again.</div>}
        <button className="pin-btn" onClick={submit}>Unlock</button>
      </div>
    </div>
  );
}

function MagicLinkGate() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [msg, setMsg] = useState('');

  const send = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState('error'); setMsg('Enter a valid email.'); return;
    }
    setState('sending'); setMsg('');
    const { error } = await CCB_DB.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href }
    });
    if (error) { setState('error'); setMsg(error.message || 'Could not send the link.'); }
    else setState('sent');
  };

  return (
    <div className="pin-shell">
      <div className="bg"></div>
      <div className="pin-card">
        <div className="pin-brand">
          <img src="assets/logomark.png" alt="" />
          <span>CENTER CITY BARBERS</span>
        </div>
        <div className="eyebrow">Bruce's Review</div>
        {state === 'sent' ? (
          <>
            <h1 style={{marginTop: 8}}>Check your <em>email.</em></h1>
            <p className="sub">A sign-in link is on its way to {email}. Open it on this device to enter the review portal.</p>
            <button className="pin-btn" onClick={() => { setState('idle'); setEmail(''); }}>Use a different email</button>
          </>
        ) : (
          <>
            <h1 style={{marginTop: 8}}>Who <em>is it?</em></h1>
            <p className="sub">Enter your email and we'll send a one-time sign-in link.</p>
            <input
              className="pin-input"
              type="email"
              autoFocus
              value={email}
              placeholder="you@example.com"
              onChange={e => { if (state === 'error') setState('idle'); setEmail(e.target.value); }}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            {state === 'error' && <div className="pin-error">{msg}</div>}
            <button className="pin-btn" onClick={send} disabled={state === 'sending'}>
              {state === 'sending' ? 'Sending…' : 'Send sign-in link'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function NotAuthorized({ email, onSignOut }) {
  return (
    <div className="pin-shell">
      <div className="bg"></div>
      <div className="pin-card">
        <div className="pin-brand">
          <img src="assets/logomark.png" alt="" />
          <span>CENTER CITY BARBERS</span>
        </div>
        <div className="eyebrow">Bruce's Review</div>
        <h1 style={{marginTop: 8}}>Not on the <em>list.</em></h1>
        <p className="sub">{email} isn't an authorized reviewer. Ask Bruce to add you to the allowlist.</p>
        <button className="pin-btn" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  );
}

function PortalLoading() {
  return (
    <div className="pin-shell">
      <div className="bg"></div>
      <div className="pin-card">
        <div className="pin-brand">
          <img src="assets/logomark.png" alt="" />
          <span>CENTER CITY BARBERS</span>
        </div>
        <p className="sub" style={{marginTop: 24}}>Loading…</p>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    new: { label: 'New', cls: 'new' },
    reviewed: { label: 'Reviewed', cls: '' },
    shortlist: { label: 'Shortlist', cls: 'shortlist' },
    archived: { label: 'Archived', cls: 'archived' }
  };
  const m = map[status] || map.new;
  return <span className={`c-status ${m.cls}`}>{m.label}</span>;
}

function ArchiveConfirm({ name, onConfirm, onCancel }) {
  return (
    <div className="archive-backdrop" onClick={onCancel}>
      <div className="archive-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="eyebrow">Archive?</div>
        <p className="archive-warn">Have you contacted this person to let them know how you'd like to move forward?</p>
        <div className="archive-actions">
          <button className="btn-sm" onClick={onCancel}>Not yet — go back</button>
          <button className="btn-sm danger active" onClick={onConfirm}>Yes — archive</button>
        </div>
      </div>
    </div>
  );
}

function formatDateShort(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function relTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.max(1, Math.round(diff/60))}m`;
  if (diff < 86400) return `${Math.round(diff/3600)}h`;
  if (diff < 86400*7) return `${Math.round(diff/86400)}d`;
  return formatDateShort(iso);
}

// Compute flags from answers
function computeFlags(answers) {
  const flags = [];
  window.CCB_SECTIONS.forEach(s => s.questions.forEach(q => {
    if (!answers) return;
    if (q.qualifier && q.negative && q.negative.includes(answers[q.id])) {
      flags.push({ qid: q.id, kind: 'qualifier', prompt: q.prompt, answer: answers[q.id] });
    }
    if (q.reliability && q.negative && q.negative.includes(answers[q.id])) {
      flags.push({ qid: q.id, kind: 'reliability', prompt: q.prompt, answer: answers[q.id] });
    }
  }));
  return flags;
}

function CandidateListItem({ c, active, onClick }) {
  const flags = computeFlags(c.answers);
  return (
    <div className={`c-item ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="c-top">
        <div className="c-name">{c.fullName}</div>
        <div className="c-time">{relTime(c.submittedAt)}</div>
      </div>
      <div className="c-meta">
        <span className="c-years">{c.years} YR</span>
        <StatusPill status={c.status} />
        {flags.length > 0 && <span className="c-flags">⚑ {flags.length}</span>}
      </div>
    </div>
  );
}

function Sidebar({ candidates, activeIdx, onSelect, filter, setFilter, onLock, onRefresh, loading }) {
  const counts = useMemo(() => {
    const active = candidates.filter(c => c.status !== 'archived');
    const all = active.length;
    const neu = active.filter(c => c.status === 'new').length;
    const sh = active.filter(c => c.status === 'shortlist').length;
    const flagged = active.filter(c => computeFlags(c.answers).length > 0).length;
    const archived = candidates.filter(c => c.status === 'archived').length;
    return { all, neu, sh, flagged, archived };
  }, [candidates]);

  return (
    <aside className="portal-side">
      <div className="side-brand">
        <img src="assets/logomark.png" alt="" />
        <div className="title">
          Review Portal
          <small>Candidate Inbox</small>
        </div>
      </div>
      <div className="side-filters">
        <div className="filter-label">Filter</div>
        <div className="filter-chips">
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All · {counts.all}</button>
          <button className={`chip ${filter === 'new' ? 'active' : ''}`} onClick={() => setFilter('new')}>New · {counts.neu}</button>
          <button className={`chip ${filter === 'shortlist' ? 'active' : ''}`} onClick={() => setFilter('shortlist')}>Shortlist · {counts.sh}</button>
          <button className={`chip ${filter === 'flagged' ? 'active' : ''}`} onClick={() => setFilter('flagged')}>Flagged · {counts.flagged}</button>
          <button className={`chip ${filter === 'archived' ? 'active' : ''}`} onClick={() => setFilter('archived')}>Archived · {counts.archived}</button>
        </div>
      </div>
      <div className="candidate-list">
        {candidates.length === 0 && (
          <div style={{padding: '40px 22px', color: 'var(--ink-faint)', fontSize: 13, fontStyle: 'italic'}}>No candidates match.</div>
        )}
        {candidates.map((c, i) => (
          <CandidateListItem key={c.email + c.submittedAt} c={c} active={i === activeIdx} onClick={() => onSelect(i)} />
        ))}
      </div>
      <div className="side-foot">
        <span>{candidates.length} {candidates.length === 1 ? 'candidate' : 'candidates'}</span>
        <div className="side-foot-actions">
          <button onClick={onRefresh} disabled={loading}>{loading ? 'Refreshing…' : 'Refresh ↻'}</button>
          <button onClick={onLock}>Lock ↑</button>
        </div>
      </div>
    </aside>
  );
}

function answerToDisplay(q, v) {
  if (v === undefined || v === null || v === '') {
    return <span className="a-empty">— no answer —</span>;
  }
  if (Array.isArray(v)) {
    if (v.length === 0) return <span className="a-empty">— none —</span>;
    return <>{v.map(x => <span key={x} className="a-chip">{x}</span>)}</>;
  }
  if (q && q.kind === 'url') {
    return <a href={v} target="_blank" rel="noreferrer" style={{color:'var(--sage)'}}>{v}</a>;
  }
  return <span className="a-val">{String(v)}</span>;
}

function CandidateDetail({ candidate, onStatusChange, onArchive, onBack }) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  useEffect(() => { setConfirmArchive(false); }, [candidate && candidate.email, candidate && candidate.submittedAt]);
  if (!candidate) {
    return (
      <div className="empty-state">
        <div>
          <div className="bigtype">Pick a candidate.</div>
          <p>Applications from the sidebar land here. Qualifier flags and reliability signals are called out up top.</p>
        </div>
      </div>
    );
  }
  const flags = computeFlags(candidate.answers);
  const q4Count = Array.isArray(candidate.answers.q4) ? candidate.answers.q4.length : 0;

  return (
    <div>
      <button className="mobile-back" onClick={onBack}>← All candidates</button>
      <div className="review-head">
        <div className="name-block">
          <span className="eyebrow">Candidate Profile</span>
          <h1>{candidate.fullName}</h1>
          <div className="contact-row">
            <span><a href={`tel:${candidate.phone}`}>{candidate.phone}</a></span>
            <span><a href={`mailto:${candidate.email}`}>{candidate.email}</a></span>
            <span>{candidate.years} years experience</span>
          </div>
        </div>
        <div className="action-rail">
          <div className="status-set">
            <button
              className={`btn-sm ${candidate.status === 'reviewed' ? 'active' : ''}`}
              onClick={() => onStatusChange('reviewed')}
            >Mark Reviewed</button>
            <button
              className={`btn-sm ${candidate.status === 'shortlist' ? 'active' : ''}`}
              onClick={() => onStatusChange(candidate.status === 'shortlist' ? 'reviewed' : 'shortlist')}
            >★ Shortlist</button>
            <button
              className={`btn-sm archive ${candidate.status === 'archived' ? 'active' : ''}`}
              onClick={() => candidate.status === 'archived' ? onStatusChange('reviewed') : setConfirmArchive(true)}
            >{candidate.status === 'archived' ? 'Unarchive' : 'Archive'}</button>
          </div>
          <div className="conf">
            Submitted {new Date(candidate.submittedAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}
            {candidate.confirmationId && ` · #${candidate.confirmationId}`}
          </div>
        </div>
      </div>

      {/* Summary row */}
      <div className="summary-box">
        <div className="summary-cell">
          <div className="label">Skill Level</div>
          <div className="val sm">{candidate.answers.q5 || '—'}</div>
        </div>
        <div className="summary-cell">
          <div className="label">Career Stage</div>
          <div className="val sm">{(candidate.answers.q18 || '—').split('—')[0].trim()}</div>
        </div>
        <div className="summary-cell">
          <div className="label">Services</div>
          <div className="val sage">{q4Count}<span style={{fontSize:12,color:'var(--ink-faint)',marginLeft:6}}>of 10</span></div>
        </div>
        <div className="summary-cell">
          <div className="label">Flags</div>
          <div className={`val ${flags.length > 0 ? 'danger' : 'sage'}`}>{flags.length}</div>
        </div>
      </div>

      {/* Flags */}
      {flags.length > 0 && (
        <div className="flags-banner">
          <div className="flag-mark"></div>
          <div className="flag-body">
            <h3>⚑ Attention — {flags.length} flagged {flags.length === 1 ? 'response' : 'responses'}</h3>
            <ul>
              {flags.map(f => (
                <li key={f.qid}>
                  <span className="kind">{f.kind}</span>
                  <span className="q-text">{f.prompt} </span>
                  <span className="ans">→ “{f.answer}”</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {confirmArchive && (
        <ArchiveConfirm
          name={candidate.fullName}
          onCancel={() => setConfirmArchive(false)}
          onConfirm={() => { setConfirmArchive(false); onArchive(); }}
        />
      )}

      {/* Answers by section */}
      {window.CCB_SECTIONS.filter(s => s.id !== 'contact').map(section => (
        <div className="ans-section" key={section.id}>
          <div className="section-head">
            <span className="num">{section.number}</span>
            <span className="name">{section.name}</span>
          </div>
          {section.questions.map((q, i) => {
            const val = candidate.answers[q.id];
            const isFlagged = q.negative && q.negative.includes(val);
            return (
              <div className={`ans-row ${isFlagged ? 'flagged' : ''}`} key={q.id}>
                <div className="q-col">
                  <div className="q-num">Q{q.id.replace('q','')}</div>
                  <div className="q-txt">{q.prompt}</div>
                </div>
                <div className="a-col">
                  {answerToDisplay(q, val)}
                  {isFlagged && <span className="a-flag-note">⚑ flagged</span>}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function ReviewPortal() {
  const supaAuth = CCB_API.enabled;

  // --- auth: magic link (Supabase) or legacy password gate (demo mode) ---
  const [session, setSession] = useState(null);
  const [authorized, setAuthorized] = useState(null); // null = unknown / checking
  const [checkingAuth, setCheckingAuth] = useState(supaAuth);
  const [unlocked, setUnlocked] = useState(() => !supaAuth && localStorage.getItem('ccb_portal_unlocked') === 'yes');

  useEffect(() => {
    if (!supaAuth) return;
    CCB_DB.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingAuth(false);
    });
    const { data } = CCB_DB.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => data.subscription.unsubscribe();
  }, []);

  // When a session appears, confirm the email is on the reviewer allowlist.
  useEffect(() => {
    if (!supaAuth) return;
    if (!session) { setAuthorized(null); return; }
    setAuthorized(null);
    CCB_DB.rpc('is_reviewer').then(({ data }) => setAuthorized(!!data)).catch(() => setAuthorized(false));
  }, [session]);

  const isOpen = supaAuth ? !!(session && authorized) : unlocked;

  // --- candidate data ---
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [filter, setFilter] = useState('all');
  const [mobileView, setMobileView] = useState('list');

  const load = useCallback(() => {
    setLoading(true);
    CCB_API.fetchSubmissions()
      .then(setCandidates)
      .catch(e => console.error('[CCB] failed to load submissions', e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  const handleUnlock = () => {
    localStorage.setItem('ccb_portal_unlocked', 'yes');
    setUnlocked(true);
  };

  const handleLock = () => {
    if (supaAuth) { CCB_DB.auth.signOut(); }
    else { localStorage.removeItem('ccb_portal_unlocked'); setUnlocked(false); }
  };

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      if (filter === 'archived') return c.status === 'archived';
      if (c.status === 'archived') return false;
      if (filter === 'all') return true;
      if (filter === 'flagged') return computeFlags(c.answers).length > 0;
      return c.status === filter;
    });
  }, [candidates, filter]);

  useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [filtered.length, activeIdx]);

  const active = filtered[activeIdx];

  const applyStatus = (status) => {
    if (!active) return;
    const id = active.id;
    setCandidates(prev => prev.map(c => (c === active ? { ...c, status } : c)));
    // Persist; on failure, reload from the source of truth.
    CCB_API.updateStatus(id, status).catch(e => { console.error('[CCB] status update failed', e); load(); });
  };

  const handleStatusChange = (status) => applyStatus(status);
  const handleArchive = () => applyStatus('archived');

  // --- gating ---
  if (supaAuth) {
    if (checkingAuth) return <PortalLoading />;
    if (!session) return <MagicLinkGate />;
    if (authorized === null) return <PortalLoading />;
    if (!authorized) return <NotAuthorized email={session.user.email} onSignOut={handleLock} />;
  } else if (!unlocked) {
    return <PinGate onUnlock={handleUnlock} />;
  }

  return (
    <div className={`portal-shell mobile-${mobileView}`}>
      <Sidebar
        candidates={filtered}
        activeIdx={activeIdx}
        onSelect={(i) => { setActiveIdx(i); setMobileView('detail'); }}
        filter={filter}
        setFilter={setFilter}
        onLock={handleLock}
        onRefresh={load}
        loading={loading}
      />
      <main className="portal-main">
        <CandidateDetail
          candidate={active}
          onStatusChange={handleStatusChange}
          onArchive={handleArchive}
          onBack={() => setMobileView('list')}
        />
      </main>
    </div>
  );
}

Object.assign(window, { ReviewPortal });
