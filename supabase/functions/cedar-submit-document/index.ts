// cedar-submit-document
//
// Auto-pushes a freshly-uploaded customer compliance document to Cedar so
// Cedar's compliance team can re-validate without raising an RFI. Called from
// the frontend after a successful Supabase Storage upload of a customer doc.
//
// ⚠️  STUB MODE — As of 2026-05-11 the actual Cedar API endpoint + payload shape
// for refreshing business documents isn't documented in our local Cedar
// reference. Three things needed before wiring the real call:
//   1. Endpoint URL (likely PUT /v1/business/{id} or a dedicated docs endpoint)
//   2. Body shape: businessDocuments[] structure + field names per doc type
//   3. Mapping from our local doc_type values (id_front, address_proof,
//      bank_statement, ubo_attestation, sanctions_screening) to Cedar's
//      taxonomy (legalFormation, proofOfAddress, ownershipChart, proofOfFunds, etc.)
//
// Until Cedar docs land, this function:
//   - Builds the would-be payload from the doc + customer row
//   - Returns it in the response so frontend / logs can inspect what we'd send
//   - Marks customer_documents.submitted_to_cedar_at ONLY if Cedar accepts it
//     for real (currently never, so the timestamp never gets set in stub mode)
//
// To activate: replace the STUB block below with the real Cedar call and set
// CEDAR_SUBMIT_DOC_ENABLED=true in Supabase Edge Function secrets.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CEDAR_RELAY_URL = Deno.env.get("CEDAR_RELAY_URL") || "";
const CEDAR_RELAY_SECRET = Deno.env.get("CEDAR_RELAY_SECRET") || "";
const CEDAR_SUBMIT_DOC_ENABLED = (Deno.env.get("CEDAR_SUBMIT_DOC_ENABLED") || "").toLowerCase() === "true";

const cors = {
  "Access-Control-Allow-Origin": "https://xaepay.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Best-guess mapping from XaePay's compliance doc_types to Cedar's likely taxonomy.
// Adjust once Cedar's actual schema is known.
const CEDAR_DOC_TYPE_MAP: Record<string, string> = {
  id_front: "identityProof",
  id_back: "identityProof",
  selfie: "identityProof",
  address_proof: "proofOfAddress",
  bank_statement: "bankStatement",
  ubo_attestation: "ownershipChart",
  sanctions_screening: "sanctionsScreening",
  bvn_slip: "bvnSlip",
  other: "other",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });

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
      body: JSON.stringify({ p_bucket: `${rkey}:cedar-submit-document`, p_max_per_min: 30 }),
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

  let body: any = {};
  try { body = await req.json(); } catch {}
  const docId = body?.customer_document_id;
  if (!docId) return json(400, { error: "Missing customer_document_id" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: doc, error: docErr } = await admin
    .from("customer_documents")
    .select("id, customer_id, doc_type, storage_path, file_name, mime_type, issued_at, expires_at, submitted_to_cedar_at")
    .eq("id", docId)
    .single();
  if (docErr || !doc) return json(404, { error: "Document not found" });

  const { data: customer, error: cErr } = await admin
    .from("customers")
    .select("id, name, cedar_business_id, bdc_user_id")
    .eq("id", doc.customer_id)
    .single();
  if (cErr || !customer) return json(404, { error: "Customer not found" });

  // Skip if the customer isn't on Cedar yet — nothing to submit against.
  if (!customer.cedar_business_id) {
    return json(200, { ok: true, skipped: true, reason: "customer_not_on_cedar" });
  }

  // Build a signed Storage URL Cedar can fetch (24h validity — enough for them to ingest)
  const { data: signed, error: signErr } = await admin.storage
    .from("kyc-docs")
    .createSignedUrl(doc.storage_path, 60 * 60 * 24);
  if (signErr || !signed?.signedUrl) {
    return json(500, { error: "Could not generate signed URL", detail: signErr?.message });
  }

  // Would-be Cedar payload — shape based on best guess from project memory.
  // Replace with real Cedar schema once docs are available.
  const cedarPayload = {
    businessId: customer.cedar_business_id,
    documents: [{
      type: CEDAR_DOC_TYPE_MAP[doc.doc_type] || "other",
      localDocType: doc.doc_type,
      url: signed.signedUrl,
      fileName: doc.file_name,
      mimeType: doc.mime_type,
      issuedAt: doc.issued_at,
      expiresAt: doc.expires_at,
    }],
  };

  // === STUB =====================================================================
  // Flip CEDAR_SUBMIT_DOC_ENABLED=true and replace this block with the real Cedar
  // call once we have their endpoint + schema. Until then we log + return preview.
  if (!CEDAR_SUBMIT_DOC_ENABLED) {
    return json(200, {
      ok: true,
      stub: true,
      reason: "CEDAR_SUBMIT_DOC_ENABLED=false; Cedar endpoint not wired yet",
      proposed_endpoint: "PUT /v1/business/{id} (TBD)",
      proposed_payload: cedarPayload,
      doc_id: doc.id,
      customer_id: customer.id,
    });
  }
  // === END STUB =================================================================

  // Real Cedar call (placeholder — replace when endpoint known)
  if (!CEDAR_RELAY_URL || !CEDAR_RELAY_SECRET) {
    return json(500, { error: "CEDAR_RELAY_URL or CEDAR_RELAY_SECRET not configured" });
  }
  let cedarRes: Response;
  try {
    cedarRes = await fetch(`${CEDAR_RELAY_URL}/v1/business/${customer.cedar_business_id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${CEDAR_RELAY_SECRET}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(cedarPayload),
    });
  } catch (err) {
    return json(502, { error: "Cedar fetch failed", detail: String(err) });
  }

  let cedarBody: unknown = null;
  try { cedarBody = await cedarRes.json(); } catch {}

  if (!cedarRes.ok) {
    return json(cedarRes.status, { error: "Cedar rejected document update", cedar: cedarBody, payload: cedarPayload });
  }

  // Mark the doc as submitted to Cedar — only on real success.
  await admin.from("customer_documents")
    .update({ submitted_to_cedar_at: new Date().toISOString() })
    .eq("id", doc.id);

  return json(200, {
    ok: true,
    stub: false,
    cedar: cedarBody,
  });
});
