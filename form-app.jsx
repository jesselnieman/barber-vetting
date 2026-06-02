// Main form application — multi-section with progress
const HERO_IMAGES = [
  'assets/shop-1.jpg',
  'assets/cut-1.jpg',
  'assets/shop-3.jpg',
  'assets/cut-2.jpg',
  'assets/shop-4.jpg',
  'assets/cut-3.jpg',
  'assets/shop-5.jpg'
];

const HERO_COPY = [
  { eyebrow: "Section 01 · Basics", title: <>Start here.</>, body: "Three questions. License, schedule, booth rent. The rest of the application only matters if these three are yes." },
  { eyebrow: "Section 02 · Craft", title: <>The <em>work.</em></>, body: "Your clippers, your shears, your razor. Tell us what you can do and what you do best." },
  { eyebrow: "Section 03 · The chair as a business", title: <>Your <em>book.</em></>, body: "A barber is a small business. How you handle bookings, clients, and your own brand matters." },
  { eyebrow: "Section 04 · Character", title: <>The <em>human</em> part.</>, body: "Skill gets a client in the chair. Character brings them back. Talk to us about the human half." },
  { eyebrow: "Section 05 · Fit", title: <>Show up.</>, body: "Reliability isn't a skill, it's a standard. Where you are in your career and how you carry yourself." },
  { eyebrow: "Section 06 · Last word", title: <>Your <em>floor.</em></>, body: "One open question. Anything you want Bruce to know — this is where it goes." },
  { eyebrow: "Section 07 · Final detail", title: <>How we reach you.</>, body: "Your contact info. Bruce responds to every candidate personally — by phone." }
];

