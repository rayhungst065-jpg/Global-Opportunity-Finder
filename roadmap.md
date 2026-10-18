# Roadmap — Brand & Communities Update

## Focused fixes
- [ ] New request: replace College Research with database-only College Search using the user's Excel college data; locate dataset before importing
- [ ] New request: save original Gemini chat recommendations privately into Recommend with removal, without a second AI call
- [ ] New request: remove feature-level Parallel calls, preserve unrelated connections, and test the three affected flows only
- [x] Checked official Gemini pricing without AI/Parallel requests: gemini-3.8-flash Search grounding is unavailable on Free Tier; no grounding test or billing change
- [ ] Existing Google project billing status — cannot inspect without accessible Google billing metadata; previous successful chat does not prove Free Tier
- [x] Gemini-first implementation: removed general opportunity Parallel access; preserved stored recommendations/saves and deadlines
- [x] Isolated premium Parallel to explicit College Research; added owner-saved results and atomic concurrency/daily reservations; Gemini interprets source excerpts
- [x] 23 focused tests passed for no-network discovery, bounded mocked research, cache reuse/denials and deadline evidence; signed-in page reload/preference save and mobile layout checked without premium calls; preview build OK
- [ ] Real College Research provider response and saved-result round trip — requires an explicitly approved premium test; no development Parallel/Gemini requests made
- [ ] New assistant recommendation-save round trip — existing approval/save path retained, not retested with paid Gemini inference
- [x] Assistant switched to direct Gemini gemini-3.8-flash using existing secret; real signed-in reply and persistence verified without Parallel searches (2.5 Flash returned retirement 404)
- [x] Limited repair to Recommended for Me and Browse Opportunities; stored matches survive reload, Browse search/category filters verified, demos opt-in, no paid searches run
- [x] Real online recommendation retrieval through connected Parallel; extracted official links and real catalog save verified
- [x] Original symbol plus readable brand name; Capstone footer sentence removed
- [x] Assistant real search returned FRC/FTC organizer links inline; both official URLs returned HTTP 200
- [x] Provider recovery request accepted (HTTP 200); generic response and invalid/expired-link rejection verified
- [ ] Recovery email receipt, password change and redirect allowlist — needs the user to follow the emailed link; hosted redirect settings are not accessible through current tools

## Done
- [x] Logo assets (full + symbol) via lovable-assets; favicon from symbol; brand renamed to Global Opportunity Finder
- [x] Navy/ivory/blue/coral/sage palette in styles.css
- [x] Homepage headline + slogan per brief; nine-section design kept
- [x] Split-screen login/signup with full logo
- [x] Footer: About, Support, Privacy, Terms only; About rewritten; new Support page
- [x] Communities: exactly two tabs (Discover Communities, Posts); posts table + create/edit/close; student discovery in Discover Communities; real approved-member counts on cards
- [x] Meet Students: exactly three tabs (Messages placeholder, Friends, Groups); private collab groups with invite/accept/remove/leave; explainer + "Explore Communities" link
- [x] RLS fixed for groups (is_group_member / is_group_creator security-definer functions)
- [x] Verified: logo placements, palette, auth pages, tabs, post + group creation, mobile homepage — no page errors

## Remaining
- [x] Exact new homepage/auth messaging; original logos retained; desktop/mobile pages inspected
- [x] Substantive Privacy and Terms based on actual implementation; outstanding legal/privacy requirements disclosed
- [x] Authenticated streaming Gemini assistant with stored history, summaries, retained older chats and profile/catalog tools
- [x] Real AI requests verified: profile-aware plans, multi-turn history after refresh, summary persistence and previous-chat selection
- [x] Approved catalog save verified through the assistant and existing Saved Opportunities screen (labeled DEMO test record)
- [x] Desktop/mobile overflow checks and routing/privacy-helper regression tests passed; preview build OK
- [x] Parallel connected; real source extraction, recommendations and catalog saving verified
- [ ] Cross-account assistant isolation and Stop/denial-state end-to-end verification — not exercised; owner policies and Stop propagation implemented
- [ ] Legal launch readiness — needs operator/contact, age/guardian policy, jurisdiction, retention/deletion/provider disclosures and legal review
- [ ] Two-account handshake test (connection request → accept → group invite) — needs a second account
- [ ] Blocking/reporting users, notifications, self-serve account deletion
- [x] Real extracted official-source records added without changing existing demo records or accounts
- [ ] Privacy remediation — discoverable profile rows expose more fields than the UI; authenticated avatar read policy broader than owner-folder design
