-- =============================================================================
-- Operator Agent — allow new job_type 'invoice_review'
-- Drop the CHECK constraint (app layer enforces valid values; constraint was
-- over-restrictive when we add new job types).
-- =============================================================================

alter table public.agent_tasks drop constraint if exists agent_tasks_job_type_check;
