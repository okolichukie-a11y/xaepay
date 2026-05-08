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

// Send a WhatsApp template message via hyper-function. Templates are the only
// message type Meta delivers (a) from a Test Number, (b) outside the 24h
// session window, or (c) before business verification — so this is what we
// use for first-contact messages to customers. Custom templates must be
// pre-approved in WhatsApp Manager. Default `hello_world` is always available
// for pipeline testing.
//
// `components` is an optional array shaping the Cloud API payload, e.g.:
//   [{ type: "body", parameters: [{ type: "text", text: "QU-1234" }, ...] }]
export async function sendWhatsAppTemplate(phoneDigits, templateName = "hello_world", language = "en_US", components = null) {
  const body = { to: phoneDigits, template: templateName, language };
  if (components) body.components = components;
  const res = await fetch(`${url}/functions/v1/hyper-function`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* non-JSON */ }
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
// Submit a customer (already saved in our customers table) to Cedar's create-merchant
// endpoint via the cedar-create-customer Edge Function. The function reads the row,
// validates the Cedar-required fields, calls Cedar via the relay, and persists the
// returned cedar_business_id + cedar_kyc_status back to the row. Idempotent: if the
// customer already has a cedar_business_id, returns that without re-calling Cedar.
//
// Returns { ok, status, data }. On 400 with `missing` array, the caller should surface
// those field names so the operator can fill them in.
export async function submitCustomerToCedar(customerId) {
  try {
    const res = await fetch(`${url}/functions/v1/cedar-create-customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("submitCustomerToCedar failed:", err);
    return { ok: false, status: 0, data: null };
  }
}

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

// Submit a recipient (target merchant — supplier abroad) to Cedar via the
// cedar-create-recipient Edge Function. Same idempotent pattern as
// submitCustomerToCedar: function reads the row, validates Cedar-required
// fields, calls Cedar via the relay, persists cedar_business_id + cedar_kyc_status
// back to the row. Includes the anon key so it works whether or not the function
// is deployed with verify_jwt enabled.
export async function submitRecipientToCedar(recipientId) {
  try {
    const res = await fetch(`${url}/functions/v1/cedar-create-recipient`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({ recipientId }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("submitRecipientToCedar failed:", err);
    return { ok: false, status: 0, data: null };
  }
}

// Submit a recipient_external_accounts row (a bank account on a recipient) to
// Cedar via cedar-create-receiver-account. Same idempotent pattern.
export async function submitReceiverAccountToCedar(accountId) {
  try {
    const res = await fetch(`${url}/functions/v1/cedar-create-receiver-account`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({ accountId }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("submitReceiverAccountToCedar failed:", err);
    return { ok: false, status: 0, data: null };
  }
}

// Submit a quote (already saved in our quotes table) to Cedar's send-fiat-to-fiat
// endpoint via cedar-create-transaction. The Edge Function validates that the
// chosen customer is Cedar-VALID and the chosen receiver account is ACTIVE,
// then calls Cedar and writes back cedar_business_request_id + status.
export async function submitCedarTransaction({ quoteId, customerId, recipientExternalAccountId, purpose, invoiceUrl }) {
  try {
    const res = await fetch(`${url}/functions/v1/cedar-create-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({ quoteId, customerId, recipientExternalAccountId, purpose, invoiceUrl }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("submitCedarTransaction failed:", err);
    return { ok: false, status: 0, data: null };
  }
}

// Approve a Cedar sendf2f quote that's in OnOff_AWAITING_QUOTE_APPROVAL.
// Cedar locks the rate and returns deposit bank details, which the Edge
// Function persists to the quote row (cedar_bank_details, cedar_quote_rate,
// cedar_deposit_amount_minor).
export async function approveCedarQuote(quoteId) {
  try {
    const res = await fetch(`${url}/functions/v1/cedar-approve-quote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({ quoteId }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("approveCedarQuote failed:", err);
    return { ok: false, status: 0, data: null };
  }
}

// Confirm the customer's NGN deposit was received. Calls cedar-approve-deposit
// which forwards to Cedar POST /v1/sendf2f/approveDeposit/{id} with the slip URL.
// On success the request advances to OnOff_IN_PROGRESS and Cedar starts the payout.
export async function confirmCedarDeposit({ quoteId, depositConfirmationUrl }) {
  try {
    const res = await fetch(`${url}/functions/v1/cedar-approve-deposit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({ quoteId, depositConfirmationUrl }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("confirmCedarDeposit failed:", err);
    return { ok: false, status: 0, data: null };
  }
}

// Upload a file directly to Cedar Money's /v1/files/upload endpoint via the
// cedar-upload-file Edge Function (which forwards through the Fly relay).
// Cedar holds a server-side copy and returns a URL valid for ~7 days. Used so
// invoice + deposit-slip references on transactions point at Cedar's hosted
// copy, not just our Supabase Storage public URL.
export async function uploadFileToCedar(file) {
  if (!file) return { ok: false, error: "No file selected" };
  if (file.size > 15 * 1024 * 1024) {
    return { ok: false, error: "File too large (max 15 MB)" };
  }
  try {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) return { ok: false, error: "Not signed in" };
    const fd = new FormData();
    fd.append("file", file, file.name || "upload");
    const res = await fetch(`${url}/functions/v1/cedar-upload-file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
      },
      body: fd,
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    if (!res.ok) {
      return { ok: false, status: res.status, error: data?.error || `HTTP ${res.status}`, cedar: data?.cedar };
    }
    return { ok: true, url: data?.url || null, cedar: data?.cedar || null };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("uploadFileToCedar failed:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

// Convenience: upload to BOTH Supabase Storage (our copy, public URL for the
// operator/customer to view immediately) AND Cedar (server-side hosted by
// Cedar for /v1/sendf2f and approveDeposit references). Returns both URLs;
// caller decides which to persist where.
export async function uploadFileBoth(file, category = "misc") {
  const [storage, cedar] = await Promise.all([
    uploadCedarFile(file, category),
    uploadFileToCedar(file),
  ]);
  return {
    ok: storage.ok || cedar.ok,
    supabaseUrl: storage.ok ? storage.url : null,
    supabasePath: storage.ok ? storage.path : null,
    cedarUrl: cedar.ok ? cedar.url : null,
    storageError: storage.ok ? null : storage.error,
    cedarError: cedar.ok ? null : cedar.error,
  };
}

// Upload a file (invoice, deposit slip, etc.) to the public `cedar-files`
// Storage bucket and return its public URL. Caller passes a category so the
// path is segmented sensibly (`invoices/`, `deposits/`, etc.). 10 MB cap.
export async function uploadCedarFile(file, category = "misc") {
  if (!file) return { ok: false, error: "No file selected" };
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false, error: "File too large (max 10 MB)" };
  }
  // Sanitize filename — keep extension visible for humans, prefix with random uuid
  // so paths are unguessable and never collide.
  const safeBase = (file.name || "file").replace(/[^\w.-]/g, "_").slice(0, 80);
  const id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now());
  const path = `${category}/${id}-${safeBase}`;
  const { error } = await supabase.storage
    .from("cedar-files")
    .upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) {
    // eslint-disable-next-line no-console
    console.error("uploadCedarFile failed:", error);
    return { ok: false, error: error.message };
  }
  const { data } = supabase.storage.from("cedar-files").getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}

// Sanitize a URL before using it in <a href>. Rejects javascript:, data:,
// vbscript: and anything that doesn't start with http(s)/mailto/relative path.
// Operators paste URLs into invoice_url / deposit_slip_url etc. — without this
// a malicious operator (or compromised account) could XSS another operator
// who clicks the rendered link in TxDrawer / Compliance panel.
export function safeUrl(value) {
  if (!value || typeof value !== "string") return "#";
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("vbscript:") || lower.startsWith("file:")) return "#";
  if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:") || lower.startsWith("/")) return trimmed;
  return "#";
}

// Insert a row into audit_events. Fire-and-forget — never blocks operator
// flow. Used on every action that touches money or compliance: submit-to-cedar,
// approve quote, confirm deposit, cancel transaction, override compliance.
export async function logAuditEvent(action, entityType, entityId, metadata = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("audit_events").insert({
      user_id: user.id,
      user_email: user.email || null,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata || null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 500) : null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("logAuditEvent failed (non-blocking):", err);
  }
}

// Send an email via the send-email Edge Function (which forwards to Resend).
// Caller passes { to, subject, html?, text?, replyTo? }. Returns { ok, status, data }.
// Used for customer-facing quote notifications + deposit instructions, and
// later for operator-facing approval/status alerts. Meta-independent — works
// regardless of WhatsApp business verification state.
export async function sendEmail({ to, subject, html, text, replyTo }) {
  try {
    const res = await fetch(`${url}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({ to, subject, html, text, replyTo }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("sendEmail failed:", err);
    return { ok: false, status: 0, data: null };
  }
}

// Run the tier-aware compliance review for a quote. Edge Function persists
// the decision (approved | flagged | rejected) + per-check details back
// to the quote row. Caller can subscribe via realtime to see the result
// flow in, or read the response directly. Auto-fired after invoice uploads
// and on demand from the operator's TxDrawer.
export async function runComplianceReview(quoteId, tier) {
  try {
    const body = { quoteId };
    if (tier) body.tier = tier;
    const res = await fetch(`${url}/functions/v1/compliance-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify(body),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("runComplianceReview failed:", err);
    return { ok: false, status: 0, data: null };
  }
}

// Cancel a Cedar sendf2f request. Cedar accepts cancellation from any
// non-terminal state. Reason is required; otherReason is required when
// reason="OTHER".
export async function cancelCedarTransaction({ quoteId, reason, otherReason }) {
  try {
    const res = await fetch(`${url}/functions/v1/cedar-cancel-transaction`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${anonKey}`,
        "apikey": anonKey,
      },
      body: JSON.stringify({ quoteId, reason, otherReason }),
    });
    let data = null;
    try { data = await res.json(); } catch { /* non-JSON */ }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("cancelCedarTransaction failed:", err);
    return { ok: false, status: 0, data: null };
  }
}
