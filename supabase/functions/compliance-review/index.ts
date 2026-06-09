// =============================================================================
// AI Compliance Agent — invoice review v1
//
// Supabase Edge Function called from runComplianceReview() in src/lib/supabase.js.
// Reviews a supplier invoice attached to a quote, extracting metadata + flagging
// anything that would trigger a CBN RFI (Request For Information) — payer-name
// mismatch, currency drift, vendor identity, supplier-on-sanctions patterns.
//
// Requires the ANTHROPIC_API_KEY Supabase secret to be set:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
//
// Persists results to quote columns: review_decision (approved|flagged|rejected|
// skipped), review_reason (one-line), review_details (full JSON), reviewed_at.
// Operator-side UI (ComplianceReviewPanel) reads these and renders.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANTHROPIC_MODEL = "claude-haiku-4-5-20251001"; // cheap + fast; bump to sonnet if accuracy needs grow

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { quoteId, tier } = await req.json();
    if (!quoteId) {
      return jsonResponse({ ok: false, error: "quoteId required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Fetch quote
    const { data: quote, error: qErr } = await supabase
      .from("quotes")
      .select("*")
      .eq("id", quoteId)
      .single();
    if (qErr || !quote) {
      return jsonResponse({ ok: false, error: "quote not found" }, 404);
    }

    // No invoice = skip review
    if (!quote.invoice_url) {
      await supabase.from("quotes").update({
        review_decision: "skipped",
        review_reason: "No invoice attached for AI review",
        reviewed_at: new Date().toISOString(),
      }).eq("id", quoteId);
      return jsonResponse({ ok: true, decision: "skipped" });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      // Without the API key the function falls back to a basic rule-based check
      // so operators still get *something* useful while the key is being added.
      const decision = await ruleBasedFallback(quote, supabase);
      return jsonResponse({ ok: true, decision, fallback: true });
    }

    // Download invoice file
    const invoiceRes = await fetch(quote.invoice_url);
    if (!invoiceRes.ok) {
      await supabase.from("quotes").update({
        review_decision: "flagged",
        review_reason: "Couldn't download invoice for review",
        review_details: { error: `fetch failed: ${invoiceRes.status}` },
        reviewed_at: new Date().toISOString(),
      }).eq("id", quoteId);
      return jsonResponse({ ok: false, error: "invoice download failed" }, 502);
    }

    const invoiceBlob = await invoiceRes.blob();
    const invoiceBuffer = new Uint8Array(await invoiceBlob.arrayBuffer());
    let mimeType = invoiceBlob.type || "application/octet-stream";

    // Claude supports image/* and application/pdf
    const isImage = mimeType.startsWith("image/");
    const isPdf = mimeType === "application/pdf" || mimeType === "application/x-pdf";
    if (!isImage && !isPdf) {
      // Best-effort: assume PDF if we can't tell
      mimeType = "application/pdf";
    }

    const base64 = uint8ToBase64(invoiceBuffer);

    const prompt = `You are reviewing a supplier invoice attached to a cross-border payment quote on XaePay (a Nigerian fintech platform).

QUOTE DETAILS (the customer is paying this amount based on this invoice):
- Customer name: ${quote.customer_name || "Unknown"}
- Customer paying: ${quote.amount} ${quote.currency}
- Beneficiary / supplier on the quote: ${quote.beneficiary || "Unknown"}
- Destination country: ${quote.destination || "Unknown"}
- Direction: ${quote.direction || "outbound"}
- Customer's stated purpose: ${quote.purpose_note || "(none)"}

YOUR TASK: extract structured data from the attached invoice, then verify it matches the quote. Flag anything that would trigger a Central Bank of Nigeria (CBN) Request For Information (RFI) when the wire is submitted.

Common RFI triggers:
- Payer name on invoice doesn't match the customer making the payment
- Amount on invoice doesn't match the quoted amount (small differences <1% are fine; large differences are red flags)
- Currency mismatch
- Invoice is missing required fields (invoice number, date, vendor address)
- Vendor name looks suspicious, shell-company-like, or matches known sanctions patterns
- Round-number amounts in odd currencies (often laundering proxies)
- Invoice older than 90 days (stale)

Respond with JSON ONLY (no markdown, no commentary, just the JSON object):
{
  "extracted": {
    "vendor_name": "...",
    "vendor_address": "...",
    "invoice_number": "...",
    "issue_date": "YYYY-MM-DD or null",
    "total_amount": 0.0,
    "currency": "3-letter code or null",
    "line_items": ["string array of brief descriptions"],
    "payment_terms": "..."
  },
  "checks": {
    "amount_matches_quote": true,
    "currency_matches_quote": true,
    "vendor_matches_beneficiary": true,
    "invoice_has_required_fields": true,
    "invoice_recent_enough": true
  },
  "flags": [
    { "severity": "high", "code": "AMOUNT_MISMATCH", "message": "Invoice shows $25,500 but quote is for $25,000 — 2% discrepancy" }
  ],
  "decision": "approved",
  "reason": "One-line explanation operator will read first"
}

decision must be exactly one of: "approved" (clean, no flags), "flagged" (proceed with caution, has medium flags), "rejected" (do not submit, has high flags or critical issues).`;

    const claudeReq = {
      model: ANTHROPIC_MODEL,
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: [
          {
            type: isImage ? "image" : "document",
            source: { type: "base64", media_type: mimeType, data: base64 },
          },
          { type: "text", text: prompt },
        ],
      }],
    };

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify(claudeReq),
    });

    if (!claudeRes.ok) {
      const errBody = await claudeRes.text();
      console.error("Claude API error:", claudeRes.status, errBody);
      await supabase.from("quotes").update({
        review_decision: "flagged",
        review_reason: `AI review failed (${claudeRes.status})`,
        review_details: { error: errBody.slice(0, 500) },
        reviewed_at: new Date().toISOString(),
      }).eq("id", quoteId);
      return jsonResponse({ ok: false, error: "claude_api_error", status: claudeRes.status });
    }

    const claudeData = await claudeRes.json();
    const responseText = claudeData.content?.[0]?.text ?? "";

    let result: any = null;
    try {
      // Trim any pre/post markdown that Claude might include despite instructions
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (_e) {
      result = null;
    }

    if (!result || typeof result !== "object") {
      await supabase.from("quotes").update({
        review_decision: "flagged",
        review_reason: "AI returned unparseable response",
        review_details: { raw: responseText.slice(0, 1000), parse_error: true },
        reviewed_at: new Date().toISOString(),
      }).eq("id", quoteId);
      return jsonResponse({ ok: false, error: "parse_failure" });
    }

    const decision = (result.decision === "approved" || result.decision === "rejected") ? result.decision : "flagged";

    await supabase.from("quotes").update({
      review_decision: decision,
      review_reason: (result.reason || "AI review complete").toString().slice(0, 500),
      review_details: result,
      review_tier: tier || quote.review_tier,
      reviewed_at: new Date().toISOString(),
    }).eq("id", quoteId);

    return jsonResponse({ ok: true, decision, result });
  } catch (err) {
    console.error("compliance-review error:", err);
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
});

// ---- helpers ---------------------------------------------------------------

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Encode Uint8Array to base64 without overflowing the call stack on large files.
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// Fallback when ANTHROPIC_API_KEY isn't set — does a basic rule-based check
// so operators still get *something* (even if it's just "no AI review yet").
async function ruleBasedFallback(quote: any, supabase: any) {
  const flags: any[] = [];
  // Just record that no AI review ran. Operators see the placeholder so they
  // know to add the API key.
  await supabase.from("quotes").update({
    review_decision: "flagged",
    review_reason: "AI review unavailable (ANTHROPIC_API_KEY not set on Supabase)",
    review_details: { flags, fallback_mode: true },
    reviewed_at: new Date().toISOString(),
  }).eq("id", quote.id);
  return "flagged";
}
