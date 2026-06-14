-- Customer acknowledgment on restructured proforma invoices.
--
-- When the operator does a Restructure-as-Trade on a quote, the customer
-- now sees the restructured PDF in their portal and can click "I
-- acknowledge this restructure" to lock in their consent on-record.
-- These columns hold that acknowledgment.

alter table public.quotes
  add column if not exists proforma_customer_acknowledged_at timestamptz,
  add column if not exists proforma_customer_acknowledgment_name text;
