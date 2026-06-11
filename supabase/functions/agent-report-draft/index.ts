// agent-report-draft
//
// Operator Agent — Job #5 (Report Drafting).
// Called after the operator generates a monthly or quarterly regulatory
// report. Reads the report metadata, drafts a summary email to the
// operator's compliance officer (or any configured recipient), and
// surfaces noteworthy patterns. Writes an agent_tasks row for the
// operator to approve before any email is sent.
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
  const reportId = body?.report_id;
  if (!reportId) return json(400, { error: "Missing report_id" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const { data: report, error: rErr } = await admin
    .from("regulatory_reports")
    .select("*")
    .eq("id", reportId)
    .single();
  if (rErr || !report) return json(404, { error: "Report not found", detail: rErr?.message });

  const operatorUserId = report.operator_user_id;
  if (!operatorUserId) return json(200, { ok: true, skipped: true, reason: "no_operator" });

  const { data: profile } = await admin
    .from("operator_profiles")
    .select("agent_mode, business_name, business_email")
    .eq("auth_user_id", operatorUserId)
    .maybeSingle();
  if (!profile?.agent_mode) return json(200, { ok: true, skipped: true, reason: "agent_mode_off" });

  const { data: existing } = await admin
    .from("agent_tasks")
    .select("id")
    .eq("subject_type", "report")
    .eq("subject_id", reportId)
    .eq("status", "pending_review")
    .maybeSingle();
  if (existing) return json(200, { ok: true, skipped: true, reason: "task_already_pending" });

  const meta = (report.metadata || {}) as any;
  const reportTypeLabel = report.report_type === "monthly_transactions" ? "Monthly Transaction Report" : "Quarterly Customer Activity Report";

  let draftSubject = "";
  let draftBody = "";
  let reasoning = "";

  if (ANTHROPIC_API_KEY) {
    try {
      const prompt = `You are the XaePay Operator Agent. Draft a short formal email a compliance officer can send (or forward to CBN/SCUML/NFIU) along with the attached regulatory report. Keep subject under 80 chars; body under 180 words. Be matter-of-fact, no marketing tone.

Report: ${reportTypeLabel}
Period: ${report.period_label}
Operator: ${profile.business_name || "the operator"}
Key metrics: ${JSON.stringify(meta).slice(0, 600)}

Output ONLY valid JSON, no preamble:
{"subject": "...", "body": "...", "notable_pattern": "..."}`;

      const aRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 700, messages: [{ role: "user", content: prompt }] }),
      });
      if (aRes.ok) {
        const aData = await aRes.json();
        const text = aData?.content?.[0]?.text?.trim() || "{}";
        try {
          const parsed = JSON.parse(text);
          draftSubject = parsed.subject || "";
          draftBody = parsed.body || "";
          reasoning = `Claude Haiku draft. Notable pattern: ${parsed.notable_pattern || "none flagged"}.`;
        } catch {
          draftSubject = `${reportTypeLabel} · ${report.period_label}`;
          draftBody = text;
          reasoning = "Claude returned non-JSON; using raw text.";
        }
      }
    } catch (err) {
      console.error("Claude call failed:", err);
    }
  }

  if (!draftSubject) {
    draftSubject = `${reportTypeLabel} · ${report.period_label}`;
    draftBody = `Please find attached the ${reportTypeLabel} for ${report.period_label}.\n\nKey metrics:\n${Object.entries(meta).map(([k, v]) => `- ${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join("\n")}\n\nKindly file as required.\n\nRegards,\n${profile.business_name || "Operator"}`;
    reasoning = "Heuristic draft (Anthropic unavailable).";
  }

  const { data: task, error: taskErr } = await admin.from("agent_tasks").insert({
    operator_user_id: operatorUserId,
    job_type: "report_draft",
    subject_type: "report",
    subject_id: reportId,
    status: "pending_review",
    agent_output: {
      report_type: report.report_type,
      report_type_label: reportTypeLabel,
      period_label: report.period_label,
      pdf_url: report.pdf_url,
      csv_url: report.csv_url,
      key_metrics: meta,
      draft_email_subject: draftSubject,
      draft_email_body: draftBody,
      suggested_recipient: profile.business_email || "compliance@your-org.com",
    },
    agent_reasoning: reasoning,
    agent_risk_level: "low",
  }).select("id").single();

  if (taskErr) return json(500, { error: "Could not write agent task", detail: taskErr.message });
  return json(200, { ok: true, task_id: task.id });
});
