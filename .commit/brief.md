# Core Intent

PROBLEM: K-beauty brands struggle to discover and evaluate authentic creators across YouTube, TikTok, and Instagram, and to run sponsorship challenges with verified applicants.

FEATURES:
- Multi-platform creator discovery and analytics (YouTube/TikTok/Instagram sync, sentiment + brand extraction)
- Sponsorship challenge marketplace with creator applications, verification, and selection workflow
- Energy-based usage economy (daily free quota + purchased credits) gating analyses and applications

TARGET_USER: K-beauty brand managers and marketers running creator-led campaigns in Korea/Asia, plus the creators (YouTubers/TikTokers/Instagrammers) applying to those challenges.

# Stack Fingerprint

RUNTIME: Node 20 + TypeScript 5 (frontend) · Deno (edge functions)

FRONTEND: React 18 + Vite 5 + Tailwind CSS 3 + shadcn/ui (Radix) + react-router-dom 6 + TanStack Query 5

BACKEND: Supabase Postgres + Edge Functions (Deno) + Row-Level Security · 9 edge functions (youtube-sync, tiktok-sync, instagram-sync, *-search, analyze-sentiment, extract-brands, translate-content)

DATABASE: Postgres · ~11 tables (creators, videos, comments, challenges, applications, profiles, user_roles, energy ledger, etc.) · 24 RLS policies · 29 SQL migrations · trigger-maintained `current_applicants` counter

INFRA: Lovable hosting (Vite build) at linkkbeauty.com · Supabase managed backend · no explicit CI workflow in repo

AI_LAYER: LLM-based comment sentiment analysis and brand-mention extraction from video metadata, invoked from sync pipelines via server functions (analyze-sentiment, extract-brands); content translation function for cross-locale strings.

EXTERNAL_API: YouTube Data API v3 · RapidAPI (instagram-scraper-api2, tiktok-api23) · Supabase Auth · Lovable AI Gateway

AUTH: Supabase Auth (email/password) with separate `user_roles` table + `has_role` security-definer function; user-type selection (creator vs general) gates challenge applications

SPECIAL: Bio-keyword social handle verification (LINKK_XXXXXX token in profile bio); energy system with daily 13 free + purchased credits; trigger-based applicant counting to avoid count() queries

# Failure Log

## Failure 1

SYMPTOM: Applicant counts on challenge cards drifted from reality and recomputing them with `count()` per card was slow and inconsistent across views.

CAUSE: Count was being derived dynamically from the applications table on read, causing race conditions vs. cache and N+1 queries on list pages.

FIX: Introduced a `current_applicants` column on challenges and a Postgres trigger that increments/decrements it on application insert/delete; all UI reads the column directly.

PREVENTION: Memory rule recorded — "Application count uses `current_applicants` column (updated via trigger), do not calculate dynamically." Format rule "selected/total/max" also locked in.

## Failure 2

SYMPTOM: Social handle verification was inconsistent — users entered `@username`, sometimes without `@`, and the bio-keyword check failed on whitespace/casing variations.

CAUSE: Handle normalization happened in multiple places (form, edge function, display) with diverging rules; bio fetch from RapidAPI returns varying field names per platform (`signature` vs `biography` vs `description`).

FIX: Centralized handle handling — input strips leading `@`, UI re-prefixes `@` for display; verification edge function checks against multiple possible bio fields and a stable LINKK_XXXXXX token.

PREVENTION: Memory rule — "Social media handles are input without `@`; UI adds `@` and strips it from input." Verification token format standardized.

# Decision Archaeology

## Decision 1

ORIGINAL_PLAN: Single-platform (YouTube only) creator analytics via official YouTube Data API.

REASON_TO_CHANGE: Brand customers needed TikTok and Instagram coverage, but those platforms have no comparable free official API; AI suggested RapidAPI scraper endpoints as the pragmatic path.

FINAL_CHOICE: Multi-platform via YouTube Data API + RapidAPI (instagram-scraper-api2, tiktok-api23), unified into one `creators`/`videos`/`comments` schema with a `platform` column.

OUTCOME: Coverage achieved, but introduced fragility (third-party scrapers can break, field names differ per platform) and per-call cost. Acceptable trade-off for MVP.

## Decision 2

ORIGINAL_PLAN: Store user role on the `profiles` table for simplicity.

REASON_TO_CHANGE: Known privilege-escalation risk and Supabase guidance against role-on-profile; AI flagged it during schema work.

FINAL_CHOICE: Separate `user_roles` table + `app_role` enum + `has_role(uuid, app_role)` SECURITY DEFINER function used in RLS policies.

