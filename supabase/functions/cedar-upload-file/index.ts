// cedar-upload-file
//
// Forwards a multipart file upload from the XaePay frontend to Cedar Money's
// /v1/files/upload endpoint via the Fly.io relay (cedar-relay-xaepay). Cedar
// keeps a server-side copy of the file (good for their compliance / audit) and
// returns a URL we can later pass to /v1/sendf2f/ as `invoiceUrl` or to
// /v1/sendf2f/approveDeposit/ as `depositConfirmationUrl`.
//
// Auth: caller must be a signed-in Supabase user. The Authorization header
// (Bearer <jwt>) is verified by hitting auth.getUser via the anon client.
//
// Required env vars (Supabase Edge Function secrets):
// - CEDAR_RELAY_URL       e.g. https://cedar-relay-xaepay.fly.dev
// - CEDAR_RELAY_SECRET    same value as RELAY_SECRET on the Fly app
// - SUPABASE_URL          (provided by Supabase automatically)
// - SUPABASE_ANON_KEY     (provided by Supabase automatically)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CEDAR_RELAY_URL = Deno.env.get("CEDAR_RELAY_URL");
const CEDAR_RELAY_SECRET = Deno.env.get("CEDAR_RELAY_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  if (!CEDAR_RELAY_URL || !CEDAR_RELAY_SECRET) {
    return json(500, { error: "CEDAR_RELAY_URL or CEDAR_RELAY_SECRET not configured" });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json(500, { error: "SUPABASE_URL or SUPABASE_ANON_KEY not configured" });
  }

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return json(401, { error: "Missing Bearer token" });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return json(401, { error: "Invalid or expired session" });
  }

  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    return json(400, { error: "Expected multipart/form-data" });
  }

  const body = await req.arrayBuffer();
  if (body.byteLength === 0) {
    return json(400, { error: "Empty body" });
  }
  if (body.byteLength > 15 * 1024 * 1024) {
    return json(413, { error: "File too large (max 15 MB)" });
  }

  let cedarRes: Response;
  try {
    cedarRes = await fetch(`${CEDAR_RELAY_URL}/v1/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CEDAR_RELAY_SECRET}`,
        "content-type": contentType,
      },
      body,
    });
  } catch (err) {
    return json(502, { error: "Relay fetch failed", detail: String(err) });
  }

  let cedarBody: unknown = null;
  const cedarText = await cedarRes.text();
  try {
    cedarBody = JSON.parse(cedarText);
  } catch {
    cedarBody = { raw: cedarText };
  }

  if (!cedarRes.ok) {
    return json(cedarRes.status, { error: "Cedar rejected upload", cedar: cedarBody });
  }

  const url = (cedarBody as { url?: string; data?: { url?: string } })?.url
    || (cedarBody as { data?: { url?: string } })?.data?.url
    || null;

  return json(200, {
    ok: true,
    cedar: cedarBody,
    url,
    user_id: userData.user.id,
  });
});
