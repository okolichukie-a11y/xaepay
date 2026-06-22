-- Re-align the customers table check constraints with the values the
-- codebase actually writes. The original constraints predate several
-- features (inline customer create from the Invoicing tab, Cedar status
-- sync, etc.) and now reject valid inserts.
--
-- Symptom that brought this on: creating an invoice for a not-yet-onboarded
-- customer via the Invoicing tab fails with:
--   "customers_type_check" / "customers_kyc_status_check"

-- 1. Normalize any existing rows whose type/kyc_status values are
--    mis-cased (e.g. 'Individual' instead of 'individual') so they
--    pass the new constraint.
update public.customers
set type = lower(type)
where type is not null and type <> lower(type);

update public.customers
set kyc_status = lower(kyc_status)
where kyc_status is not null and kyc_status <> lower(kyc_status);

-- 2. Type — individual or business. The whole codebase reads this column
--    as one of these two values; nothing else is rendered.
alter table public.customers
  drop constraint if exists customers_type_check;
alter table public.customers
  add constraint customers_type_check
  check (type in ('individual', 'business'));

-- 3. KYC status — local (XaePay) status, distinct from cedar_kyc_status.
--    Allowed values mirror the kycStatusLabel() switch in XaePay.jsx so
--    the UI can render anything we persist. 'pending' is the default
--    new-customer state; the rest cover legitimate transitions.
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

-- Force PostgREST to reload the schema cache so the new constraints
-- take effect immediately.
notify pgrst, 'reload schema';
