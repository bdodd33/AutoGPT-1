# IdeaBrowser

A personal, self-hostable take on [ideabrowser.com](https://ideabrowser.com): a daily,
deeply-researched startup-idea database with AI analysis and real-data demand signals.
Built to run for yourself first, with a clean path to turning on paid subscriptions later.

## What's here

- **Idea of the Day** + an **Idea Database** of researched ideas (`/dashboard`, `/database`)
- **Deep-dive idea pages** with the full analysis: Why Now, Proof Signals, Market Gap,
  Value Ladder, Value Equation, Value Matrix, ACP, Execution Plan, Community Signals,
  Keywords (`/idea/[slug]`)
- **Idea scores** (opportunity, problem severity, feasibility, timing, revenue, overall)
- **Idea Agent** — type any idea and stream a full AI research report (`/agent`)
- **Admin generator** — generate + publish researched ideas from a seed topic (`/admin`)
- **Daily cron** to auto-generate the Idea of the Day (`/api/cron/daily-idea`)

### Stack

Next.js 16 (App Router) · Supabase (Postgres + Auth) · Claude (`claude-opus-4-8`) · Tailwind 4.
Stripe subscriptions are scaffolded in the schema and env but intentionally **off** until
you're ready for a public launch.

## Runs out of the box

The app works **with no configuration** — it serves bundled seed ideas and disables the
AI features. Add keys to unlock the rest:

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev                  # http://localhost:3000
```

| Capability | Needs |
|---|---|
| Browse seed ideas | nothing |
| AI Idea Agent + idea generation | `ANTHROPIC_API_KEY` |
| Persist generated ideas, auth | Supabase keys (`NEXT_PUBLIC_SUPABASE_URL`, `..._ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) |
| Real demand signals | nothing (Reddit/Trends are public); `YOUTUBE_API_KEY` optional |

## Supabase setup

A live project (`ideabrowser`, ref `iyyjmxmzskcyrubrrgcy`) is already provisioned with
migrations 0001–0003 applied and the security advisors clean. `.env.local` (untracked)
carries the URL + anon key; copy the **service_role** key from
Supabase dashboard → Project Settings → API keys into `SUPABASE_SERVICE_ROLE_KEY`
to enable idea persistence from the admin generator and cron.

To recreate from scratch: run the files in `supabase/migrations/` in order.

**Admin bootstrap:** the *first* account to sign up automatically becomes the admin
(migration 0003) — sign up yourself before sharing the URL. Later accounts are
regular users; promote with
`update profiles set role = 'admin' where email = 'you@example.com';`

## Auth

- `/login` — password sign-in, sign-up, and magic-link tabs (Supabase Auth).
- `/auth/callback` — code exchange for magic links / email confirmation.
- Nav shows Sign in / Sign out based on session (refreshed by `proxy.ts`).
- Gating once Supabase is configured: `/admin` + generation API are admin-only;
  the Idea Agent requires sign-in and persists runs to `agent_runs`; “Save idea”
  bookmarks to `saved_ideas` (see `/saved`). In seed-data mode everything stays
  open since there's nothing to protect.

Row Level Security is enabled: published ideas are public; drafts and all writes are
admin-only; saved ideas and agent runs are owner-scoped. This is what makes the
"personal now, public later" switch a config change rather than a rewrite.

## Architecture

```
app/                      Next.js App Router (pages + API route handlers)
  api/agent/              streaming research agent
  api/admin/generate/     generate + save an idea
  api/cron/daily-idea/    daily Idea-of-the-Day generation (CRON_SECRET-protected)
components/               UI (cards, score badges, markdown renderer, nav)
lib/
  ai/                     Claude client + idea-generation pipeline
  signals/                Reddit / Google Trends / YouTube connectors (best-effort)
  data/                   data access (Supabase with seed-data fallback) + seed ideas
  supabase/               browser + server clients, env, config
proxy.ts                  Supabase session refresh (Next 16 renamed middleware → proxy)
supabase/migrations/      Postgres schema + RLS
```

## Roadmap

- **Phase 4 — Monetization:** Stripe products/prices, checkout, customer portal, webhook →
  `subscriptions`, and plan-based gating. Env placeholders are already in `.env.example`.
- Auth UI (Supabase email/OAuth), founder-fit settings, saved-ideas page, SEO/OG for idea
  pages, and rate limits on the agent before public launch.

## Notes

- The admin generate endpoint (`/api/admin/generate`) is currently unauthenticated for
  personal local use. **Gate it behind an admin check before exposing it publicly.**
- `claude-opus-4-8` is used for deep generation; swap to `claude-haiku-4-5` for cheaper
  enrichment as volume grows (see `lib/ai/anthropic.ts`).
