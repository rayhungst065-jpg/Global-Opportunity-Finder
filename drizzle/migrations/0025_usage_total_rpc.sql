DROP POLICY IF EXISTS "Signed-in students read the shared monthly AI usage total" ON public.assistant_usage_months;
REVOKE SELECT ON public.assistant_usage_months FROM authenticated;
CREATE OR REPLACE FUNCTION public.current_assistant_usage()
RETURNS numeric LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE
    COALESCE((SELECT credits_used FROM public.assistant_usage_months WHERE month = to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM')), 0) END
$$;
REVOKE ALL ON FUNCTION public.current_assistant_usage() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_assistant_usage() TO authenticated;