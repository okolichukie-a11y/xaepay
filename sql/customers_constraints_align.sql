-- Re-align the customers table check constraints with the values the
-- codebase actually writes. The original constraints predate several
-- features (inline customer create from the Invoicing tab, Cedar status
-- sync, etc.) and now reject valid inserts.
--
-- ORDER MATTERS: we must drop the old constraints BEFORE normalizing
-- existing rows. If we update first, the lowercase value violates the
-- old constraint (which only allowed capitalized 'Individual'/'Business').

-- 1. Drop the old constraints first so the normalization update can run.
alter table public.customers
  drop constraint if exists customers_type_check;

alter table public.customers
  drop constraint if exists customers_kyc_status_check;

-- 2. Normalize existing rows to lowercase so they match the canonical
--    values the codebase writes.
update public.customers
set type = lower(type)
where type is not null and type <> lower(type);

update public.customers
set kyc_status = lower(kyc_status)
where kyc_status is not null and kyc_status <> lower(kyc_status);

-- 3. Add the new constraints with the values the code uses.
alter table public.customers
  add constraint customers_type_check
  check (type in ('individual', 'business'));

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
