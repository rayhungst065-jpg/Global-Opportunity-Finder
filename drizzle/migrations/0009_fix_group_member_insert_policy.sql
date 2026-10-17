create or replace function public.is_group_creator(_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.collab_groups
    where id = _group_id and created_by = auth.uid()
  )
$$;

drop policy members_insert on public.collab_group_members;
create policy members_insert on public.collab_group_members
  for insert to authenticated with check (public.is_group_creator(group_id));