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
- Ordinary opportunity writes are admin-only via `public.has_role`; only the authenticated server search process may ingest or refresh exact extracted official-source records using the privileged client, never client-submitted catalog fields; why: preserve catalog integrity while enabling real online discovery.
- Demo rows carry `is_demo = true` and must be labeled in the UI; why: never present fake opportunities as real.
- Profile pictures live in the private `avatars` bucket under `<user_id>/…`, shown via signed URLs; why: storage RLS limits access to the owner folder.
- Group membership RLS uses security-definer `is_group_member`/`is_group_creator` functions, never self-referencing policies; why: a policy querying its own table causes infinite recursion, and insert policies can't read rows the read policy hides.
- Group creation generates the id in the server function and inserts without `.select()`; why: the read policy requires membership, which doesn't exist until after the owner row is inserted.
- Assistant history is stored in owner-scoped conversations/messages and replayed from storage through an authenticated streaming route; why: preserve private history without trusting a client-provided transcript.
- Assistant catalog saves require AI SDK tool approval and use the user's RLS client; why: restrict writes to explicit student-owned saves, never shared opportunity mutations.
- Assistant provider access blocks persist in server-owned access state; why: prevent reloads from retrying terminal provider denials.
- Assistant streams through the Google AI SDK in the existing authenticated handler, with provider-tagged access denials; why: preserve chat/tool persistence while preventing old-provider denials from blocking a provider change.
- Online discovery is shared by recommendations and the assistant through a server-only Parallel search/extract/research helper; why: expose the same exact accessible sources and catalog IDs without duplicating search logic or exposing keys.
- Recommended for Me loads profile-matched catalog records first and invokes online discovery only on explicit user action; why: page visits and reloads must not automatically start paid searches.
- Password recovery uses Cloud Auth verification and updateUser on a public reset page; why: preserve provider token expiry and avoid a separate password system.
