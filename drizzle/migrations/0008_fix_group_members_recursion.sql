create or replace function public.is_group_member(_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.collab_group_members
    where group_id = _group_id and user_id = auth.uid()
  )
$$;

drop policy members_read on public.collab_group_members;
create policy members_read on public.collab_group_members
  for select to authenticated using (public.is_group_member(group_id));

drop policy groups_read on public.collab_groups;
create policy groups_read on public.collab_groups
  for select to authenticated using (public.is_group_member(id));