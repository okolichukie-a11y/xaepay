// agent-payment-match
//
// Operator Agent — Job #4 (Payment Matching).
// Triggered after a customer uploads "I've paid" proof on an invoice.
// Uses Claude Haiku's vision to extract amount + date + reference from
// the proof image, compares against the expected invoice total, and
// drafts either a "payment confirmed" reply or a discrepancy flag.
//
// Writes an agent_tasks row for the operator to approve before any
// state change (status flip to "paid" remains operator's call).
//
// Gated on operator_profiles.agent_mode = true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

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
  const invoicePaymentId = body?.invoice_payment_id;
  if (!invoicePaymentId) return json(400, { error: "Missing invoice_payment_id" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: payment, error: pErr } = await admin
    .from("invoice_payments")
    .select("*")
    .eq("id", invoicePaymentId)
    .single();
  if (pErr || !payment) return json(404, { error: "Payment not found", detail: pErr?.message });

  const { data: invoice } = await admin
    .from("invoices")
    .select("id, invoice_number, total, currency, operator_user_id, customer_name")
    .eq("id", payment.invoice_id)
    .maybeSingle();
  if (!invoice) return json(404, { error: "Invoice not found" });

  const operatorUserId = invoice.operator_user_id;
  if (!operatorUserId) return json(200, { ok: true, skipped: true, reason: "no_operator" });

  const { data: profile } = await admin
    .from("operator_profiles")
    .select("agent_mode")
    .eq("auth_user_id", operatorUserId)
    .maybeSingle();
  if (!profile?.agent_mode) return json(200, { ok: true, skipped: true, reason: "agent_mode_off" });

  const { data: existing } = await admin
    .from("agent_tasks")
    .select("id")
    .eq("subject_type", "invoice_payment")
    .eq("subject_id", invoicePaymentId)
    .eq("status", "pending_review")
    .maybeSingle();
  if (existing) return json(200, { ok: true, skipped: true, reason: "task_already_pending" });

  const expectedAmount = parseFloat(invoice.total as any);
  const claimedAmount = parseFloat(payment.amount as any) || 0;
  const proofUrl = payment.proof_url;

  let extracted: any = {};
  let matchStatus: "match" | "amount_mismatch" | "unreadable" | "no_proof" = "no_proof";
  let reasoning = "";

  if (proofUrl && ANTHROPIC_API_KEY) {
    try {
      const prompt = `You're inspecting a payment proof image (a bank transfer receipt or screenshot). Extract these fields if present:
- amount paid (number)
- currency (NGN/USD/etc)
- date of transfer
- transaction reference / sender name

The expected payment was ${invoice.currency} ${expectedAmount} for invoice ${invoice.invoice_number} from ${invoice.customer_name}.

Output ONLY valid JSON, no preamble:
{"amount": number_or_null, "currency": string_or_null, "date": string_or_null, "reference": string_or_null, "readable": boolean}`;

      const aRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "url", url: proofUrl } },
              { type: "text", text: prompt },
            ],
          }],
        }),
      });
      if (aRes.ok) {
        const aData = await aRes.json();
        const text = aData?.content?.[0]?.text?.trim() || "{}";
        // Strip optional markdown fences before parsing
        const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
        try { extracted = JSON.parse(cleaned); } catch { extracted = {}; }
        if (!extracted.readable) {
          matchStatus = "unreadable";
        } else if (extracted.amount != null) {
          const delta = Math.abs(extracted.amount - expectedAmount);
          if (delta < expectedAmount * 0.005) {
            matchStatus = "match";
          } else {
            matchStatus = "amount_mismatch";
          }
        }
        reasoning = `Claude Haiku vision extracted: amount=${extracted.amount}, currency=${extracted.currency}, ref=${extracted.reference}. Expected ${invoice.currency} ${expectedAmount}.`;
      }
    } catch (err) {
      console.error("Claude vision failed:", err);
      matchStatus = "unreadable";
      reasoning = "Vision call failed; couldn't extract from proof image.";
    }
  } else if (!proofUrl) {
    // No image — fall back to claimed-amount comparison only
    const delta = Math.abs(claimedAmount - expectedAmount);
    matchStatus = delta < expectedAmount * 0.005 ? "match" : "amount_mismatch";
    reasoning = "No proof image — comparison based on customer-declared amount only.";
  }

  // Draft message
  let draftMessage = "";
  if (matchStatus === "match") {
    draftMessage = `Hi ${invoice.customer_name} — confirming we've received your payment of ${invoice.currency} ${expectedAmount} for invoice ${invoice.invoice_number}. Your receipt is on the way.`;
  } else if (matchStatus === "amount_mismatch") {
    draftMessage = `Hi ${invoice.customer_name} — we received ${extracted.currency || invoice.currency} ${extracted.amount || claimedAmount} but the invoice ${invoice.invoice_number} total is ${invoice.currency} ${expectedAmount}. Could you confirm whether this is the full payment or send the balance? Thanks.`;
  } else {
    draftMessage = `Payment proof received for invoice ${invoice.invoice_number} but couldn't be auto-verified. Please review manually.`;
  }

  const risk: "low" | "medium" | "high" = matchStatus === "match" ? "low" : matchStatus === "amount_mismatch" ? "medium" : "high";

  const { data: task, error: taskErr } = await admin.from("agent_tasks").insert({
    operator_user_id: operatorUserId,
    job_type: "payment_match",
    subject_type: "invoice_payment",
    subject_id: invoicePaymentId,
    status: "pending_review",
    agent_output: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customer_name,
      expected_amount: expectedAmount,
      claimed_amount: claimedAmount,
      currency: invoice.currency,
      proof_url: proofUrl,
      extracted,
      match_status: matchStatus,
      draft_message: draftMessage,
    },
    agent_reasoning: reasoning,
    agent_risk_level: risk,
  }).select("id").single();

  if (taskErr) return json(500, { error: "Could not write agent task", detail: taskErr.message });
  return json(200, { ok: true, task_id: task.id, match_status: matchStatus });
});
