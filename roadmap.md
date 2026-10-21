# Roadmap — Brand & Communities Update

## Focused fixes
- [ ] Image-only restoration: original hero.jpg, volunteer.jpg, competitions.jpg, research.jpg and awards.jpg are retained; narrow audit found no other image replacements. Blocked: available documented undo restores a project version, user forbids full-project revert and agent instructions prohibit code-based undo. No application edits, new images, or publishing; restored preview cannot be verified until an image-only restoration is applied.
- [x] Sender DNS verified; disposable inbox actually received signup and password-reset emails from default auth sender; signup link verified, unconfirmed login blocked, consumed/invalid links rejected, password changed through UI and new login passed; no real-user emails
- [ ] Auth email branding, intended welcome email, Gmail-specific delivery and exact expiry boundary — custom auth templates/welcome do not exist, no authorized Gmail inbox, hosted expiry settings unavailable; no speculative feature changes
- [x] Existing standalone local AI Chat sent real Gemini message, displayed reply, retained it after reload; HTTP 200, no alerts or browser errors; no security/design changes
- [ ] Compare actual editor preview vs external-tab Chat — custom domain returns no published build (404), external preview redirects to Lovable viewer login; needs authorized external preview access, no automatic publishing or guessed fix
- [x] Added exact homepage/About creator introductions and original photo, existing About anchor links, and Feedback & Support navigation/contact links; signed-in desktop/mobile navigation, undistorted whole-photo layouts, preserved platform introduction/quote, exact mailto and Google Form new-tab navigation passed; routing test passed and preview build OK; no AI/premium calls or publishing
- [x] Targeted About/homepage labels and whole-section/CTA links with post-login return; both signed-out returns and signed-in CTAs verified
- [x] Two isolated test accounts: two-way discovery/search, request/accept, friend cards, refresh/re-sign-in persistence, discovery opt-out, hidden raw profile fields and avatar denial verified; 6 focused tests passed
- [x] Student discovery cards, full profiles, Bio (Skills removed), Country, friend requests and private messaging; two test accounts verified request/accept, duplicate/spoof/participant-change rejection, two-way messages, persistence after reload, desktop/mobile
- [x] Full E2E: remove/re-request/decline/cancel/accept lifecycle, two-way chat with timestamps, persistence after reload and re-sign-in, third-account read/send isolation, non-friend and spoofed-sender blocks, real friend request sent to Ray's account (26/26 checks); homepage "In development" badge removed
- [x] Targeted College Search cleanup: removed preferences/text input, preserved database filters/cards and existing numeric QS sort with missing ranks last, replaced notice; 6 focused tests and signed-in filters/sort/pagination/clear/cards checks passed with no AI/premium requests
- [x] Imported all 617 university rows and 17 spreadsheet notes, omitted blank rows, retained original values; signed-in database search, Canada filter and exact-rank sorting verified
- [x] Original Gemini chat recommendation saved privately to Recommend, survived reload, and removed without deleting chat or another Gemini generation; real signed-in flow verified
- [x] Removed all executable Parallel calls; linked connection retained for optional manual disconnection; 21 focused tests passed and preview build OK
- [x] Checked official Gemini pricing without AI/Parallel requests: gemini-3.8-flash Search grounding is unavailable on Free Tier; no grounding test or billing change
- [ ] Existing Google project billing status — cannot inspect without accessible Google billing metadata; previous successful chat does not prove Free Tier
- [x] Gemini-first implementation: removed general opportunity Parallel access; preserved stored recommendations/saves and deadlines
- [x] Historical College Research results retained; premium workflow retired in favor of imported database-only College Search
- [x] 23 focused tests passed for no-network discovery, bounded mocked research, cache reuse/denials and deadline evidence; signed-in page reload/preference save and mobile layout checked without premium calls; preview build OK
- [x] College Research provider verification no longer applicable: premium workflow removed, no Parallel requests made
- [x] New Gemini recommendation-save round trip verified with one real student request; no new billing or paid services enabled
- [x] Assistant switched to direct Gemini gemini-3.8-flash using existing secret; real signed-in reply and persistence verified without Parallel searches (2.5 Flash returned retirement 404)
- [x] Limited repair to Recommended for Me and Browse Opportunities; stored matches survive reload, Browse search/category filters verified, demos opt-in, no paid searches run
- [x] Real online recommendation retrieval through connected Parallel; extracted official links and real catalog save verified
- [x] Original symbol plus readable brand name; Capstone footer sentence removed
- [x] Assistant real search returned FRC/FTC organizer links inline; both official URLs returned HTTP 200
- [x] Provider recovery request accepted (HTTP 200); generic response and invalid/expired-link rejection verified
- [x] Recovery email receipt and password change verified with a disposable inbox; delivered recovery token accepted through reset UI and new password login passed
- [ ] Hosted redirect allowlist and expiry duration — no hosted settings read available; do not infer settings from local success

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

- [x] Removed Recommended for Me page/nav; chat recommendations auto-collect into Explore Opportunities (title-deduped); one Save rule via saved_opportunities; estimated-deadline labels; dashboard section renamed Explore Opportunities

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
- [x] Privacy remediation — direct profiles owner-only, peer cards use visibility-safe authenticated RPC, avatar sharing follows visibility; two-test-account checks passed
