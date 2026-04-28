// WhatsApp Business webhook (Vercel serverless function)
//
// GET  → Meta's verification handshake (during webhook subscription)
// POST → Incoming events (messages, status updates). For text messages matching
//        "YES QU-XXXX", we look up the matching pending quote and call the
//        approve_quote RPC. The BDC dashboard's polling picks up the change.
//
// Env vars (set in Vercel):
//   WHATSAPP_VERIFY_TOKEN  — string we share with Meta during subscription
//   WHATSAPP_APP_SECRET    — Meta app secret, for signature verification
//   VITE_SUPABASE_URL      — already set
//   VITE_SUPABASE_ANON_KEY — already set
import crypto from "node:crypto";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Disable Vercel's automatic body parser so we can verify Meta's raw-body signature.
export const config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function callRpc(fn, params) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`RPC ${fn} failed: ${res.status} ${errText}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  // ── Verification handshake ────────────────────────────────────────────
  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).send("Forbidden");
    return;
  }

  // ── Incoming event ────────────────────────────────────────────────────
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const raw = await readRawBody(req);

  // Verify Meta signature when APP_SECRET is configured
  if (APP_SECRET) {
    const sig = req.headers["x-hub-signature-256"];
    if (!sig) { res.status(401).send("Missing signature"); return; }
    const expected = "sha256=" + crypto.createHmac("sha256", APP_SECRET).update(raw).digest("hex");
    const ok = sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) { res.status(401).send("Invalid signature"); return; }
  }

  let body;
  try { body = JSON.parse(raw); } catch { res.status(400).send("Bad JSON"); return; }

  // Always log for debugging — visible in Vercel function logs.
  // eslint-disable-next-line no-console
  console.log("WhatsApp webhook event:", JSON.stringify(body).slice(0, 800));

  // Walk the message envelope. Meta nests deep.
  try {
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        for (const message of value.messages || []) {
          if (message.type !== "text") continue;
          const from = message.from || ""; // intl format, no '+'
          const text = (message.text?.body || "").trim();

          // Look for "YES QU-XXXX" or just "YES QUXXXX" — flexible
          const m = text.match(/(?:^|\s)YES[\s-]+QU[-\s]?([0-9A-F]{4,})/i);
          if (!m) continue;
          const ref = m[1].toLowerCase();

          const quoteId = await callRpc("lookup_pending_quote_by_ref", { p_ref: ref, p_phone: from });
          if (!quoteId) continue;
          await callRpc("approve_quote", { p_token: quoteId });
          // eslint-disable-next-line no-console
          console.log(`Auto-approved quote ${quoteId} from ${from}`);
        }
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Webhook processing error:", err);
    // Still return 200 — Meta will retry indefinitely if we 5xx.
  }

  res.status(200).json({ ok: true });
}
