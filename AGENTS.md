<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Homepage and About share one creator-introduction component and original-photo asset pointer; why: reuse the photo and layout while keeping short/full copy distinct and linking to one About anchor.
- Public opportunity reads go through `src/lib/opportunities.functions.ts` using the server-only admin client loaded inside read-only handlers; why: listing pages SSR without a session while the database has no anonymous read policy.
- Student-owned data (profiles, saved_opportunities) is read/written from the browser client under RLS; why: RLS scopes rows to auth.uid().
- Shared opportunity edits are admin-only via `public.has_role`; the assistant may insert NEW catalog rows only through `recommendOpportunity` (admin client, title dedupe, unverified, labeled estimates), and saves stay owner-scoped; why: auto-collect chat recommendations without duplicates while preserving verified deadlines and source integrity.
- Demo rows carry `is_demo = true` and must be labeled in the UI; why: never present fake opportunities as real.
- Profile pictures live in the private `avatars` bucket under `<user_id>/…`, shown via signed URLs; why: storage RLS limits access to the owner folder.
- Peer profile reads use the authenticated `student_profile_cards` RPC; direct profile reads are owner-only and avatar access follows shared-field visibility, so hidden fields cannot leak through direct database requests.
- Homepage feature login destinations use an explicit path allowlist; why: return students to the selected existing page without permitting external redirects.
- Group membership RLS uses security-definer `is_group_member`/`is_group_creator` functions, never self-referencing policies; why: a policy querying its own table causes infinite recursion, and insert policies can't read rows the read policy hides.
- Group creation generates the id in the server function and inserts without `.select()`; why: the read policy requires membership, which doesn't exist until after the owner row is inserted.
- Assistant history is stored in owner-scoped conversations/messages and replayed from storage through an authenticated streaming route; why: preserve private history without trusting a client-provided transcript.
- The assistant opts into a viewport-fitted WorkspaceShell with a flexible conversation area and nonshrinking composer; why: resizing or maximizing must keep input and Send reachable without changing other workspace pages.
- Assistant catalog saves require AI SDK tool approval and use the user's RLS client; why: restrict writes to explicit student-owned saves, never shared opportunity mutations.
- Assistant provider access blocks persist in server-owned access state; why: prevent reloads from retrying terminal provider denials.
- Assistant streams through the Google AI SDK in the existing authenticated handler, with provider-tagged access denials; why: preserve chat/tool persistence while preventing old-provider denials from blocking a provider change.
- College Search reads imported colleges through an authenticated database search function, preserving source rows and notes; why: database-side filtering/sorting without external API calls or inferred spreadsheet values.
- Historical college research is retained but has no active provider workflow; why: preserve user data while removing premium search access.
- AI responses use the shared direct Gemini provider with keys read inside authenticated handlers; why: preserve one model configuration without exposing credentials.
- Recommend stores owner-selected snapshots from persisted assistant recommendation tool outputs with RLS validation; why: preserve the original Gemini recommendation and reason without another model call or shared catalog mutation.
- Opportunity verification timestamps are separate from update timestamps and never backfilled from AI or ordinary edits; why: label unknown/stale evidence without silently changing deadlines.
- Password recovery uses Cloud Auth verification and updateUser on a public reset page; why: preserve provider token expiry and avoid a separate password system.
- Private student messages are one-to-one rows readable by participants and insertable only by the sender to an accepted friend (`are_friends`); connection participants are immutable via trigger and pairs are unique; why: friendships and messages cannot be forged from the client.
- Welcome emails are claimed in the server-only `welcome_emails` table (no client policies) before sending with a per-user idempotency key, triggered from the authenticated layout once per session; why: send exactly once per confirmed account without user-editable flags. Accounts that existed before this feature were pre-marked.