OUTCOME: Safer policies, no recursive RLS, but more boilerplate for every role check; worth it.

# AI Delegation Map

| Domain | AI % | Human % | Notes |
|--------|------|---------|-------|
| DB Schema Design | 60 | 40 | AI drafted 29 migrations; human directed user_roles split, current_applicants trigger |
| RLS / Security Policies | 70 | 30 | AI generated 24 policies; human reviewed has_role pattern |
| React Components / UI | 75 | 25 | shadcn scaffolds + AI; human enforced rounded buttons, mobile dialog padding, Cancel-below rule |
| Edge Functions (sync/AI) | 80 | 20 | AI wrote YouTube/TikTok/Instagram sync; human chose RapidAPI hosts and field fallbacks |
| Energy / Business Logic | 40 | 60 | Human-defined 13/day quota and consumption order; AI implemented |
| Social Verification Flow | 50 | 50 | Token format and `@` handling driven by human after failures |
| Design System (tokens) | 65 | 35 | AI wired Tailwind tokens; human set brand color and rounded-full button rule |
| Deployment / Domain | 20 | 80 | Human connected linkkbeauty.com and GitHub repo |

# Live Proof

DEPLOYED_URL: https://linkkbeauty.com (also https://k-beauty-lens.lovable.app)

GITHUB_URL: https://github.com/hans1329/k-beauty-lens

API_ENDPOINTS: Supabase Edge Functions under project ref `aeyyzppqymrqmezbbcaq` — `/functions/v1/youtube-sync`, `/tiktok-sync`, `/instagram-sync`, `/analyze-sentiment`, `/extract-brands`, `/translate-content`, `/instagram-search`, `/tiktok-search`, `/sync-youtube-data`

CONTRACT_ADDRESSES: ?

OTHER_EVIDENCE: 29 migrations and 9 edge functions in repo; commit.show prior audit at commit.show/projects/f6e31e9d-fbc5-4fe8-a17a-6ef4474592a6 (score 6/100, grade walk-on). No verifiable user/tx counts.

# Next Blocker

CURRENT_BLOCKER: knowledge + technical — zero automated tests for 156 source files; sync edge functions silently swallow third-party API field-shape changes, so RapidAPI breakage is only caught in production.

FIRST_AI_TASK: Add a Vitest setup and write contract tests for the three sync edge functions (`youtube-sync`, `tiktok-sync`, `instagram-sync`) using recorded JSON fixtures of each upstream response, asserting that `creators` and `videos` upsert payloads have all required fields populated; wire `bun run test` into the build script.

# Integrity Self-Check

PROMPT_VERSION: commit-brief/v1.3

VERIFIED_CLAIMS:
- 9 edge functions: directly listed under `supabase/functions/` (analyze-sentiment, extract-brands, instagram-search, instagram-sync, sync-youtube-data, tiktok-search, tiktok-sync, translate-content, youtube-sync)
- 29 SQL migrations: counted in `supabase/migrations/`
- React 18 + Vite + Tailwind + shadcn/Radix + TanStack Query + react-router 6: from `package.json`
- RapidAPI hosts (`instagram-scraper-api2.p.rapidapi.com`, `tiktok-api23.p.rapidapi.com`): seen in `supabase/functions/instagram-sync/index.ts` and `tiktok-sync/index.ts`
- YouTube Data API v3 usage: `supabase/functions/sync-youtube-data/index.ts`
- Sentiment + brand extraction triggered from sync functions: `supabase.functions.invoke('analyze-sentiment' / 'extract-brands')` calls in tiktok-sync and instagram-sync
- `platform` column and unified creators/videos/comments schema: visible in upsert payloads
- Domain linkkbeauty.com and repo `hans1329/k-beauty-lens`: from project URLs and prior chat
- Memory-recorded rules (current_applicants trigger, handle `@` handling, energy 13/day, user_roles separation): present in mem://index.md

UNVERIFIABLE_CLAIMS:
- Exact 11 tables / 24 RLS policies counts (carried over from prior commit.show audit summary, not re-counted from migrations in this pass)
- AI %/Human % split numbers in delegation map (estimated, not measurable)
- Commit-by-commit narrative of Failure 1 and Failure 2 (reconstructed from memory rules + code shape, not from git log inspection)
- Real user counts, revenue, or production traffic
- Whether RapidAPI scraper instability has actually caused production incidents

DIVERGENCES: none observed — the user supplied the template verbatim and did not bias answers. Brief avoids claiming tests, CI, or payments that are not in the repo.

CONFIDENCE_SCORE: 6
