// agent-kyc-chase
//
// Operator Agent — Job #2 (KYC Document Chasing).
// Triggered for each open compliance notification (missing/expiring doc).
// Drafts a personalized WhatsApp + email asking the customer for the
// specific document. Writes an `agent_tasks` row for the operator to
// approve before the message sends.
//
// Gated on operator_profiles.agent_mode = true. No-op otherwise.
// Idempotent — won't double-create a pending task for the same notif.

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
  const notificationId = body?.notification_id;
  if (!notificationId) return json(400, { error: "Missing notification_id" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: notif, error: nErr } = await admin
    .from("notifications")
    .select("*")
    .eq("id", notificationId)
    .single();
  if (nErr || !notif) return json(404, { error: "Notification not found" });

  if (notif.status !== "open") {
    return json(200, { ok: true, skipped: true, reason: "notification_not_open" });
  }
  if (notif.subject_type !== "customer" || !notif.subject_id) {
    return json(200, { ok: true, skipped: true, reason: "not_a_customer_notification" });
  }

  const operatorUserId = notif.user_id;
  if (!operatorUserId) return json(200, { ok: true, skipped: true, reason: "no_operator" });

  const { data: profile } = await admin
    .from("operator_profiles")
    .select("agent_mode, business_name")
    .eq("auth_user_id", operatorUserId)
    .maybeSingle();
  if (!profile?.agent_mode) {
    return json(200, { ok: true, skipped: true, reason: "agent_mode_off" });
  }

  // Idempotency — skip if a pending task already exists for this notification
  const { data: existing } = await admin
    .from("agent_tasks")
    .select("id")
    .eq("subject_type", "notification")
    .eq("subject_id", notificationId)
    .eq("status", "pending_review")
    .maybeSingle();
  if (existing) {
    return json(200, { ok: true, skipped: true, reason: "task_already_pending" });
  }

  const { data: customer } = await admin
    .from("customers")
    .select("name, business_name, email, phone, type")
    .eq("id", notif.subject_id)
    .maybeSingle();
  if (!customer) return json(404, { error: "Customer not found" });

  const customerName = customer.business_name || customer.name || "Customer";
  const urgency = notif.severity === "error" ? "high" : notif.severity === "warn" ? "medium" : "low";

  let draftWa = "";
  let draftEmailSubject = "";
  let draftEmailBody = "";
  let reasoning = "";

  if (ANTHROPIC_API_KEY) {
    try {
      const prompt = `You are the XaePay Operator Agent. Draft two messages (WhatsApp + email) asking a customer to upload or refresh a compliance document. Keep WhatsApp under 70 words, friendly, professional. Email should have a short subject line + body under 120 words. Mention the specific document needed.

Customer: ${customerName}
Issue: ${notif.title}
Detail: ${notif.body || "(no extra detail)"}
Urgency: ${urgency}

Output ONLY valid JSON with this exact shape, no preamble:
{"whatsapp": "...", "email_subject": "...", "email_body": "..."}`;

      const aRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 600, messages: [{ role: "user", content: prompt }] }),
      });
      if (aRes.ok) {
        const aData = await aRes.json();
        const text = aData?.content?.[0]?.text?.trim() || "";
        try {
          const parsed = JSON.parse(text);
          draftWa = parsed.whatsapp || "";
          draftEmailSubject = parsed.email_subject || "";
          draftEmailBody = parsed.email_body || "";
        } catch {
          draftWa = text;
        }
        reasoning = `Claude Haiku draft for ${notif.title}. Urgency ${urgency}.`;
      }
    } catch (err) {
      console.error("Claude call failed:", err);
    }
  }

  if (!draftWa) {
    draftWa = `Hi ${customerName} — quick compliance check: ${notif.title}. ${notif.body || ""} Could you upload the document at your earliest convenience? Thanks!`;
    draftEmailSubject = `Action needed: ${notif.title}`;
    draftEmailBody = `Hi ${customerName},\n\n${notif.title}\n\n${notif.body || ""}\n\nPlease upload the requested document via your portal at your earliest convenience.\n\nThanks,\nXaePay`;
    reasoning = "Heuristic draft (Anthropic unavailable).";
  }

  const { data: task, error: taskErr } = await admin.from("agent_tasks").insert({
    operator_user_id: operatorUserId,
    job_type: "kyc_chase",
    subject_type: "notification",
    subject_id: notificationId,
    status: "pending_review",
    agent_output: {
      customer_id: notif.subject_id,
      customer_name: customerName,
      customer_email: customer.email,
      customer_phone: customer.phone,
      notif_title: notif.title,
      notif_body: notif.body,
      urgency,
      draft_message: draftWa,
      draft_email_subject: draftEmailSubject,
      draft_email_body: draftEmailBody,
    },
    agent_reasoning: reasoning,
    agent_risk_level: urgency === "high" ? "medium" : "low",
  }).select("id").single();

  if (taskErr) return json(500, { error: "Could not write agent task", detail: taskErr.message });
  return json(200, { ok: true, task_id: task.id });
});
