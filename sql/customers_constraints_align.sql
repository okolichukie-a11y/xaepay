-- Re-align the customers table check constraints with the values the
-- codebase actually writes. The original constraints predate several
-- features (inline customer create from the Invoicing tab, Cedar status
-- sync, etc.) and now reject valid inserts.
--
-- Symptom that brought this on: creating an invoice for a not-yet-onboarded
-- customer via the Invoicing tab fails with:
--   "customers_type_check" / "customers_kyc_status_check"
--
-- This drops + re-adds both with the full enumerated value set so the
-- inline-create path works. Existing rows are not touched.

-- Type — individual or business. The whole codebase reads this column as
-- one of these two values; nothing else is rendered.
alter table public.customers
  drop constraint if exists customers_type_check;
alter table public.customers
  add constraint customers_type_check
  check (type in ('individual', 'business'));

-- KYC status — local (XaePay) status, distinct from cedar_kyc_status.
-- Allowed values mirror the kycStatusLabel() switch in XaePay.jsx so the
-- UI can render anything we persist. 'pending' is the default new-customer
-- state; the rest cover the legitimate transitions.
alter table public.customers
  drop constraint if exists customers_kyc_status_check;
alter table public.customers
  add constraint customers_kyc_status_check
  check (kyc_status in (
    'pending',
    'pending_review',
    'submitted',
    'in_review',
    'under_review',
    'action_needed',
    'verified',
    'approved',
    'rejected',
    'flagged',
    'abandoned',
    'new'
  ));

-- Force PostgREST to reload the schema cache so the new constraints take
-- effect immediately (otherwise inserts may hit a stale cached check
-- against the old constraint values for ~60s).
notify pgrst, 'reload schema';
