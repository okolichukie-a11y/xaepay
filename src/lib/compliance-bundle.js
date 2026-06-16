// =============================================================================
// COMPLIANCE BUNDLE — assembly
//
// Stitches together a single PDF for bank submission:
//
//   Page 1+      Cover sheet (jsPDF-generated)
//   Exhibit A    Original supplier invoice (customer's upload)
//   Exhibit B    Restructured trade-partner invoice (when applicable)
//   Exhibit C    Supplier bank details (when uploaded)
//   Exhibit D    Attestation page (when restructure exists)
//
// Originals are embedded byte-for-byte (PDFs are merged, images are
// rendered onto their own page). Banks trust unmodified originals more
// than re-rendered docs.
// =============================================================================

import { PDFDocument } from "pdf-lib";
import { supabase } from "./supabase.js";
import {
  generateComplianceBundleCoverPdf,
  generateComplianceBundleAttestationPdf,
  generateProformaRestructuredPdf,
} from "./pdf-doc.js";

// Convert a jsPDF doc to raw Uint8Array bytes — what pdf-lib expects.
async function jsPdfToBytes(doc) {
  const blob = doc.output("blob");
  return new Uint8Array(await blob.arrayBuffer());
}

// Fetch any remote file and return its bytes + content-type. Used for
// the original supplier invoice and optional bank-details doc — both
// of which were uploaded by the customer/operator earlier.
async function fetchFileBytes(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Couldn't fetch ${url}: HTTP ${res.status}`);
  const ct = res.headers.get("content-type") || "";
  const buf = new Uint8Array(await res.arrayBuffer());
  return { bytes: buf, contentType: ct };
}

// Append a file to the bundle. PDFs get their pages copied in; images
// get rendered onto fresh A4 pages preserving aspect ratio.
async function appendFileToBundle(bundleDoc, file) {
  if (!file?.bytes) return;
  const ct = (file.contentType || "").toLowerCase();
  const looksLikePdf = ct.includes("pdf") || (file.bytes[0] === 0x25 && file.bytes[1] === 0x50); // %P (PDF magic)
  if (looksLikePdf) {
    try {
      const src = await PDFDocument.load(file.bytes, { ignoreEncryption: true });
      const pages = await bundleDoc.copyPages(src, src.getPageIndices());
      pages.forEach((p) => bundleDoc.addPage(p));
      return;
    } catch (err) {
      // Fall through to image handling
      // eslint-disable-next-line no-console
      console.warn("PDF parse failed, trying image fallback:", err?.message);
    }
  }

  // Image embed — JPG and PNG are both supported by pdf-lib directly.
  let img;
  if (ct.includes("png")) img = await bundleDoc.embedPng(file.bytes).catch(() => null);
  if (!img) img = await bundleDoc.embedJpg(file.bytes).catch(() => null);
  if (!img) {
    // Best-effort: try PNG then JPG even if content-type is misleading
    img = await bundleDoc.embedPng(file.bytes).catch(() => null)
       || await bundleDoc.embedJpg(file.bytes).catch(() => null);
  }
  if (!img) {
    throw new Error("Couldn't embed file — not a recognized PDF/PNG/JPG");
  }

  // A4 page in points (pdf-lib default unit). 1mm = 2.83465 pt → 210mm=595, 297mm=842
  const PAGE_W_PT = 595;
  const PAGE_H_PT = 842;
  const MARGIN_PT = 28;
  const page = bundleDoc.addPage([PAGE_W_PT, PAGE_H_PT]);
  const maxW = PAGE_W_PT - MARGIN_PT * 2;
  const maxH = PAGE_H_PT - MARGIN_PT * 2;
  const { width: iw, height: ih } = img;
  const scale = Math.min(maxW / iw, maxH / ih);
  const drawW = iw * scale;
  const drawH = ih * scale;
  const x = (PAGE_W_PT - drawW) / 2;
  const y = (PAGE_H_PT - drawH) / 2;
  page.drawImage(img, { x, y, width: drawW, height: drawH });
}

// Top-level: assemble the bundle PDF. Returns a Blob ready to upload
// + download. Throws on any unrecoverable error so the caller can show
// the operator a useful toast.
export async function assembleComplianceBundle(args) {
  const {
    reference,
    parties,
    amount,
    currency,
    operatorName,
    originalInvoiceUrl,
    bankDetailsUrl,                  // optional
    restructured,                    // { args for generateProformaRestructuredPdf } | null
    attestation,                     // { operator_signer_name, customer_signer_name, ... } | null
  } = args;

  const hasRestructure = !!restructured;
  const hasBankDetails = !!bankDetailsUrl;

  // 1. Generate the XaePay-built pages (cover + optional attestation).
  const coverDoc = generateComplianceBundleCoverPdf({
    reference,
    parties,
    amount,
    currency,
    hasRestructure,
    hasBankDetails,
    generatedAt: new Date().toISOString(),
    operatorName,
  });
  const coverBytes = await jsPdfToBytes(coverDoc);

  let restructuredBytes = null;
  if (hasRestructure) {
    const restructuredDoc = generateProformaRestructuredPdf(restructured);
    restructuredBytes = await jsPdfToBytes(restructuredDoc);
  }

  let attestationBytes = null;
  if (hasRestructure && attestation) {
    const attestationDoc = generateComplianceBundleAttestationPdf({ reference, parties, attestation });
    attestationBytes = await jsPdfToBytes(attestationDoc);
  }

  // 2. Fetch the external uploads (original + optional bank details).
  const originalFile = originalInvoiceUrl
    ? await fetchFileBytes(originalInvoiceUrl)
    : null;
  const bankDetailsFile = bankDetailsUrl
    ? await fetchFileBytes(bankDetailsUrl)
    : null;

  // 3. Stitch everything into a single bundle doc with pdf-lib.
  const bundle = await PDFDocument.create();

  // Cover
  const coverSrc = await PDFDocument.load(coverBytes);
  (await bundle.copyPages(coverSrc, coverSrc.getPageIndices())).forEach((p) => bundle.addPage(p));

  // Exhibit A — original
  if (originalFile) await appendFileToBundle(bundle, originalFile);

  // Exhibit B — restructured (conditional)
  if (restructuredBytes) {
    const src = await PDFDocument.load(restructuredBytes);
    (await bundle.copyPages(src, src.getPageIndices())).forEach((p) => bundle.addPage(p));
  }

  // Exhibit C — bank details (optional)
  if (bankDetailsFile) await appendFileToBundle(bundle, bankDetailsFile);

  // Exhibit D — attestation (when restructure exists)
  if (attestationBytes) {
    const src = await PDFDocument.load(attestationBytes);
    (await bundle.copyPages(src, src.getPageIndices())).forEach((p) => bundle.addPage(p));
  }

  const out = await bundle.save();
  return new Blob([out], { type: "application/pdf" });
}

// Upload the assembled bundle to Supabase Storage so the operator can
// re-download it later from the quote/standalone history without
// re-generating.
export async function uploadComplianceBundle(refId, blob) {
  try {
    const path = `compliance-bundles/${refId}/${Date.now()}.pdf`;
    const { error: upErr } = await supabase.storage.from("cedar-files").upload(path, blob, { upsert: true, contentType: "application/pdf" });
    if (upErr) return { ok: false, error: upErr.message };
    const { data: pub } = supabase.storage.from("cedar-files").getPublicUrl(path);
    return { ok: true, url: pub?.publicUrl, path };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}
