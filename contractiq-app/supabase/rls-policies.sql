-- ============================================================================
-- ContractIQ — security hardening SQL
--
-- Paste-and-run in the Supabase SQL Editor. Idempotent — safe to re-run.
--
-- This is the standalone security deliverable per docs/security/security-plan.md:
--   1. Creates rate_limit_events (backs lib/security/rateLimiter.ts).
--   2. Re-asserts Row Level Security is enabled on every application table,
--      as an auditable, independently-runnable verification step.
--
-- The full application schema (all table/column definitions, indexes,
-- triggers, and every RLS policy) lives in database.sql — that file is the
-- canonical source and already includes everything in this file. Run THIS
-- file on its own only if you need to (re-)apply just the security layer
-- without touching table structure, e.g. as a post-deploy security check.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. rate_limit_events
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto; -- gen_random_uuid()

create table if not exists rate_limit_events (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  action     text        not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_events_lookup
  on rate_limit_events (user_id, action, created_at desc);

alter table rate_limit_events enable row level security;
-- No user-facing policies — service role only (lib/supabase/admin.ts'
-- createAdminClient()). RLS enabled with zero policies means anon/
-- authenticated roles have no access to this table at all: a user cannot
-- read, insert, update, or delete their own rate-limit history.

-- ----------------------------------------------------------------------------
-- 2. Re-assert RLS is enabled on every application table (idempotent —
--    a no-op if already enabled, per database.sql). Included here so this
--    file is a complete, independently-runnable security verification/
--    hardening script, not just the new table.
-- ----------------------------------------------------------------------------
alter table contracts enable row level security;
alter table key_terms enable row level security;
alter table custom_key_terms enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table user_feedback enable row level security;

-- ============================================================================
-- Verify: Supabase Dashboard > Authentication > Policies should show RLS
-- "Enabled" on all 7 tables (contracts, key_terms, custom_key_terms,
-- chat_sessions, chat_messages, user_feedback, rate_limit_events), with
-- rate_limit_events showing zero policies (intentional — service-role only).
--
-- Or verify via SQL:
--   select relname, relrowsecurity from pg_class
--   where relname in ('contracts','key_terms','custom_key_terms',
--     'chat_sessions','chat_messages','user_feedback','rate_limit_events');
--   -- every row must show relrowsecurity = true
-- ============================================================================
