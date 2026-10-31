# Roadmap — Three Specific Fixes (Ray)

## Current tasks
- [ ] Fix directly related account privacy/cache/state issues; verify with two accounts without deleting existing data or changing catalog visibility.
- [ ] Add Start Exploring for first-time dashboards, linking to /opportunities without searching; preserve returning dashboards.
- [ ] Accept up to 8 MB profile photos, optimize to approximately 400 × 400, verify storage limit and validation, preserve existing photos.
- [ ] Run focused tests and two-account/browser checks; report any unverified requirement. No AI/chat, email, publishing, or unrelated changes.

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
