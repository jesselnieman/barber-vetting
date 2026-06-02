# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm install` — installs `serve` (the only runtime dep you'll actually use locally; react/react-dom/@babel/standalone are listed to document CDN-pinned versions, not consumed from `node_modules`).
- `npm run dev` / `npm start` — serves the project at http://localhost:5173 via `serve`. A real HTTP server is **required**; Babel Standalone fetches `.jsx` files by URL, so `file://` won't work.
- No test suite, linter, or build step is configured.

## Architecture

This is a **zero-build static site**. Everything ships as plain HTML/CSS/JSX and is compiled in the browser by `@babel/standalone`.

### Three entry points, one shared config

- `index.html` — landing page, links to Apply/Review.
- `Apply.html` — candidate-facing form. Loads `data.js`, `supabase-config.js`, `supabase-client.js`, then `form-questions.jsx`, `form-thankyou.jsx`, `form-app.jsx` (order matters — see below), then renders `<ApplicationForm />`.
- `Review.html` — Bruce's magic-link-gated review portal. Loads `data.js`, `supabase-config.js`, `supabase-client.js`, then `portal-app.jsx`, then renders `<ReviewPortal />`.

React 18.3.1, ReactDOM 18.3.1, @babel/standalone 7.29.0, and @supabase/supabase-js 2.45.4 are loaded from unpkg with SRI hashes. If versions change, the SRI hashes in the HTML must be regenerated (the supabase UMD build exposes `window.supabase.createClient`).

### No modules — script order is the dependency graph

Nothing is bundled and there are no `import`/`export` statements anywhere. All components, helpers, and React hooks exist as **globals**. Every `.jsx` file starts with something like `const { useState } = React;` to pull hooks off the global `React`. Consequences:

- When adding a new component, its `<script type="text/babel" src="...">` tag must be placed **before** any script that consumes it in the HTML.
- Shared data lives on `window.CCB_SECTIONS` and `window.CCB_MOCK_CANDIDATES` (defined in `data.js`). Both the form and the portal read from these — treat `data.js` as the single source of truth for question config.
- The data layer is a global too: `supabase-client.js` defines `window.CCB_API` (and `window.CCB_DB`, the supabase client). Both surfaces go through `CCB_API` rather than touching Supabase or localStorage directly. It must load **after** `data.js`/`supabase-config.js` and **before** the `.jsx` apps.

### Question config drives behavior in two places

`data.js` defines sections/questions with optional `qualifier: true`, `reliability: true`, and `negative: [...answers]` fields. The flag-computation logic is duplicated (intentionally, because there's no shared module system) in two places and **must stay in sync**:

- `handleSubmit` in `form-app.jsx` — computes flags on submission.
- `computeFlags(answers)` in `portal-app.jsx` — recomputes flags for display in the review portal.

If you change flag semantics, edit both.

### Supabase is the backend (with a localStorage fallback)

State lives in a single Supabase table, `submissions` (schema + RLS in `supabase/schema.sql`, demo seed in `supabase/seed.sql`). One table holds everything: a **draft is a row with `status='draft'`**, and submitting flips that same row to `status='new'`. `name`/`email`/`phone`/`years` are promoted to columns; the rest of the answers live in the `answers` jsonb. Run `schema.sql` then `seed.sql` in the Supabase SQL editor for a fresh project, and put the email Bruce signs in with into the `reviewers` allowlist (seed.sql seeds a placeholder).

`CCB_API` (in `supabase-client.js`) is the only thing that talks to the DB:

- `loadDraft()` / `saveDraft(answers)` — restore/sync the in-progress draft. The form keeps the draft row's id in `localStorage.ccb_draft_id`.
- `submit(answers, flags)` — promotes the draft to a real submission; returns `{ confirmationId, submittedAt }` (confirmationId is derived from the row uuid).
- `fetchSubmissions()` — the portal inbox (everything except drafts).
- `updateStatus(id, status)` — persists reviewed/shortlist/archive changes.

**Fallback:** if `supabase-config.js` still holds the `YOUR_SUPABASE_*` placeholders, `CCB_API.enabled` is `false` and every method falls back to the original localStorage behavior (`ccb_draft`, `ccb_submission`, `ccb_candidates`, seeded from `window.CCB_MOCK_CANDIDATES`). This keeps the demo running with zero config. `ccb_section` (last-viewed section) is always localStorage-only.

Security is enforced by **RLS**, since the anon key ships in the browser: anon can only create/read/update *drafts* and submit them; submitted rows (PII) are readable only by magic-link reviewers whose email is in the `reviewers` allowlist (checked via the `is_reviewer()` RPC). Note the demo limitation: anon can read *any* draft row (RLS can't scope by id without auth) — the row uuid is the only secret.

### Auth gate

When Supabase is configured the portal uses **magic-link auth** (`supabase.auth.signInWithOtp`, see `MagicLinkGate` in `portal-app.jsx`); a signed-in user whose email isn't in `reviewers` gets the `NotAuthorized` screen. When Supabase is **not** configured it falls back to the legacy demo password gate (`CORRECT_PASSWORD` at the top of `portal-app.jsx`, stored in `localStorage.ccb_portal_unlocked`) — that gate is not a real auth boundary.

## Conventions worth preserving

- The brand voice in prompts, placeholders, and UI copy is deliberate (direct, a little terse, Bruce's voice). Don't soften it in passing edits.
- CSS is split per-surface (`styles.css` shared, `form.css`, `portal.css`, `thankyou.css`) and uses CSS custom properties defined in `styles.css` (`--ink`, `--sage`, `--rule`, etc.). Reuse the tokens rather than inventing new colors.
