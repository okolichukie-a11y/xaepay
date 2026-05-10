// compliance-watchman
//
// Scans the calling operator's customers for missing / expiring / expired
// compliance documents and creates notification rows so the operator can act.
// Idempotent — safe to re-run any number of times:
//   - New issues become new notifications
//   - Cleared issues resolve the corresponding open notifications
//   - Existing open notifications aren't duplicated (uq_notifications_open partial index)
//
// V2: triggered manually by the operator from the dashboard. V3 will move to
// pg_cron-scheduled daily runs that also fire email + WhatsApp reminders and
// auto-submit fresh docs to Cedar.
//
// Auth: caller must be a signed-in operator. Only their customers are scanned.
//
// Required env vars (already configured in Supabase):
// - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const cors = {
  "Access-Control-Allow-Origin": "https://xaepay.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Mirror of COMPLIANCE_DOC_REQUIREMENTS in src/XaePay.jsx. Keep in sync.
// V3 should move to a shared `compliance_doc_requirements` config table.
const REQUIREMENTS: Record<string, Array<{ docType: string; label: string; refreshDays: number | null }>> = {
  basic: [],
  standard: [
    { docType: "id_front", label: "Photo ID", refreshDays: null },
  ],
  verified: [
    { docType: "id_front", label: "Photo ID", refreshDays: null },
    { docType: "address_proof", label: "Proof of address", refreshDays: 90 },
  ],
  documented: [
    { docType: "id_front", label: "Photo ID", refreshDays: null },
    { docType: "address_proof", label: "Proof of address", refreshDays: 90 },
    { docType: "bank_statement", label: "Bank statement", refreshDays: 60 },
  ],
  pro: [
    { docType: "id_front", label: "Photo ID", refreshDays: null },
    { docType: "address_proof", label: "Proof of address", refreshDays: 90 },
    { docType: "bank_statement", label: "Bank statement", refreshDays: 60 },
    { docType: "ubo_attestation", label: "UBO / beneficial owner attestation", refreshDays: 365 },
    { docType: "sanctions_screening", label: "Sanctions screening", refreshDays: 30 },
  ],
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });

function docStatus(doc: any, refreshDays: number | null): "missing" | "valid" | "expiring_soon" | "expired" {
  if (!doc) return "missing";
  if (refreshDays == null) return "valid";
  let expiresAt: Date | null = doc.expires_at ? new Date(doc.expires_at) : null;
  if (!expiresAt && doc.issued_at) {
    expiresAt = new Date(new Date(doc.issued_at).getTime() + refreshDays * 86400000);
  }
  if (!expiresAt) return "valid";
  const days = Math.floor((expiresAt.getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 14) return "expiring_soon";
  return "valid";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
    return json(500, { error: "Server not configured" });
  }

  // === RATE LIMIT ===
  {
    const ah = req.headers.get("Authorization") || "";
    let rkey = "anon";
    if (ah.startsWith("Bearer ")) {
      try { rkey = `user:${JSON.parse(atob(ah.slice(7).split(".")[1])).sub}`; } catch {}
    }
    if (rkey === "anon") rkey = `ip:${(req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown"}`;
    const rRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/rate_limit_check`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": SERVICE_ROLE_KEY, "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
      body: JSON.stringify({ p_bucket: `${rkey}:compliance-watchman`, p_max_per_min: 10 }),
    });
    if ((await rRes.json()) === false) {
      return json(429, { error: "Rate limit exceeded — try again in a minute" });
    }
  }

  // Auth
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) return json(401, { error: "Missing Bearer token" });
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: "Invalid session" });
  const userId = userData.user.id;

  // Service role client for cross-RLS writes to notifications
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Optional tier override from request body. Default = pro (most comprehensive scan).
  let body: any = {};
  try { body = await req.json(); } catch {}
  const tier = (body?.tier as string) || "pro";
  const reqs = REQUIREMENTS[tier] || [];

  // Fetch operator's customers
  const { data: customers, error: cErr } = await admin
    .from("customers")
    .select("id, name")
    .eq("bdc_user_id", userId);
  if (cErr) return json(500, { error: cErr.message });
  if (!customers || customers.length === 0) {
    return json(200, { ok: true, scanned: 0, created: 0, resolved: 0, tier });
  }

  let created = 0;
  let resolved = 0;

  for (const c of customers) {
    const { data: docs } = await admin
      .from("customer_documents")
      .select("doc_type, issued_at, expires_at")
      .eq("customer_id", c.id);
    const docsByType: Record<string, any> = {};
    for (const d of docs || []) {
      const existing = docsByType[d.doc_type];
      if (!existing) {
        docsByType[d.doc_type] = d;
      } else {
        const exp1 = existing.expires_at || existing.issued_at || "";
        const exp2 = d.expires_at || d.issued_at || "";
        if (exp2 > exp1) docsByType[d.doc_type] = d;
      }
    }

    for (const r of reqs) {
      const d = docsByType[r.docType];
      const status = docStatus(d, r.refreshDays);

      if (status === "valid") {
        const { count } = await admin.from("notifications")
          .update({
            status: "resolved",
            resolved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { count: "exact" })
          .eq("user_id", userId)
          .eq("subject_type", "customer")
          .eq("subject_id", c.id)
          .eq("doc_type", r.docType)
          .eq("status", "open");
        if (count) resolved += count;
        continue;
      }

      const kindMap = {
        missing: "compliance_doc_missing",
        expiring_soon: "compliance_doc_expiring",
        expired: "compliance_doc_expired",
      } as const;
      const severityMap = {
        missing: "warn",
        expiring_soon: "warn",
        expired: "error",
      } as const;
      const customerName = c.name || "Customer";
      const title = status === "missing"
        ? `${customerName} — missing ${r.label}`
        : status === "expiring_soon"
        ? `${customerName} — ${r.label} expiring soon`
        : `${customerName} — ${r.label} expired`;
      const bodyText = status === "missing"
        ? `Required by the ${tier} tier. Upload via the customer drawer.`
        : status === "expiring_soon"
        ? `Refresh soon — refresh cadence is ${r.refreshDays} days.`
        : `This document has expired and must be refreshed before transacting at the ${tier} tier.`;

      const { error } = await admin.from("notifications").insert({
        user_id: userId,
        kind: kindMap[status],
        subject_type: "customer",
        subject_id: c.id,
        doc_type: r.docType,
        required_tier: tier,
        severity: severityMap[status],
        title,
        body: bodyText,
      });
      // Conflict on the unique partial index = an open notification already exists,
      // which is fine. Only count fresh inserts.
      if (!error) created++;
    }
  }

  return json(200, {
    ok: true,
    scanned: customers.length,
    created,
    resolved,
    tier,
  });
});
