# Roadmap
- [x] Phase 1: Public website
- [x] Design revision: cinematic homepage, complete sidebar (Meet Students / College Match placeholders)
- [x] Phase 2: Accounts, onboarding, opportunities, saved, deadlines
- [x] Phase 3 Stage 1–2: Inspection, profile pictures, full profile, privacy settings, dashboard
- [x] Phase 3 Stage 3: Communities, proposals, admin review, memberships
- [ ] Phase 3 Stage 4: Meet Students, connection requests, block/report
- [ ] Phase 3 Stage 5: Events

## UI Redesign (done 2026-10-16)
- [x] New palette: violet/coral/teal/lavender/cream tokens in styles.css
- [x] Sidebar: icons, avatar+name dropdown (View/Edit Profile, My Connections, Settings, Log Out); "My Profile" removed from nav
- [x] Profile page: view mode (student-style) vs edit mode (?edit=true)
- [x] Dashboard: compact completion strip, deadlines/saved/recommended, quick links
- [x] Homepage: color accents, gradient washes, per-category accents (9 sections kept)
- [ ] My Connections: no connections backend exists yet — dropdown links to Meet Students placeholder (Stage 4)

## Coffee redesign + feature completion (done 2026-10-16)
- [x] Coffee palette (espresso/coffee/caramel/cream/latte/sage/terracotta) across whole app
- [x] Homepage headline + buttons updated; 9 sections kept
- [x] Settings control center: Account, Profile, Privacy, Preferences, Notifications (honest), Connections & safety
- [x] Meet Students: discovery directory, filters, connection requests (send/accept/decline/cancel/remove), connections table + RLS, server-side field privacy
- [x] College Match: preferences form (college_preferences table); results pending a verified college dataset
- [ ] Blocking/reporting (planned before messaging)
- [ ] Notifications (not built — no fake toggles)
- [ ] Account deletion self-serve (contact page for now)
- [ ] End-to-end connection test between two accounts (needs a second discoverable student)
