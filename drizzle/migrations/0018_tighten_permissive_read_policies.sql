DROP POLICY IF EXISTS "posts_read" ON public.community_posts;
CREATE POLICY "posts_read" ON public.community_posts FOR SELECT TO authenticated
  USING (status = 'open' OR author_id = auth.uid());

DROP POLICY IF EXISTS "Students read imported colleges" ON public.colleges;
CREATE POLICY "Students read imported colleges" ON public.colleges FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Students read spreadsheet notes" ON public.college_source_notes;
CREATE POLICY "Students read spreadsheet notes" ON public.college_source_notes FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);