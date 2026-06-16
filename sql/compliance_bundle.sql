-- Compliance Bundle — single-PDF bank submission artifact.
--
-- A bundle stitches together: cover sheet (XaePay-generated) + original
-- supplier invoice (customer upload) + restructured invoice (when
-- applicable) + supplier bank details (optional) + attestation page
-- (when applicable). Generated client-side via pdf-lib, uploaded to
-- the cedar-files bucket, URL persisted here so the operator can
-- re-download without re-generating.

alter table public.quotes
  add column if not exists compliance_bundle_url text,
  add column if not exists compliance_bundle_path text,
  add column if not exists compliance_bundle_generated_at timestamptz,
  add column if not exists compliance_bundle_bank_details_url text;

alter table public.standalone_proformas
  add column if not exists compliance_bundle_url text,
  add column if not exists compliance_bundle_path text,
  add column if not exists compliance_bundle_generated_at timestamptz,
  add column if not exists compliance_bundle_bank_details_url text;
