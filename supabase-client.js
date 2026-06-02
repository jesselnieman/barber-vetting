// Supabase client + data-access layer for the form and the review portal.
//
// Loaded as a plain <script> (not JSX) BEFORE the app scripts, so the rest of
// the app can rely on the globals it defines:
//
//   window.CCB_DB  — the supabase-js client (only when configured), or null.
//   window.CCB_API — the data layer used by both surfaces. Every method works
//                    whether or not Supabase is configured: when it isn't, the
//                    API falls back to the original localStorage behavior so the
//                    demo runs with zero setup.
//
// Schema/RLS lives in supabase/schema.sql. A draft is a `submissions` row with
// status='draft'; submitting flips it to status='new'.

(function () {
  const cfg = window.CCB_SUPABASE_CONFIG || {};
  const configured =
    !!cfg.url &&
    !!cfg.anonKey &&
    cfg.url.indexOf("YOUR_SUPABASE") === -1 &&
    cfg.anonKey.indexOf("YOUR_SUPABASE") === -1 &&
    !!(window.supabase && window.supabase.createClient);

  const db = configured
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null;
  window.CCB_DB = db;

  if (!configured) {
    console.warn(
      "[CCB] Supabase not configured — running on localStorage. " +
        "Set window.CCB_SUPABASE_CONFIG in supabase-config.js to go live."
    );
  }

  // ---- helpers -------------------------------------------------------------

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getDraftId() {
    let id = localStorage.getItem("ccb_draft_id");
    if (!id) {
      id = uuid();
      localStorage.setItem("ccb_draft_id", id);
    }
    return id;
  }

  function confirmationFromId(id) {
    return "CCB-" + String(id).replace(/-/g, "").slice(0, 6).toUpperCase();
  }

  // Split a flat answers object into promoted contact columns + the rest.
  function splitContact(answers) {
    const a = answers || {};
    const contact = {
      name: a.fullName || null,
      email: a.email || null,
      phone: a.phone || null,
      years: a.years === undefined || a.years === "" ? null : Number(a.years)
    };
    const rest = {};
    Object.keys(a).forEach((k) => {
      if (k.startsWith("q")) rest[k] = a[k];
    });
    return { contact, answers: rest };
  }

  // DB row -> the candidate shape the portal UI already expects.
  function rowToCandidate(row) {
    return {
      id: row.id,
      submittedAt: row.created_at,
      fullName: row.name,
      phone: row.phone,
      email: row.email,
      years: row.years,
      status: row.status,
      confirmationId: confirmationFromId(row.id),
      flags: row.flags || [],
      answers: row.answers || {}
    };
  }

  // ---- API: drafts ---------------------------------------------------------

  async function loadDraft() {
    if (!db) {
      try {
        return JSON.parse(localStorage.getItem("ccb_draft") || "{}");
      } catch {
        return {};
      }
    }
    // Local cache holds everything (incl. contact, which is never synced to the
    // server for privacy — see saveDraft). The server holds the q* answers.
    let local = {};
    try { local = JSON.parse(localStorage.getItem("ccb_draft") || "{}"); } catch {}

    const id = getDraftId();
    const { data, error } = await db
      .from("submissions")
      .select("answers")
      .eq("id", id)
      .eq("status", "draft")
      .maybeSingle();
    if (error || !data) return local;
    // Server q* answers win; contact comes from the local cache.
    return { ...local, ...(data.answers || {}) };
  }

  async function saveDraft(answers) {
    // Always keep a full local cache (incl. contact) for resilience / offline.
    try {
      localStorage.setItem("ccb_draft", JSON.stringify(answers));
    } catch {}
    if (!db) return;
    // Only the q* answers are synced to the server. Contact PII is deliberately
    // NOT written to draft rows: a draft is anon-readable and lingers after
    // submit (anon can't delete it), so keeping contact out of it avoids
    // exposing names/emails/phones. Contact is attached only to the submitted
    // row (see submit), which anon cannot read back.
    const { answers: qs } = splitContact(answers);
    const id = getDraftId();
    await db.from("submissions").upsert(
      { id, status: "draft", answers: qs },
      { onConflict: "id" }
    );
  }

  // ---- API: submit ---------------------------------------------------------

  async function submit(answers, flags) {
    const submittedAt = new Date().toISOString();
    const { contact, answers: qs } = splitContact(answers);

    if (!db) {
      // Original localStorage delivery into the portal inbox.
      const confirmationId = "CCB-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      try {
        const arr = JSON.parse(localStorage.getItem("ccb_candidates") || "[]");
        arr.unshift({
          submittedAt,
          fullName: contact.name,
          phone: contact.phone,
          email: contact.email,
          years: contact.years,
          status: "new",
          confirmationId,
          flags,
          answers: qs
        });
        localStorage.setItem("ccb_candidates", JSON.stringify(arr));
      } catch {}
      localStorage.removeItem("ccb_draft");
      localStorage.removeItem("ccb_draft_id");
      return { confirmationId, submittedAt };
    }

    // Insert the submission as its OWN row rather than transitioning the draft.
    // (Anon can INSERT a status='new' row, but cannot UPDATE a draft's status
    // to 'new' on this database — so we don't rely on the transition.) We mint
    // the id client-side so we can build the confirmation without reading the
    // row back (the anon SELECT policy hides non-draft rows). No .select().
    const subId = uuid();
    const { error } = await db.from("submissions").insert({
      id: subId,
      status: "new",
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      years: contact.years,
      answers: qs,
      flags
    });

    if (error) throw error;

    // Delivered. The draft row (q* only, no contact) is now orphaned — anon
    // can't delete it, but it carries no PII and the portal ignores drafts.
    // The next visit starts a fresh draft.
    localStorage.removeItem("ccb_draft");
    localStorage.removeItem("ccb_draft_id");

    return {
      confirmationId: confirmationFromId(subId),
      submittedAt
    };
  }

  // ---- API: portal ---------------------------------------------------------

  async function fetchSubmissions() {
    if (!db) {
      try {
        const live = JSON.parse(localStorage.getItem("ccb_candidates") || "[]");
        return [...live, ...(window.CCB_MOCK_CANDIDATES || [])];
      } catch {
        return window.CCB_MOCK_CANDIDATES || [];
      }
    }
    const { data, error } = await db
      .from("submissions")
      .select("*")
      .neq("status", "draft")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map(rowToCandidate);
  }

  async function updateStatus(id, status) {
    if (!db || !id) return; // fallback: session-only (matches prior behavior)
    const { error } = await db
      .from("submissions")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  }

  window.CCB_API = {
    enabled: configured,
    db,
    loadDraft,
    saveDraft,
    submit,
    fetchSubmissions,
    updateStatus
  };
})();
