-- =============================================================================
-- Operator Agent V1 — schema
-- Run once in Supabase SQL editor.
-- =============================================================================

-- Toggle on operator profile (default OFF so no surprise behavior)
alter table public.operator_profiles
  add column if not exists agent_mode boolean default false;

-- Audit log of every agent draft / decision / send
create table if not exists public.agent_tasks (
  id uuid primary key default gen_random_uuid(),
  operator_user_id uuid not null references auth.users(id) on delete cascade,
  job_type text not null check (job_type in (
    'quote_review',
    'kyc_chase',
    'recurring_confirm',
    'payment_match',
    'report_draft'
  )),
  subject_type text,                -- 'quote' | 'customer' | 'recipient' | 'period'
  subject_id uuid,                  -- the quote/customer/etc the task is about
  status text not null default 'pending_review' check (status in (
    'pending_review',               -- agent finished its draft; waiting on operator
    'approved',                     -- operator approved (still needs sending)
    'rejected',                     -- operator rejected; not actionable
    'sent',                         -- approved + the actual action happened
    'dismissed',                    -- operator dismissed without action
    'superseded'                    -- newer draft replaced this one
  )),
  agent_output jsonb,               -- drafted content (rate, message, risk, etc.)
  agent_reasoning text,             -- short "why" from the agent
  agent_risk_level text check (agent_risk_level in ('low','medium','high','critical')),
  operator_decision text,           -- 'approved' | 'edited' | 'rejected' | 'dismissed'
  operator_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  sent_at timestamptz
);

create index if not exists agent_tasks_operator_status_idx
  on public.agent_tasks (operator_user_id, status, created_at desc);

create index if not exists agent_tasks_subject_idx
  on public.agent_tasks (subject_type, subject_id);

-- RLS — operators see + update only their own tasks
alter table public.agent_tasks enable row level security;

drop policy if exists "operators read own agent tasks" on public.agent_tasks;
create policy "operators read own agent tasks"
  on public.agent_tasks for select
  using (operator_user_id = auth.uid());

drop policy if exists "operators update own agent tasks" on public.agent_tasks;
create policy "operators update own agent tasks"
  on public.agent_tasks for update
  using (operator_user_id = auth.uid());

-- Service-role bypasses RLS for inserts (Edge Function runs as service role)
