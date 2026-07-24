-- ============================================================================
-- ContractIQ — complete production database schema
--
-- Paste this entire file into the Supabase SQL Editor (SQL Editor > New
-- query) and run it once on a fresh project. Safe to re-run — every
-- statement is idempotent (IF NOT EXISTS / OR REPLACE / DROP ... IF EXISTS
-- guards throughout).
--
-- Derived from docs/engineering/engineering-doc.md §7 (Database Design and
-- Schema) and docs/specs/*.md, and verified against the actual columns read
-- and written by the implemented app (app/api/contracts/**). The canonical
-- spec copy of this file lives at docs/specs/supabase-schema.sql — this copy
-- is kept in sync and lives alongside the app for setup convenience.
--
-- Covers, in order: extensions, enums, tables (contracts, key_terms,
-- custom_key_terms, chat_sessions, chat_messages, user_feedback,
-- rate_limit_events), indexes, the updated_at trigger, the
-- term_corrections view, Row Level Security (enabled + policies on every
-- table), and the Storage bucket + its RLS policies.
--
-- rate_limit_events backs lib/security/rateLimiter.ts (a DB-backed sliding
-- window, correct across multiple serverless instances, unlike an
-- in-memory counter) — see docs/security/security-plan.md and
-- supabase/rls-policies.sql, which contains this same table as a focused,
-- standalone deliverable per that plan.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
create extension if not exists pgcrypto; -- gen_random_uuid()

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type contract_type_enum as enum ('nda', 'msa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contract_status_enum as enum ('uploaded', 'processing', 'completed', 'error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_role_enum as enum ('user', 'assistant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type feedback_rating_enum as enum ('up', 'down');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chat_context_source_enum as enum ('contract', 'history', 'both');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 2. Tables (dependency order)
-- ----------------------------------------------------------------------------

-- contracts: one row per uploaded document; contract_text is the single
-- source of truth read by both the extraction pipeline and the chat route —
-- neither re-downloads the PDF from Storage.
create table if not exists contracts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  contract_type     contract_type_enum not null,
  file_name         text not null,
  file_path         text, -- null if Storage upload failed (non-blocking) — text-viewer fallback is used instead
  contract_text     text not null,
  page_count        int not null check (page_count > 0 and page_count <= 20),
  status            contract_status_enum not null default 'uploaded',
  last_accessed_at  timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_contracts_user_created on contracts (user_id, created_at desc);
create index if not exists idx_contracts_user_status on contracts (user_id, status);

-- key_terms: extraction results — standard and custom terms share this
-- table (is_custom distinguishes them), including any user-edited values.
create table if not exists key_terms (
  id                 uuid primary key default gen_random_uuid(),
  contract_id        uuid not null references contracts(id) on delete cascade,
  user_id            uuid not null references auth.users(id) on delete cascade,
  term_name          text not null,
  value              text not null,
  page_number        int not null check (page_number >= 1),
  confidence_score   numeric(5,2) not null check (confidence_score >= 0 and confidence_score <= 100),
  source_sentence    text not null,
  is_custom          boolean not null default false,
  edited             boolean not null default false,
  original_ai_value  text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_key_terms_contract on key_terms (contract_id);
create index if not exists idx_key_terms_user on key_terms (user_id);
create index if not exists idx_key_terms_low_confidence on key_terms (contract_id) where confidence_score < 50;

-- custom_key_terms: user-requested term names captured before processing
-- (up to 5 per contract, enforced at the API layer).
create table if not exists custom_key_terms (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references contracts(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  term_name    text not null,
  created_at   timestamptz not null default now(),
  unique (contract_id, term_name)
);

create index if not exists idx_custom_key_terms_contract on custom_key_terms (contract_id);

-- chat_sessions: one session per contract, created lazily on first message.
create table if not exists chat_sessions (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null unique references contracts(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists idx_chat_sessions_user on chat_sessions (user_id);

-- chat_messages: persisted chat turns, up to 200 loaded per session as
-- conversation context on every chat turn. context_source records which
-- Conversation Memory Layer context type (contract / history / both) an
-- assistant reply was generated from — null for user-authored rows.
create table if not exists chat_messages (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid not null references chat_sessions(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  role           chat_role_enum not null,
  content        text not null,
  page_citation  int,
  context_source chat_context_source_enum,
  created_at     timestamptz not null default now()
);

-- Idempotent for databases that ran an earlier version of this script
-- before context_source existed.
alter table chat_messages add column if not exists context_source chat_context_source_enum;

create index if not exists idx_chat_messages_session_created on chat_messages (session_id, created_at asc);

-- user_feedback: thumbs up/down + optional comment per contract review.
create table if not exists user_feedback (
  id           uuid primary key default gen_random_uuid(),
  contract_id  uuid not null references contracts(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  rating       feedback_rating_enum not null,
  comment      text check (comment is null or char_length(comment) <= 1000),
  created_at   timestamptz not null default now()
);

create index if not exists idx_user_feedback_contract on user_feedback (contract_id);

-- rate_limit_events: sliding-window rate limiting for lib/security/rateLimiter.ts.
-- Read and written exclusively via the service-role client (createAdminClient())
-- — no RLS policy grants the regular user role any access at all, so a
-- user cannot read, delete, or otherwise manipulate their own request
-- count. See docs/security/security-plan.md §3.
create table if not exists rate_limit_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  action     text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_rate_limit_events_lookup
  on rate_limit_events (user_id, action, created_at desc);

-- ----------------------------------------------------------------------------
-- 3. updated_at auto-update trigger
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_contracts_updated_at on contracts;
create trigger trg_contracts_updated_at
  before update on contracts
  for each row execute function set_updated_at();

drop trigger if exists trg_key_terms_updated_at on key_terms;
create trigger trg_key_terms_updated_at
  before update on key_terms
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- 4. term_corrections view — feeds the extraction-quality feedback loop
--    (engineering-doc §8: trigger a prompt review if correction rate
--    exceeds 12% of terms in any 7-day window).
-- ----------------------------------------------------------------------------
create or replace view term_corrections as
select
  id,
  contract_id,
  user_id,
  term_name,
  original_ai_value,
  value as corrected_value,
  updated_at
from key_terms
where edited = true;

-- ----------------------------------------------------------------------------
-- 5. Row Level Security — every table restricted to its owning user
-- ----------------------------------------------------------------------------
alter table contracts enable row level security;
alter table key_terms enable row level security;
alter table custom_key_terms enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table user_feedback enable row level security;
alter table rate_limit_events enable row level security;
-- No policies on rate_limit_events for the regular role — service-role
-- (createAdminClient()) only, by design. RLS being enabled with zero
-- policies means the table is fully inaccessible to anon/authenticated
-- roles, which is the intended "no user-facing policies" state.

drop policy if exists contracts_select_own on contracts;
create policy contracts_select_own on contracts for select using (auth.uid() = user_id);
drop policy if exists contracts_insert_own on contracts;
create policy contracts_insert_own on contracts for insert with check (auth.uid() = user_id);
drop policy if exists contracts_update_own on contracts;
create policy contracts_update_own on contracts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists contracts_delete_own on contracts;
create policy contracts_delete_own on contracts for delete using (auth.uid() = user_id);

drop policy if exists key_terms_select_own on key_terms;
create policy key_terms_select_own on key_terms for select using (auth.uid() = user_id);
drop policy if exists key_terms_insert_own on key_terms;
create policy key_terms_insert_own on key_terms for insert with check (auth.uid() = user_id);
drop policy if exists key_terms_update_own on key_terms;
create policy key_terms_update_own on key_terms for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists key_terms_delete_own on key_terms;
create policy key_terms_delete_own on key_terms for delete using (auth.uid() = user_id);

drop policy if exists custom_key_terms_select_own on custom_key_terms;
create policy custom_key_terms_select_own on custom_key_terms for select using (auth.uid() = user_id);
drop policy if exists custom_key_terms_insert_own on custom_key_terms;
create policy custom_key_terms_insert_own on custom_key_terms for insert with check (auth.uid() = user_id);
drop policy if exists custom_key_terms_delete_own on custom_key_terms;
create policy custom_key_terms_delete_own on custom_key_terms for delete using (auth.uid() = user_id);

drop policy if exists chat_sessions_select_own on chat_sessions;
create policy chat_sessions_select_own on chat_sessions for select using (auth.uid() = user_id);
drop policy if exists chat_sessions_insert_own on chat_sessions;
create policy chat_sessions_insert_own on chat_sessions for insert with check (auth.uid() = user_id);
drop policy if exists chat_sessions_delete_own on chat_sessions;
create policy chat_sessions_delete_own on chat_sessions for delete using (auth.uid() = user_id);

drop policy if exists chat_messages_select_own on chat_messages;
create policy chat_messages_select_own on chat_messages for select using (auth.uid() = user_id);
drop policy if exists chat_messages_insert_own on chat_messages;
create policy chat_messages_insert_own on chat_messages for insert with check (auth.uid() = user_id);

drop policy if exists user_feedback_select_own on user_feedback;
create policy user_feedback_select_own on user_feedback for select using (auth.uid() = user_id);
drop policy if exists user_feedback_insert_own on user_feedback;
create policy user_feedback_insert_own on user_feedback for insert with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. Storage bucket + policies
--    Object path pattern within the bucket: {user_id}/{contract_id}/{filename}.pdf
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('contracts', 'contracts', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "contracts_storage_insert_own" on storage.objects;
create policy "contracts_storage_insert_own" on storage.objects
  for insert
  with check (
    bucket_id = 'contracts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "contracts_storage_select_own" on storage.objects;
create policy "contracts_storage_select_own" on storage.objects
  for select
  using (
    bucket_id = 'contracts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "contracts_storage_delete_own" on storage.objects;
create policy "contracts_storage_delete_own" on storage.objects
  for delete
  using (
    bucket_id = 'contracts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- End of schema. Verify in the Supabase dashboard: Table Editor shows 7
-- tables (contracts, key_terms, custom_key_terms, chat_sessions,
-- chat_messages, user_feedback, rate_limit_events) + 1 view
-- (term_corrections), Storage shows the "contracts" bucket, and
-- Authentication > Policies shows RLS enabled on every table — with zero
-- policies on rate_limit_events by design (service-role only).
-- ============================================================================
