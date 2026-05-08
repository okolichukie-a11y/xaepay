import { supabase } from "./supabase.js";
import { generateQuotePdf, downloadQuotePdf, _refForFilename } from "./pdf-doc.js";

export { generateQuotePdf, downloadQuotePdf };

export async function uploadQuotePdf(quoteId, doc) {
  const blob = doc.output("blob");
  const path = `${quoteId}/${_refForFilename(quoteId)}-${Date.now()}.pdf`;
  const { error: upErr } = await supabase.storage
    .from("quote-pdfs")
    .upload(path, blob, { contentType: "application/pdf", upsert: false });
  if (upErr) {
    return { ok: false, error: upErr.message || "Upload failed" };
  }
  const { data: signed, error: signErr } = await supabase.storage
    .from("quote-pdfs")
    .createSignedUrl(path, 60 * 60 * 24 * 30);
  if (signErr) {
    return { ok: false, error: signErr.message || "Could not generate URL" };
  }
  const { error: dbErr } = await supabase
    .from("quotes")
    .update({ pdf_url: signed.signedUrl, pdf_path: path, pdf_generated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (dbErr) {
    return { ok: false, error: dbErr.message || "Could not save URL on quote" };
  }
  return { ok: true, url: signed.signedUrl, path };
}
