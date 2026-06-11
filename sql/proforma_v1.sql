-- =============================================================================
-- Proforma Invoice Agent — V1 schema
-- Run once in Supabase SQL editor.
-- =============================================================================

-- Trade-partner attestations — proof that the operator and end customer
-- have both confirmed the operator is acting as contractual trade partner
-- (named buyer of record) on a third-party trade.
create table if not exists public.trade_partner_attestations (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  operator_user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  attestation_text text not null,                  -- legal language used at time of signing
  operator_attested_at timestamptz,
  operator_signer_name text,
  customer_attested_at timestamptz,
  customer_signer_name text,
  customer_signer_email text,
  customer_signer_phone text,
  form_m_responsibility text check (form_m_responsibility in ('operator','customer','not_applicable')),
  notes text,
  created_at timestamptz not null default now(),
  superseded_at timestamptz                         -- if a newer attestation replaced it
);

create index if not exists tpa_quote_idx on public.trade_partner_attestations (quote_id);
create index if not exists tpa_operator_idx on public.trade_partner_attestations (operator_user_id);

alter table public.trade_partner_attestations enable row level security;

drop policy if exists "operators read own attestations" on public.trade_partner_attestations;
create policy "operators read own attestations"
  on public.trade_partner_attestations for select
  using (operator_user_id = auth.uid());

drop policy if exists "customers read own attestations" on public.trade_partner_attestations;
create policy "customers read own attestations"
  on public.trade_partner_attestations for select
  using (customer_id in (select id from public.customers where email = auth.email()));

drop policy if exists "operators write own attestations" on public.trade_partner_attestations;
create policy "operators write own attestations"
  on public.trade_partner_attestations for insert
  with check (operator_user_id = auth.uid());

drop policy if exists "operators + customers update own attestations" on public.trade_partner_attestations;
create policy "operators + customers update own attestations"
  on public.trade_partner_attestations for update
  using (
    operator_user_id = auth.uid()
    or customer_id in (select id from public.customers where email = auth.email())
  );

-- Proforma metadata on the quote
alter table public.quotes
  add column if not exists proforma_restructured boolean default false,
  add column if not exists proforma_original_invoice_url text,
  add column if not exists proforma_original_invoice_path text,
  add column if not exists proforma_restructured_invoice_url text,
  add column if not exists proforma_restructured_invoice_path text,
  add column if not exists proforma_restructured_at timestamptz,
  add column if not exists proforma_attestation_id uuid references public.trade_partner_attestations(id) on delete set null,
  add column if not exists form_m_responsibility text check (form_m_responsibility in ('operator','customer','not_applicable'));

create index if not exists quotes_proforma_idx on public.quotes (proforma_restructured) where proforma_restructured = true;
