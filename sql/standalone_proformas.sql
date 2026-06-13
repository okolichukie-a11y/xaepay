-- Standalone proforma restructures.
--
-- The existing `trade_partner_attestations` table is scoped to a specific
-- quote_id (FK NOT NULL). For one-off operator-initiated restructures
-- where there's no onboarded customer or live quote, we use a separate
-- table that doesn't depend on the quotes table.
--
-- Created 2026-06-13 alongside the v1 standalone Restructure-as-Trade
-- feature in the Invoicing tab.

create table if not exists public.standalone_proformas (
  id uuid primary key default gen_random_uuid(),
  operator_user_id uuid not null references auth.users(id) on delete cascade,

  -- Invoice identity (required for compliance)
  invoice_number text not null,
  invoice_date date not null,
  currency text not null,

  -- Original supplier (extracted from uploaded invoice)
  supplier_name text,
  supplier_address text,
  supplier_contact text,
  supplier_tax_id text,

  -- Customer (consignee + UBO)
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_address text,

  -- Operator (acting as buyer of record on customer's behalf)
  operator_signer_name text not null,
  operator_address text,
  operator_contact text,

  -- Trade structure
  form_m_responsibility text not null check (form_m_responsibility in ('operator', 'customer')),

  -- Amount adjustment
  original_amount numeric,                  -- as extracted from supplier invoice
  target_amount numeric not null,           -- what the wire / restructured invoice shows
  scaling_method text not null check (scaling_method in ('quantity', 'unit_price', 'payment_terms_only')),
  payment_terms text,                       -- free-text: backs the wire-vs-invoice difference

  -- Files
  original_invoice_url text,
  original_invoice_path text,
  restructured_invoice_url text,
  restructured_invoice_path text,

  -- Snapshots (audit + regeneration)
  extracted_data jsonb,                     -- raw output from agent-proforma-extract
  line_items_original jsonb,                -- snapshot before scaling
  line_items_adjusted jsonb,                -- snapshot after scaling (what's on the PDF)

  -- Attestation
  attestation_text text not null,
  operator_attested_at timestamptz not null default now(),
  customer_attested_at timestamptz not null default now(),
  customer_signer_name text not null,
  customer_signer_email text,
  customer_signer_phone text,
  confirmation_method text,                 -- 'written_agreement' | 'whatsapp_screenshot' | 'verbal' | 'email'

  notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists standalone_proformas_operator_idx
  on public.standalone_proformas (operator_user_id, created_at desc);

create index if not exists standalone_proformas_invoice_num_idx
  on public.standalone_proformas (operator_user_id, invoice_number);

-- RLS
alter table public.standalone_proformas enable row level security;

drop policy if exists "operators read own standalone proformas" on public.standalone_proformas;
create policy "operators read own standalone proformas"
  on public.standalone_proformas for select
  using (operator_user_id = auth.uid());

drop policy if exists "operators insert own standalone proformas" on public.standalone_proformas;
create policy "operators insert own standalone proformas"
  on public.standalone_proformas for insert
  with check (operator_user_id = auth.uid());

drop policy if exists "operators update own standalone proformas" on public.standalone_proformas;
create policy "operators update own standalone proformas"
  on public.standalone_proformas for update
  using (operator_user_id = auth.uid())
  with check (operator_user_id = auth.uid());

-- Existing quote-based proforma flow needs the same v1 fields. We add
-- them to the quotes table so the existing ProformaRestructureModal can
-- record target_amount, scaling_method, payment_terms, invoice_number,
-- invoice_date alongside the existing proforma_restructured columns.
alter table public.quotes
  add column if not exists proforma_target_amount numeric,
  add column if not exists proforma_scaling_method text check (proforma_scaling_method in ('quantity', 'unit_price', 'payment_terms_only')),
  add column if not exists proforma_payment_terms text,
  add column if not exists proforma_invoice_number text,
  add column if not exists proforma_invoice_date date,
  add column if not exists proforma_line_items_original jsonb,
  add column if not exists proforma_line_items_adjusted jsonb;
