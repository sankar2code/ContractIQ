# Spec: Authentication (US-001)

Source: `docs/engineering/engineering-doc.md` §4.1, §4.2, §6, §7.

## Overview

Email/password sign up, sign in, and sign out via Supabase Auth, called directly from the client (no Route Handler in the auth path itself). Session is a JWT in an httpOnly cookie managed by `@supabase/ssr`. Every authenticated page and API route independently re-verifies this session — there is no separate app-level user table; `auth.users` (managed by Supabase) is the sole identity store at MVP.

## Technical Requirements

- Auth flow (submit → redirect to `/dashboard`) must complete within 10 seconds (PRD §5 Performance constraints).
- Session is a JWT in an httpOnly cookie (`@supabase/ssr`) — never stored in `localStorage`/`sessionStorage`.
- Data encrypted at rest (AES-256) and in transit (TLS 1.3) — Supabase-managed, no additional app-level encryption needed (PRD §5 Reliability & security constraints).
- WCAG 2.1 AA: labelled inputs, full keyboard operability, visible focus states, `aria-live="polite"` error region.
- No custom rate limiting on auth endpoints at MVP — relies on Supabase Auth's built-in throttling.

## User Flow

1. Visitor on `/` clicks "Get Started Free" → sign-up form (email, password, confirm password) renders in `app/(auth)/sign-up/page.tsx` or a modal launched from the marketing page.
2. Client-side Zod validation: valid email format, password ≥ 8 chars.
3. Form calls `supabase.auth.signUp({ email, password })` directly from the browser client.
4. On success, Supabase sets the session cookie; app redirects to `/dashboard`.
5. Returning users use `/sign-in`, calling `supabase.auth.signInWithPassword(...)`.
6. Sign-out: a button calls `supabase.auth.signOut()` and redirects to `/`.
7. Invalid credentials render the exact Supabase error message inline under the form (e.g. "Invalid login credentials").

## Database

No custom tables. Supabase's built-in `auth.users` table is the identity store. Every other table's `user_id` column is a foreign key into `auth.users(id)` (see `supabase-schema.sql`). No migration needed beyond what's already in `supabase-schema.sql`.

## DB Tasks

- None beyond running `docs/specs/supabase-schema.sql` once (creates the FK targets other tables rely on).
- In the Supabase dashboard: Authentication > Providers, confirm "Email" provider is enabled (default) and "Confirm email" is set per product decision (recommend ON for production, can be OFF for local/dev testing to skip email verification friction).

## API Routes

None — auth is handled entirely client-side via the Supabase JS SDK. `middleware.ts` is the only "backend" piece:

```ts
// middleware.ts
// Redirects unauthenticated requests under (app)/** to /sign-in.
// Uses createServerClient from @supabase/ssr to read the session cookie.
export const config = { matcher: ['/dashboard/:path*', '/contracts/:path*'] }
```

Every Route Handler in every other spec independently calls a shared helper:

```ts
// lib/supabase/server.ts
export async function requireUser(req: Request): Promise<{ id: string } | null>
// Reads the session cookie via the server Supabase client, returns the user or null.
// Callers return 401 immediately if null — this is the auth check reused everywhere.
```

## State Management

- No TanStack Query needed for auth state itself — `supabase.auth.onAuthStateChange` drives a lightweight React context (`lib/supabase/auth-context.tsx`) exposing `{ user, isLoading }` to the app shell.
- `app/(app)/layout.tsx` reads this context; if `user` is null after loading, redirect client-side to `/sign-in` (belt-and-suspenders with `middleware.ts`).

## Component Spec

| Component | Props | Notes |
|---|---|---|
| `SignUpForm` | none | email/password/confirm fields, submit button, inline error region (`aria-live="polite"`) |
| `SignInForm` | none | email/password fields, "Forgot password?" link (out of scope for MVP — PRD does not require password reset; omit the link or point to a "contact support" mailto as a stopgap) |
| `SignOutButton` | none | in the app shell nav |

## Design

Per `docs/design.md`: forms use `Input`, `Button` (primary) from the shared `ui/` kit; error text in `--confidence-low` red; form card on `--bg-surface` over `--bg-page`; Instrument Sans throughout (no serif on auth screens — Newsreader is marketing-only).

## Acceptance Criteria

- [ ] User can sign up with a valid email + password (≥ 8 chars) and lands on `/dashboard` within 10s of submitting.
- [ ] User can sign in with existing credentials and lands on `/dashboard`.
- [ ] Invalid credentials show a clear, inline error message without a page reload.
- [ ] Signed-out users hitting any `(app)/**` route are redirected to `/sign-in`.
- [ ] Signed-in users can sign out and are redirected to `/`.
- [ ] A sign-up attempt with an already-registered email shows "User already registered" with a link to `/sign-in`.

## Edge Cases

- Duplicate email sign-up → surface Supabase's "User already registered" message with a link to `/sign-in`.
- Auth flow must complete ≤ 10s (PRD constraint) — show a loading state on the submit button beyond ~500ms.
- Session expiry mid-session (e.g. long-idle tab) → any API call returning `401` triggers a client-side redirect to `/sign-in` with a "Your session expired, please sign in again" toast, preserving the current contract id in a return-to query param where feasible.
