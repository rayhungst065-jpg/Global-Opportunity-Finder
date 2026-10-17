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
- Opportunity writes are admin-only via `public.has_role`; roles live in `user_roles`; why: prevents privilege escalation.
- Demo rows carry `is_demo = true` and must be labeled in the UI; why: never present fake opportunities as real.
- Profile pictures live in the private `avatars` bucket under `<user_id>/…`, shown via signed URLs; why: storage RLS limits access to the owner folder.
- Group membership RLS uses security-definer `is_group_member`/`is_group_creator` functions, never self-referencing policies; why: a policy querying its own table causes infinite recursion, and insert policies can't read rows the read policy hides.
- Group creation generates the id in the server function and inserts without `.select()`; why: the read policy requires membership, which doesn't exist until after the owner row is inserted.
