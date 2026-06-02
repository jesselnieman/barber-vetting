// Supabase connection config.
//
// Fill in the Project URL and the *anon* (public) key from your Supabase
// project: Settings -> API. The anon key is meant to ship in the browser;
// security is enforced by Row Level Security (see supabase/schema.sql), not by
// hiding this key.
//
// Until both fields are set to real values, the app falls back to its original
// localStorage-only behavior so the demo keeps working with zero config
// (see supabase-client.js -> CCB_API.enabled).
window.CCB_SUPABASE_CONFIG = {
  url: "https://tnwdeonkoiyyxvwehsso.supabase.co",
  // Publishable key — mapped to the anon role; safe in the browser because RLS
  // is the security boundary (Settings -> API -> Publishable key).
  anonKey: "sb_publishable_-WFRv7UyGhFm1IKF3JGc4g_xFG26Kwi"
};
