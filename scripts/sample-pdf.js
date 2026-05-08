import { writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { generateQuotePdf } from "../src/lib/pdf-doc.js";

const sampleQuote = {
  id: "a3f12b4c-0000-0000-0000-000000000000",
  customer_name: "Adekunle Imports Ltd",
  customer_phone: "+234 803 123 4567",
  customer_email: "adekunle@imports.ng",
  beneficiary: "Shenzhen Electronics Co., Ltd",
  destination: "China",
  amount: 25000,
  currency: "USD",
  rate: 1395.5,
  ngn_total: 34887500,
  bdc_name: "Lagos FX Partners",
  bdc_phone: "+234 802 555 0199",
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 4 * 60 * 1000).toISOString(),
  cedar_bank_details: {
    bank_name: "Sterling Bank Plc",
    account_name: "XaePay Holdings Ltd",
    account_number: "0123456789",
    sort_code: "232150024",
  },
  invoice_payment_label: "Tranche 1 of 3 — see schedule attached to invoice",
  invoice_total_amount: 75000,
  invoice_total_currency: "USD",
};

const doc = generateQuotePdf(sampleQuote);
const outPath = join(homedir(), "Downloads", "xaepay-sample-quote.pdf");
writeFileSync(outPath, Buffer.from(doc.output("arraybuffer")));
console.log(`Wrote sample PDF to ${outPath}`);
