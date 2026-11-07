# Roadmap — Replace Gemini with Lovable AI (Opportunity Search only)

- [ ] Inspect SDK Messages surface (tools, web_search, usage events)
- [ ] Generate gateway types for chosen model
- [ ] DB: global monthly AI usage table + atomic increment + RLS (budget $10/mo ≈ 10 credits)
- [ ] Rewrite assistant.server.ts: Lovable AI streaming, tool loop, web search, budget guard, usage recording
- [ ] Assistant UI: budget display `$X.XX used / $10.00 monthly limit`, update privacy notice copy
- [ ] Remove GEMINI_API_KEY dependency from assistant feature
- [ ] Focused unit tests (budget guard, adapter, dedup)
- [ ] Live test: search works, personal results private, save/dedup, budget blocks at limit, two-account isolation, other pages unaffected
- [ ] Update AGENTS.md + memory (provider change)
- [ ] Report: files changed, budget method, model, test results
- Constraints: no publish, no credit purchases, no auto top-ups, no unrelated changes
