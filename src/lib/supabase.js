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

// Live wholesale rate quote from Cedar Money via the cedar-rate Edge Function (which
// goes through our static-IP Fly relay). Returns { ok, data } where data is Cedar's
// price response: { fromCurrencySymbol, toCurrencySymbol, rate, amount }.
//
// Outbound flow: pass fromCurrencySymbol="NGN", toCurrencySymbol="USD" (or GBP/EUR),
// toAmount=foreign-currency payout amount → returns NGN/$ rate + NGN deposit amount.
//
// Inbound flow: same shape, just flipped — fromCurrencySymbol=foreign, toCurrencySymbol="NGN".
export async function fetchCedarRate({ fromCurrencySymbol, toCurrencySymbol, toAmount }) {
  try {
    const res = await fetch(`${url}/functions/v1/cedar-rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromCurrencySymbol, toCurrencySymbol, toAmount: String(toAmount) }),
    });
    let payload = null;
    try { payload = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok && !!payload?.data?.rate, data: payload?.data || null };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("fetchCedarRate failed:", err);
    return { ok: false, data: null };
  }
}
