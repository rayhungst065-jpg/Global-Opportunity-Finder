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
- Public opportunity reads go through `src/lib/opportunities.functions.ts` (publishable-key server client) so listing pages SSR; why: anon RLS read policy, no session on server.
- Student-owned data (profiles, saved_opportunities) is read/written from the browser client under RLS; why: RLS scopes rows to auth.uid().
- Shared opportunity writes are admin-only via `public.has_role`; assistants reuse existing IDs and save owner-scoped references, never AI-generated catalog fields; why: avoid duplicates and preserve verified deadlines and source integrity.
- Demo rows carry `is_demo = true` and must be labeled in the UI; why: never present fake opportunities as real.
- Profile pictures live in the private `avatars` bucket under `<user_id>/…`, shown via signed URLs; why: storage RLS limits access to the owner folder.
- Group membership RLS uses security-definer `is_group_member`/`is_group_creator` functions, never self-referencing policies; why: a policy querying its own table causes infinite recursion, and insert policies can't read rows the read policy hides.
- Group creation generates the id in the server function and inserts without `.select()`; why: the read policy requires membership, which doesn't exist until after the owner row is inserted.
- Assistant history is stored in owner-scoped conversations/messages and replayed from storage through an authenticated streaming route; why: preserve private history without trusting a client-provided transcript.
- Assistant catalog saves require AI SDK tool approval and use the user's RLS client; why: restrict writes to explicit student-owned saves, never shared opportunity mutations.
- Assistant provider access blocks persist in server-owned access state; why: prevent reloads from retrying terminal provider denials.
- Assistant streams through the Google AI SDK in the existing authenticated handler, with provider-tagged access denials; why: preserve chat/tool persistence while preventing old-provider denials from blocking a provider change.
- College Search reads imported colleges through an authenticated database search function, preserving source rows and notes; why: database-side filtering/sorting without external API calls or inferred spreadsheet values.
- Historical college research is retained but has no active provider workflow; why: preserve user data while removing premium search access.
- AI responses use the shared direct Gemini provider with keys read inside authenticated handlers; why: preserve one model configuration without exposing credentials.
- Recommend stores owner-selected snapshots from persisted assistant recommendation tool outputs with RLS validation; why: preserve the original Gemini recommendation and reason without another model call or shared catalog mutation.
- Opportunity verification timestamps are separate from update timestamps and never backfilled from AI or ordinary edits; why: label unknown/stale evidence without silently changing deadlines.
- Password recovery uses Cloud Auth verification and updateUser on a public reset page; why: preserve provider token expiry and avoid a separate password system.
