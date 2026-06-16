-- Supplemental documents for a restructured proforma (bank payment
-- details on a separate page, packing list, contract, etc.). Stored as
-- an array of {label, url, path, uploaded_at} so the cover sheet can
-- list them by name in the compliance bundle and the merger can append
-- them in order.

alter table public.standalone_proformas
  add column if not exists supporting_documents jsonb not null default '[]'::jsonb;

alter table public.quotes
  add column if not exists proforma_supporting_documents jsonb not null default '[]'::jsonb;
