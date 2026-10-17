create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  topics text[] not null default '{}',
  desired_skills text[] not null default '{}',
  collaboration_goal text,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.community_posts to authenticated;
grant all on public.community_posts to service_role;

alter table public.community_posts enable row level security;

create policy posts_read on public.community_posts
  for select to authenticated using (true);
create policy posts_insert on public.community_posts
  for insert to authenticated with check (author_id = auth.uid());
create policy posts_update on public.community_posts
  for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy posts_delete on public.community_posts
  for delete to authenticated using (author_id = auth.uid());

create table public.collab_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  goal text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.collab_group_members (
  group_id uuid not null references public.collab_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  status text not null default 'invited' check (status in ('invited', 'active')),
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

grant select, insert, update, delete on public.collab_groups to authenticated;
grant all on public.collab_groups to service_role;
grant select, insert, update, delete on public.collab_group_members to authenticated;
grant all on public.collab_group_members to service_role;

alter table public.collab_groups enable row level security;
alter table public.collab_group_members enable row level security;

create policy groups_read on public.collab_groups
  for select to authenticated using (
    exists (
      select 1 from public.collab_group_members m
      where m.group_id = id and m.user_id = auth.uid()
    )
  );
create policy groups_insert on public.collab_groups
  for insert to authenticated with check (created_by = auth.uid());
create policy groups_update on public.collab_groups
  for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
create policy groups_delete on public.collab_groups
  for delete to authenticated using (created_by = auth.uid());

create policy members_read on public.collab_group_members
  for select to authenticated using (
    exists (
      select 1 from public.collab_group_members m
      where m.group_id = collab_group_members.group_id and m.user_id = auth.uid()
    )
  );
create policy members_insert on public.collab_group_members
  for insert to authenticated with check (
    exists (
      select 1 from public.collab_groups g
      where g.id = group_id and g.created_by = auth.uid()
    )
  );
create policy members_update on public.collab_group_members
  for update to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.collab_groups g where g.id = group_id and g.created_by = auth.uid())
  );
create policy members_delete on public.collab_group_members
  for delete to authenticated using (
    user_id = auth.uid()
    or exists (select 1 from public.collab_groups g where g.id = group_id and g.created_by = auth.uid())
  );