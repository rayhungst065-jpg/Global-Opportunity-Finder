# Roadmap — Targeted Explore, authentication and approved catalog

## Requested tasks
- [x] Reused Saved Opportunities workspace for Explore and detail pages; preserved existing sidebar, active navigation, search, filters, cards and saving. Desktop/tablet/mobile checked without horizontal content overflow.
- [x] Homepage opportunity/volunteer CTAs wait for existing auth and send signed-in users directly to Explore; signed-out users enter existing login with validated Explore return destination.
- [x] Approved rows were absent; imported 200 unique source-keyed, ownerless spreadsheet records into existing opportunities table after adding three missing category values and nullable source fields. Readback matched all mapped values and all 18 original fields exactly. Existing 15 rows, private AI records, saves and admin-only permissions preserved; no policy changes.
- [x] 34 focused tests passed. Existing Accounts A/B saw identical 200 listings and independently saved the same entry; other-account saves/history/private catalog reads returned no rows and shared catalog edits were denied. All six filters matched source counts. Detail return retained query/category and settled scroll position. Temporary test saves removed. Preview build OK; content route heads checked. No AI/provider/email changes or publishing.
- [x] Live creation of a personal AI search was not performed: no populated conversations existed for A/B and Gemini access was previously blocked; existing private history/catalog RLS was checked directly instead. Completion report notes this verification limitation.

## Current tasks
- [x] Account isolation: one guarded root identity boundary clears queries before identity publication and remounts local drafts; saved queries/writes explicitly owner-filtered. Existing owner/participant RLS confirmed. Two existing test accounts verified A→B→A and refresh, A two saves + profile update, B empty saves/deadlines and own profile; direct cross-account read/update/delete returned zero rows and forged save rejected. Catalog identical for both; no existing records deleted/reset.
- [x] Start Exploring replaces automatic dashboard matches only with no saves or recorded exploration. CTA verified /opportunities with empty search; actual visits persist owner exploration in existing preferences. Returning dashboards verified with saves and with visit/no saves. Limitation: historic unsaved catalog visits were never stored, so those accounts cannot be distinguished from never-explored accounts; no fabricated activity or schema added.
- [x] Photo validation accepts exactly 8 MB, rejects 8 MB + 1 byte and unsupported formats. Private bucket limit verified 8388608 bytes; restrictive INSERT/UPDATE format policies applied and verified without widening access. Direct JPEG/PNG/WebP upload succeeds; GIF fails. Real phone-size JPEG optimized to 400 × 400 WebP and uploaded/read back, square PNG/portrait WebP optimized, pre-existing B photo intact; temporary storage probes removed.
- [x] 26 focused tests passed; preview build OK; all 29 content route heads inspected. No AI/chat/provider/email changes or publishing. Test-account data modified only through acceptance checks; no real account edited.

## Previous audit

## Issues to fix (from uploaded brief)
- [x] Issue 1: assistant one-turn answers — raised maxOutputTokens 2048→8192 (reasoning+tool continuations share the budget; small cap ended turns with no final text); verified earlier turns produce full answers after tool calls; BLOCKED on full re-verify: Google returned "Gemini API free tier is not available for this project" (HTTP 403, persisted pause state) — needs Ray to restore API access; no billing enabled per standing rule
- [x] Issue 2: education label 高中 — root cause: <option> without value attribute + browser auto-translation stored translated text; fixed with explicit value attributes + shared English educationLevels list; existing row normalized to "High school"; verified dropdown is English-only
- [x] Issue 3: GOF Test Student A/B — added profiles.is_test_account, excluded in student_profile_cards/student_is_discoverable, marked A/B/Probe + E2E accounts; verified absent from Find Students
- [x] Issue 4: saved opportunities — audited: RLS owner-scoped on all four commands, inserts use auth.uid(), no cross-account rows exist (only Ray:3, Probe:1); no code change needed
- [x] Issue 5: cross-account activity — audited all personal tables (conversations, messages, chat recommendations, college preferences/research, messages, connections): all owner/participant-scoped; sign-out clears query cache; added cache clear on user-id change in _authenticated layout for switches without sign-out
- [x] Issue 6: full isolation audit — every personal table has owner RLS; shared catalog (opportunities/colleges/communities) is intentionally signed-in-readable; no search-history table exists (searches are not stored)
- [x] Issue 7: new-account E2E — registered fresh Accounts A and B (temporary auto-confirm, reverted after); A: onboarding, MESA search, 2 saves, saved/deadlines verified; B: empty saved/deadlines/assistant history, no A data, no test accounts, no Chinese labels; A→logout→B→logout→A switching with back/forward navigation kept data correct; assistant prompts blocked by the Gemini 403 above
- [x] Final report delivered in chat; 33 tests + typecheck + build all pass

## Preserved constraints
- Keep Gemini provider/model/config unchanged; no publishing; no email-system changes
- Never present demo data as real; do not delete real student accounts

## Prior roadmap (archived highlights)
- Brand, communities, messaging, college search, assistant streaming, welcome email all previously completed — see git history / archived plan
