// =============================================================================
// Recurring cross-border quote runner
//
// Cron-triggered daily by GitHub Actions. Scans recurring_payment_requests for
// any active schedule with next_run_date <= today, creates a new quote in
// 'request_pending' status using the schedule's template, and advances
// next_run_date by the cadence interval. Cancels schedules past their end_date.
//
// Can also be called manually:
//   POST /functions/v1/recurring-quote-runner
//   Header: x-runner-secret: <RECURRING_RUNNER_SECRET>
// Or for testing a single schedule:
//   POST /functions/v1/recurring-quote-runner { recurringId: '<uuid>' }
//   (auth as the schedule's owner via Bearer token)
//
// Required Supabase secrets:
//   - RECURRING_RUNNER_SECRET (shared with the GitHub Actions cron)
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-runner-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  let body: any = {};
  try { body = await req.json(); } catch { /* empty body ok for system mode */ }

  const runnerSecret = req.headers.get("x-runner-secret");
  const systemMode = runnerSecret && runnerSecret === Deno.env.get("RECURRING_RUNNER_SECRET");

  let targetSchedules: any[] = [];

  if (body?.recurringId) {
    // Single-target manual run — caller must own the schedule (RLS-enforced
    // by using the user's bearer token rather than service role for the read)
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const { data, error } = await userClient.from("recurring_payment_requests").select("*").eq("id", body.recurringId).maybeSingle();
    if (error || !data) return jsonResponse({ ok: false, error: "schedule not found or not authorized" }, 404);
    targetSchedules = [data];
  } else if (systemMode) {
    // Cron mode — sweep all due schedules
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from("recurring_payment_requests")
      .select("*")
      .eq("status", "active")
      .lte("next_run_date", today);
    if (error) return jsonResponse({ ok: false, error: error.message }, 500);
    targetSchedules = data || [];
  } else {
    return jsonResponse({ ok: false, error: "must provide recurringId (with auth) or x-runner-secret" }, 401);
  }

  const results: any[] = [];
  for (const schedule of targetSchedules) {
    try {
      // End-date check: if past end_date, mark complete and skip
      if (schedule.end_date && new Date(schedule.end_date) < new Date()) {
        await supabase.from("recurring_payment_requests").update({
          status: "completed", updated_at: new Date().toISOString()
        }).eq("id", schedule.id);
        results.push({ id: schedule.id, status: "completed_skipped" });
        continue;
      }

      // Create the new quote
      const { data: quote, error: qErr } = await supabase.from("quotes").insert({
        bdc_user_id: schedule.bdc_user_id,
        bdc_name: schedule.bdc_name || "XaeccoX",
        customer_id: schedule.customer_id,
        recipient_id: schedule.recipient_id,
        amount: schedule.amount,
        currency: schedule.currency,
        destination: schedule.destination,
        beneficiary: schedule.beneficiary,
        purpose_note: schedule.purpose_note ? `${schedule.purpose_note} (recurring · cycle #${schedule.quotes_generated_count + 1})` : `Recurring payment · cycle #${schedule.quotes_generated_count + 1}`,
        status: "request_pending",
        cedar_purpose: "PAYMENT_OF_SERVICES",
      }).select("id").single();

      if (qErr) {
        results.push({ id: schedule.id, error: qErr.message });
        continue;
      }

      // Advance next_run_date by cadence
      const nextDate = advanceCadence(schedule.next_run_date, schedule.cadence);
      await supabase.from("recurring_payment_requests").update({
        next_run_date: nextDate,
        last_run_at: new Date().toISOString(),
        quotes_generated_count: schedule.quotes_generated_count + 1,
        updated_at: new Date().toISOString(),
      }).eq("id", schedule.id);

      results.push({ id: schedule.id, quote_id: quote.id, next_run_date: nextDate });
    } catch (err) {
      results.push({ id: schedule.id, error: String(err) });
    }
  }

  return jsonResponse({ ok: true, processed: results.length, results });
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function advanceCadence(currentDate: string, cadence: string): string {
  const d = new Date(currentDate);
  switch (cadence) {
    case "weekly":    d.setDate(d.getDate() + 7); break;
    case "biweekly":  d.setDate(d.getDate() + 14); break;
    case "monthly":   d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "annually":  d.setFullYear(d.getFullYear() + 1); break;
    default:          d.setMonth(d.getMonth() + 1);  // fallback monthly
  }
  return d.toISOString().slice(0, 10);
}
