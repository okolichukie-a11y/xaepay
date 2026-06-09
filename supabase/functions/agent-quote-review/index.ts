// agent-quote-review
//
// Operator Agent — Job #1 (Quote Review Drafting).
// Called when a customer submits a new quote request. Drafts a quote
// response (suggested rate + risk assessment + WhatsApp-ready message)
// and writes an `agent_tasks` row for the operator to approve.
//
// Only runs for operators with operator_profiles.agent_mode = true. If
// the operator hasn't enabled agent mode, returns 200 + skipped reason.
//
// Requires Supabase secret ANTHROPIC_API_KEY for the Claude draft call.
// Falls back to a heuristic draft if Anthropic is unavailable.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") || "";

const cors = {
  "Access-Control-Allow-Origin": "https://xaepay.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json(500, { error: "Server not configured" });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const quoteId = body?.quote_id;
  if (!quoteId) return json(400, { error: "Missing quote_id" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Read the quote
  const { data: quote, error: qErr } = await admin
    .from("quotes")
    .select("id, customer_id, customer_name, beneficiary, destination, amount, currency, purpose_note, invoice_url, operator_user_id, created_at")
    .eq("id", quoteId)
    .single();
  if (qErr || !quote) return json(404, { error: "Quote not found", detail: qErr?.message });

  if (!quote.operator_user_id) {
    return json(200, { ok: true, skipped: true, reason: "no_operator_assigned" });
  }

  // Gate on operator's agent_mode toggle
  const { data: profile } = await admin
    .from("operator_profiles")
    .select("agent_mode, default_outbound_markup, business_name")
    .eq("auth_user_id", quote.operator_user_id)
    .maybeSingle();
  if (!profile?.agent_mode) {
    return json(200, { ok: true, skipped: true, reason: "agent_mode_off_for_operator" });
  }

  // Skip if a pending task already exists for this quote (idempotency)
  const { data: existing } = await admin
    .from("agent_tasks")
    .select("id")
    .eq("subject_type", "quote")
    .eq("subject_id", quoteId)
    .eq("status", "pending_review")
    .maybeSingle();
  if (existing) {
    return json(200, { ok: true, skipped: true, reason: "task_already_pending", task_id: existing.id });
  }

  // Pull the existing compliance review if it exists (the AI Compliance Agent
  // might have already evaluated this invoice)
  const { data: review } = await admin
    .from("quotes")
    .select("review_decision, review_reason, review_details")
    .eq("id", quoteId)
    .maybeSingle();

  // Heuristic suggested rate — placeholder until live wholesale lookup wires in.
  // Uses ₦1,395/$ as a current wholesale anchor + operator's default markup.
  const WHOLESALE_ANCHOR = 1395;
  const operatorMarkup = parseFloat(profile.default_outbound_markup as any) || 5;
  const suggestedRate = WHOLESALE_ANCHOR + operatorMarkup;
  const ngnTotal = Math.round(parseFloat(quote.amount as any) * suggestedRate);

  // Risk level from compliance review or default low
  let risk: "low" | "medium" | "high" | "critical" = "low";
  if (review?.review_decision === "flagged") risk = "high";
  else if (review?.review_decision === "review") risk = "medium";

  // Draft the operator-facing message + customer-facing response
  let draftMessage = "";
  let reasoning = "";

  if (ANTHROPIC_API_KEY) {
    try {
      const prompt = `You are the XaePay Operator Agent. Draft a brief WhatsApp-ready quote response message for the operator to send to a customer. Keep it under 60 words, professional, friendly.

Quote details:
- Customer: ${quote.customer_name || "the customer"}
- Amount: ${quote.currency} ${quote.amount}
- Destination: ${quote.destination || "(not specified)"}
- Beneficiary: ${quote.beneficiary || "(not specified)"}
- Purpose: ${quote.purpose_note || "(not provided)"}
- Suggested rate: ₦${suggestedRate.toLocaleString()}/$
- NGN total: ₦${ngnTotal.toLocaleString()}
- Compliance review: ${review?.review_decision || "pending"} ${review?.review_reason ? `(${review.review_reason})` : ""}

Output ONLY the draft message text. No preamble.`;

      const aRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 400,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (aRes.ok) {
        const aData = await aRes.json();
        draftMessage = aData?.content?.[0]?.text?.trim() || "";
        reasoning = `Claude Haiku draft based on amount ${quote.currency} ${quote.amount}, destination ${quote.destination || "n/a"}, compliance status ${review?.review_decision || "pending"}.`;
      }
    } catch (err) {
      console.error("Claude call failed:", err);
    }
  }

  // Fallback heuristic draft if no API key or call failed
  if (!draftMessage) {
    draftMessage = `Hi ${quote.customer_name || "there"} — your quote for ${quote.currency} ${quote.amount} to ${quote.destination || "your beneficiary"} is ready.\n\nLocked rate: ₦${suggestedRate.toLocaleString()}/$ · NGN total: ₦${ngnTotal.toLocaleString()}\n\nThis rate holds for 4 minutes. Reply CONFIRM to lock it in.`;
    reasoning = "Heuristic draft (Anthropic unavailable). Rate suggested from wholesale anchor + your default markup.";
  }

  // Insert the agent task
  const { data: task, error: taskErr } = await admin.from("agent_tasks").insert({
    operator_user_id: quote.operator_user_id,
    job_type: "quote_review",
    subject_type: "quote",
    subject_id: quote.id,
    status: "pending_review",
    agent_output: {
      suggested_rate: suggestedRate,
      ngn_total: ngnTotal,
      wholesale_anchor: WHOLESALE_ANCHOR,
      markup: operatorMarkup,
      draft_message: draftMessage,
      customer_name: quote.customer_name,
      amount: quote.amount,
      currency: quote.currency,
      destination: quote.destination,
      compliance_review: review?.review_decision || null,
    },
    agent_reasoning: reasoning,
    agent_risk_level: risk,
  }).select("id").single();

  if (taskErr) return json(500, { error: "Could not write agent task", detail: taskErr.message });

  return json(200, {
    ok: true,
    task_id: task.id,
    risk,
    suggested_rate: suggestedRate,
    ngn_total: ngnTotal,
  });
});
