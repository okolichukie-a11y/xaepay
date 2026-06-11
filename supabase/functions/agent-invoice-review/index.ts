// agent-invoice-review
//
// Operator Agent — Job #6 (Invoice / Proforma Invoice Review).
// Fires when a customer or operator uploads an invoice (or proforma)
// on a cross-border quote. Internally calls compliance-review to extract
// supplier name, total, currency, line items, then drafts an Agent Inbox
// task summarising the extracted data + match against the quote +
// suggested action.
//
// Gated on operator_profiles.agent_mode. Idempotent on (quote_id) via
// supersede pattern — newer uploads replace older pending tasks.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const cors = {
  "Access-Control-Allow-Origin": "https://xaepay.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (s: number, b: unknown) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { error: "Server not configured" });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const quoteId = body?.quote_id;
  const uploadedBy = body?.uploaded_by || "unknown";
  if (!quoteId) return json(400, { error: "Missing quote_id" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: quote, error: qErr } = await admin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();
  if (qErr || !quote) return json(404, { error: "Quote not found" });

  const operatorUserId = quote.bdc_user_id;
  if (!operatorUserId) return json(200, { ok: true, skipped: true, reason: "no_operator" });

  const { data: profile } = await admin
    .from("operator_profiles")
    .select("agent_mode")
    .eq("auth_user_id", operatorUserId)
    .maybeSingle();
  if (!profile?.agent_mode) return json(200, { ok: true, skipped: true, reason: "agent_mode_off" });

  // Trigger compliance-review inline so we get extracted invoice data fresh.
  // It writes review_decision / review_reason / review_details to quote row.
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/compliance-review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_ROLE_KEY}`, "apikey": SERVICE_ROLE_KEY },
      body: JSON.stringify({ quote_id: quoteId }),
    });
  } catch (e) {
    console.error("compliance-review call failed:", e);
  }

  // Re-read the quote to get the freshly-written review fields.
  const { data: q2 } = await admin
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();
  const decision = q2?.review_decision || quote.review_decision;
  const reason = q2?.review_reason || quote.review_reason;
  const details = (q2?.review_details || quote.review_details || {}) as any;
  const extracted = (details?.extracted || {}) as any;

  // Supersede prior pending invoice_review tasks for this quote — only one
  // open invoice draft per quote at a time. Newer upload wins.
  await admin
    .from("agent_tasks")
    .update({ status: "superseded", reviewed_at: new Date().toISOString() })
    .eq("subject_type", "quote")
    .eq("subject_id", quoteId)
    .eq("job_type", "invoice_review")
    .eq("status", "pending_review");

  // Compute match status
  const quoteAmount = parseFloat(quote.amount as any);
  const invoiceTotal = parseFloat(extracted.total_amount as any);
  let matchStatus: "match" | "amount_mismatch" | "currency_mismatch" | "no_data" = "no_data";
  if (Number.isFinite(invoiceTotal) && extracted.currency) {
    const currencyOk = (extracted.currency || "").toUpperCase() === (quote.currency || "").toUpperCase();
    const amountDelta = Math.abs(invoiceTotal - quoteAmount);
    const amountOk = amountDelta < quoteAmount * 0.01; // 1% tolerance
    matchStatus = amountOk && currencyOk ? "match" : !currencyOk ? "currency_mismatch" : "amount_mismatch";
  }

  // Draft a brief action message for the operator
  let draftMessage = "";
  if (decision === "approved" && matchStatus === "match") {
    draftMessage = `Invoice review complete. Supplier ${extracted.vendor_name || "(unknown)"} · ${extracted.currency || quote.currency} ${(invoiceTotal || quoteAmount).toLocaleString()}. Matches quote ${quote.id.slice(0, 8).toUpperCase()}. Ready to proceed with the wire.`;
  } else if (decision === "flagged") {
    draftMessage = `Invoice flagged for review: ${reason || "see details"}. Recommend you check before proceeding — likely RFI risk if submitted as-is.`;
  } else if (decision === "rejected") {
    draftMessage = `Invoice rejected by compliance review: ${reason || "see details"}. Do not submit. Ask the customer for a corrected invoice.`;
  } else if (matchStatus === "amount_mismatch") {
    draftMessage = `Invoice total (${extracted.currency || ""} ${invoiceTotal}) doesn't match quote amount (${quote.currency} ${quoteAmount}). Confirm with customer which is correct.`;
  } else if (matchStatus === "currency_mismatch") {
    draftMessage = `Invoice currency (${extracted.currency}) doesn't match quote currency (${quote.currency}). Investigate before proceeding.`;
  } else {
    draftMessage = `Invoice uploaded by ${uploadedBy}. Compliance review status: ${decision || "in progress"}. Review the invoice attachment before proceeding.`;
  }

  const risk: "low" | "medium" | "high" =
    decision === "rejected" || matchStatus === "currency_mismatch" ? "high" :
    decision === "flagged" || matchStatus === "amount_mismatch" ? "medium" :
    "low";

  const { data: task, error: taskErr } = await admin.from("agent_tasks").insert({
    operator_user_id: operatorUserId,
    job_type: "invoice_review",
    subject_type: "quote",
    subject_id: quoteId,
    status: "pending_review",
    agent_output: {
      quote_ref: quote.id.slice(0, 8).toUpperCase(),
      uploaded_by: uploadedBy,
      invoice_url: quote.invoice_url,
      customer_name: quote.customer_name,
      quote_amount: quoteAmount,
      quote_currency: quote.currency,
      destination: quote.destination,
      beneficiary: quote.beneficiary,
      extracted_vendor: extracted.vendor_name,
      extracted_total: invoiceTotal,
      extracted_currency: extracted.currency,
      extracted_line_items: extracted.line_items,
      extracted_payment_terms: extracted.payment_terms,
      compliance_decision: decision,
      compliance_reason: reason,
      match_status: matchStatus,
      draft_message: draftMessage,
    },
    agent_reasoning: `Invoice uploaded by ${uploadedBy}. Compliance decision: ${decision || "pending"}. Match: ${matchStatus}.`,
    agent_risk_level: risk,
  }).select("id").single();

  if (taskErr) return json(500, { error: "Could not write agent task", detail: taskErr.message });
  return json(200, { ok: true, task_id: task.id, match_status: matchStatus, decision });
});
