// agent-proforma-extract
//
// Proforma Invoice Agent — extraction service.
// Called by the operator's "Restructure as third-party trade" modal
// after they upload an original supplier invoice. Uses Claude Haiku
// vision to extract structured invoice fields the operator confirms
// before the restructured PDF is generated client-side.
//
// Synchronous — returns the extracted JSON in the response (no
// agent_tasks row). Operator is in the wizard waiting for the result.

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
  if (!ANTHROPIC_API_KEY) return json(500, { error: "ANTHROPIC_API_KEY not set" });

  let body: any = {};
  try { body = await req.json(); } catch {}
  const invoiceUrl = body?.invoice_url;
  if (!invoiceUrl) return json(400, { error: "Missing invoice_url" });

  const prompt = `You are inspecting an original supplier invoice (PDF or image). Extract structured fields exactly as they appear on the invoice. If a field isn't visible, return null for it (don't guess).

Output ONLY valid JSON with this exact shape, no preamble:
{
  "vendor_name": "string or null",
  "vendor_address": "string or null",
  "vendor_contact": "string or null (phone/email if visible)",
  "vendor_tax_id": "string or null (VAT/EIN/etc if visible)",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "due_date": "YYYY-MM-DD or null",
  "currency": "3-letter ISO code or null",
  "total_amount": number_or_null,
  "subtotal": number_or_null,
  "tax": number_or_null,
  "shipping": number_or_null,
  "payment_terms": "string or null (e.g. NET 30, T/T 30% advance)",
  "incoterms": "string or null (e.g. FOB Shanghai, CIF Lagos)",
  "bill_to_name": "string or null (named buyer on the original)",
  "bill_to_address": "string or null",
  "ship_to_name": "string or null (named consignee on the original)",
  "ship_to_address": "string or null",
  "line_items": [
    {"description": "string", "quantity": number_or_null, "unit_price": number_or_null, "amount": number_or_null}
  ],
  "bank_details": "string or null (full beneficiary bank details if visible)"
}`;

  try {
    const aRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "url", url: invoiceUrl } },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });
    if (!aRes.ok) {
      const errBody = await aRes.text();
      return json(502, { error: "Claude API error", status: aRes.status, detail: errBody.slice(0, 300) });
    }
    const aData = await aRes.json();
    const text = aData?.content?.[0]?.text?.trim() || "{}";
    let extracted: any = {};
    try {
      // Strip markdown code fences if present
      const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim();
      extracted = JSON.parse(cleaned);
    } catch (e) {
      return json(500, { error: "Could not parse Claude response as JSON", raw: text.slice(0, 500) });
    }
    return json(200, { ok: true, extracted });
  } catch (err) {
    console.error("Extraction failed:", err);
    return json(500, { error: "Extraction failed", detail: String(err) });
  }
});
