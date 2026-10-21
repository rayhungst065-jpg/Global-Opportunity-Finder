DROP POLICY IF EXISTS "Anyone can read opportunities" ON public.opportunities;
CREATE POLICY "Signed-in students read opportunities" ON public.opportunities FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.opportunities FROM anon;

DROP POLICY IF EXISTS "Anyone can read communities" ON public.communities;
CREATE POLICY "Signed-in students read communities" ON public.communities FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.communities FROM anon;