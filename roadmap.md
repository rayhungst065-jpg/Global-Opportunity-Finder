# Roadmap — Stability & Account-Isolation Audit (Ray's testing brief)

## Issues to fix (from uploaded brief)
- [ ] Issue 1: AI assistant runs tools but no final answer in same turn — investigate Gemini tool-loop/stream handling; answer must come in one turn; no raw tool logs as final response
- [ ] Issue 2: Education level shows Chinese (高中) instead of "High School" in Find Students dropdown — enforce stable internal values + English labels; check other dropdowns
- [ ] Issue 3: GOF Test Student A/B visible in Find Students — exclude test accounts (is_test_account flag or equivalent); check other test/demo records
- [ ] Issue 4: Saved opportunities leaking across accounts — audit saved_opportunities RLS + queries, user_id = auth.uid()
- [ ] Issue 5: Search history / personal activity across accounts — audit AI conversations, recommendations, preferences, cache keys, logout state clearing
- [ ] Issue 6: Full account-isolation audit — dashboard, assistant, explore, saved, deadlines, communities, students, college search, settings, feedback; RLS on all personal tables
- [ ] Issue 7: New-account E2E testing — Account A/B scenarios, account switching, AI assistant prompts
- [ ] Final report: issue / root cause / fix / DB-RLS changes / testing / result per item

## Preserved constraints
- Keep Gemini provider/model/config unchanged; no publishing; no email-system changes
- Never present demo data as real; do not delete real student accounts

## Prior roadmap (archived highlights)
- Brand, communities, messaging, college search, assistant streaming, welcome email all previously completed — see git history / archived plan
