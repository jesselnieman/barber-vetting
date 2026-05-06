// Thank-you page — warm + personal, note from Bruce
function ThankYou({ submission, onReset }) {
  const firstName = (submission.fullName || '').split(' ')[0] || 'there';
  return (
    <div className="thankyou-shell">
      <div className="ty-hero-col">
        <div className="hero-photo" style={{ backgroundImage: 'url(assets/cut-1.jpg)' }}></div>
        <div className="hero-shade"></div>
        <div className="ty-brand">
          <img src="assets/logomark.png" alt="" />
          <div>
            <div className="brand-name">CENTER CITY BARBERS</div>
            <div className="brand-sub">Lakeland, FL · Est. downtown</div>
          </div>
        </div>
        <div className="ty-stamp">
          <div className="eyebrow" style={{color: 'var(--sage)'}}>Application Received</div>
          <div className="ty-date">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="ty-body">
        <div className="ty-inner">
          <div className="eyebrow">A note from the chair</div>
          <h1 className="ty-title">
            Thanks, <em>{firstName}</em>.
          </h1>
          <p className="ty-lede">
            Your application landed in my inbox. I read every one of these myself — not a form, not a bot, me.
          </p>

          <div className="ty-rule"></div>

          <div className="ty-letter">
            <p>
              What happens next is simple. I'll sit with your answers over the next few days. If your shape fits the shop, you'll hear from me personally — by phone, not email — to set up a working interview.
            </p>
            <p>
              A working interview means you come in, cut two heads, and we see how you move. I pay for your time either way.
            </p>
            <p>
              If it's not the right fit right now, I'll still reach out. I don't ghost people. The Lakeland barber scene is small and I remember every name.
            </p>
            <p className="ty-signoff">
              Appreciate you taking the time.
              <br />
              <span className="ty-signature">Bruce</span>
              <br />
              <span className="ty-handle">Owner · Center City Barbers</span>
            </p>
          </div>

          <div className="ty-rule"></div>

          <div className="ty-meta">
            <div className="ty-meta-row">
              <div className="ty-meta-label">Confirmation</div>
              <div className="ty-meta-value ty-meta-mono">#{submission.confirmationId}</div>
            </div>
            <div className="ty-meta-row">
              <div className="ty-meta-label">Submitted</div>
              <div className="ty-meta-value">
                {new Date(submission.submittedAt).toLocaleString('en-US', {
                  month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                })}
              </div>
            </div>
            <div className="ty-meta-row">
              <div className="ty-meta-label">We'll reach out to</div>
              <div className="ty-meta-value">{submission.email}</div>
            </div>
          </div>

          <div className="ty-cta-row">
            <a className="btn" href="https://www.centercitybarbers.com/" target="_blank" rel="noreferrer">
              Visit the shop <span className="arrow">→</span>
            </a>
            <button className="btn ghost" onClick={onReset}>
              Start a new application
            </button>
          </div>

          <div className="ty-footer">
            <span>124 E Main Street · Lakeland, FL 33803</span>
            <span>(863) 940-4830</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ThankYou });
