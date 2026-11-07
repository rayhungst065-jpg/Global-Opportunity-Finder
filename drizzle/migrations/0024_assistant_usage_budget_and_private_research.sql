create table public.assistant_usage_months (
  month text primary key,
  credits_used numeric not null default 0,
  updated_at timestamptz not null default now()
);

GRANT SELECT ON public.assistant_usage_months TO authenticated;
GRANT ALL ON public.assistant_usage_months TO service_role;

alter table public.assistant_usage_months enable row level security;

create policy "Signed-in students read the shared monthly AI usage total"
  on public.assistant_usage_months for select to authenticated using (true);

create or replace function public.record_assistant_usage(p_month text, p_credits numeric)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.assistant_usage_months (month, credits_used, updated_at)
  values (p_month, greatest(p_credits, 0), now())
  on conflict (month) do update
  set credits_used = public.assistant_usage_months.credits_used + excluded.credits_used,
      updated_at = now();
$$;

revoke all on function public.record_assistant_usage(text, numeric) from public, anon, authenticated;
grant execute on function public.record_assistant_usage(text, numeric) to service_role;

create policy "Students insert their own private research opportunities"
  on public.opportunities for insert to authenticated
  with check (owner_user_id = auth.uid());