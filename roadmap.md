# Roadmap

## Replace Gemini with Lovable AI (current)
- [x] Install @lovable.dev/ai-gateway, generate Haiku Messages contract
- [x] Shared monthly usage table + service-only accounting RPC (migration 0024)
- [x] Owner-only private opportunity insert policy (migration 0024)
- [x] Budget helper ($10/month, UTC reset) + Messages adapter + tests
- [x] Rewrite assistant.server.ts: Claude Haiku via gateway, web search (max 3), budget guard, usage recording, saveResearchedOpportunity tool
- [x] Policy/UI/privacy copy updates; Explore shows own private rows; card badge
- [x] Remove Gemini provider file + @ai-sdk/google
- [x] Full suite 78 passed; typecheck clean; build OK
- [ ] Live E2E: real answer, budget display, web research, approval save, private Explore row, budget block
- [ ] Note: no workspace-level AI spending limit exists; app-level budget is the guard
