import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Fail loudly in dev — silent client misconfiguration is the worst kind of bug.
  // eslint-disable-next-line no-console
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env var.");
}

export const supabase = createClient(url, anonKey);

// Programmatic WhatsApp send via the hyper-function Edge Function.
// Returns { ok, status, data }. Caller decides how to surface success/failure.
export async function sendWhatsAppText(phoneDigits, text) {
  const res = await fetch(`${url}/functions/v1/hyper-function`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to: phoneDigits, text }),
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON response */ }
  return { ok: res.ok, status: res.status, data };
}