function ApplicationForm() {
  const [answers, setAnswers] = useState(() => {
    // Instant hydrate from the local cache; the authoritative draft (if any)
    // is loaded from Supabase on mount below.
    try { return JSON.parse(localStorage.getItem('ccb_draft') || '{}'); } catch { return {}; }
  });
  const [sectionIdx, setSectionIdx] = useState(() => {
    try { return parseInt(localStorage.getItem('ccb_section') || '0', 10) || 0; } catch { return 0; }
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ccb_submission') || 'null'); } catch { return null; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const sections = window.CCB_SECTIONS;
  const totalSteps = sections.length;
  const isLast = sectionIdx === totalSteps - 1;

  // Load any in-progress draft from Supabase once on mount. Skip if this user
  // has already submitted (the Thank You screen owns the view then).
  const hydrated = React.useRef(false);
  React.useEffect(() => {
    if (submitted) return;
    CCB_API.loadDraft().then((draft) => {
      hydrated.current = true;
      if (draft && Object.keys(draft).length) setAnswers(draft);
    }).catch(() => { hydrated.current = true; });
  }, []);

  // Sync the draft to Supabase (and the local cache) when answers change,
  // debounced so we don't write on every keystroke.
  React.useEffect(() => {
    const t = setTimeout(() => { CCB_API.saveDraft(answers); }, 600);
    return () => clearTimeout(t);
  }, [answers]);
  React.useEffect(() => {
    localStorage.setItem('ccb_section', String(sectionIdx));
  }, [sectionIdx]);

  const updateAnswer = (id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setErrors(prev => ({ ...prev, [id]: undefined }));
  };

  const validateSection = () => {
    const section = sections[sectionIdx];
    const errs = {};
    section.questions.forEach(q => {
      if (q.optional) return;
      const v = answers[q.id];
      if (q.kind === 'multi') {
        if (!Array.isArray(v) || v.length === 0) errs[q.id] = 'Pick at least one.';
      } else if (q.kind === 'text') {
        if (!v || v.trim().length < 4) errs[q.id] = 'Give us a real answer.';
      } else if (q.kind === 'url') {
        // optional; but if present validate
        if (v && !/^https?:\/\//i.test(v)) errs[q.id] = 'Include https:// at the start.';
      } else if (q.kind === 'input' || q.kind === 'tel' || q.kind === 'email' || q.kind === 'number') {
        if (!v || String(v).trim() === '') errs[q.id] = 'Required.';
        else if (q.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) errs[q.id] = 'Use a valid email.';
        else if (q.kind === 'number' && isNaN(Number(v))) errs[q.id] = 'Must be a number.';
      } else if (!v) {
        errs[q.id] = 'Pick one.';
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateSection()) return;
    if (isLast) {
      handleSubmit();
    } else {
      setSectionIdx(i => i + 1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const back = () => {
    if (sectionIdx > 0) {
      setErrors({});
      setSectionIdx(i => i - 1);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleSubmit = async () => {
    // Build flagged profile. NOTE: this logic is mirrored in computeFlags() in
    // portal-app.jsx — keep the two in sync (see CLAUDE.md).
    const flags = [];
    sections.forEach(s => s.questions.forEach(q => {
      if (q.qualifier && q.negative && q.negative.includes(answers[q.id])) {
        flags.push({ qid: q.id, kind: 'qualifier', prompt: q.prompt, answer: answers[q.id] });
      }
      if (q.reliability && q.negative && q.negative.includes(answers[q.id])) {
        flags.push({ qid: q.id, kind: 'reliability', prompt: q.prompt, answer: answers[q.id] });
      }
    }));

    setSubmitting(true);
    setSubmitError(null);
    let result;
    try {
      result = await CCB_API.submit(answers, flags);
    } catch (e) {
      console.error('[CCB] submission failed', e);
      setSubmitting(false);
      setSubmitError("Couldn't send your application — check your connection and try again.");
      return; // keep the draft intact so they can retry
    }

    const submission = {
      ...answers,
      submittedAt: result.submittedAt,
      confirmationId: result.confirmationId,
      flags,
      status: 'new'
    };
    localStorage.setItem('ccb_submission', JSON.stringify(submission));
    setSubmitted(submission);
    setSubmitting(false);
    localStorage.removeItem('ccb_section');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleReset = () => {
    setSubmitted(null);
    setAnswers({});
    setSectionIdx(0);
    setErrors({});
    localStorage.removeItem('ccb_submission');
    localStorage.removeItem('ccb_draft');
    localStorage.removeItem('ccb_draft_id');
    localStorage.removeItem('ccb_section');
  };

  if (submitted) {
    return <ThankYou submission={submitted} onReset={handleReset} />;
  }

  const section = sections[sectionIdx];
  const heroImg = HERO_IMAGES[sectionIdx % HERO_IMAGES.length];
  const heroCopy = HERO_COPY[sectionIdx] || HERO_COPY[0];

  return (
    <div className="app-shell">
      <aside className="hero-col">
        <div className="hero-photo" style={{ backgroundImage: `url(${heroImg})` }}></div>
        <div className="hero-shade"></div>
        <div className="brand-lockup">
          <img src="assets/logomark.png" alt="Center City Barbers" />
          <div className="brand-text">
            CENTER CITY BARBERS
            <small>Lakeland · Est. Downtown</small>
          </div>
        </div>
        <div className="hero-headline fade-enter" key={sectionIdx}>
          <span className="eyebrow">{heroCopy.eyebrow}</span>
          <h1>{heroCopy.title}</h1>
          <p>{heroCopy.body}</p>
        </div>
        <div className="hero-meta">
          <span>20 questions · 8–10 min</span>
        </div>
      </aside>

      <main className="form-col">
        <div className="form-header">
          <div className="section-marker">
            <span className="num">{section.number}</span>
            <span className="name">{section.name}</span>
          </div>
          <div className="count">{sectionIdx + 1} / {totalSteps}</div>
        </div>

        <div className="progress-rail" role="progressbar" aria-valuenow={sectionIdx + 1} aria-valuemax={totalSteps}>
          {sections.map((_, i) => (
            <div key={i} className={`step ${i < sectionIdx ? 'done' : i === sectionIdx ? 'active' : ''}`} />
          ))}
        </div>

        <div className="fade-enter" key={sectionIdx}>
          <div className="section-intro">
            <h2>{section.name}</h2>
            <p>{section.lede}</p>
          </div>

          <div className="q-list">
            {section.id === 'contact' ? (
              <ContactFields
                answers={answers}
                onChange={updateAnswer}
                errors={errors}
              />
            ) : (
              section.questions.map((q, i) => (
                <QuestionBlock
                  key={q.id}
                  q={q}
                  idx={i}
                  value={answers[q.id]}
                  onChange={(v) => updateAnswer(q.id, v)}
                  error={errors[q.id]}
                />
              ))
            )}
          </div>
        </div>

        {submitError && <div className="form-submit-error">{submitError}</div>}

        <div className="form-nav">
          <button className="btn ghost" onClick={back} disabled={sectionIdx === 0 || submitting}>
            <span className="arrow">←</span> Back
          </button>
          <button className="btn primary" onClick={next} disabled={submitting}>
            {isLast ? (submitting ? 'Sending…' : 'Submit application') : 'Continue'} <span className="arrow">→</span>
          </button>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { ApplicationForm });
