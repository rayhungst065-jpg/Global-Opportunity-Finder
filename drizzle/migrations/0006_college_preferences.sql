CREATE TABLE public.college_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  intended_major TEXT,
  preferred_regions TEXT[] NOT NULL DEFAULT '{}',
  institution_types TEXT[] NOT NULL DEFAULT '{}',
  campus_size TEXT,
  budget_range TEXT,
  financial_aid_interest BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.college_preferences TO authenticated;
GRANT ALL ON public.college_preferences TO service_role;
ALTER TABLE public.college_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own college preferences" ON public.college_preferences FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students insert own college preferences" ON public.college_preferences FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students update own college preferences" ON public.college_preferences FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students delete own college preferences" ON public.college_preferences FOR DELETE TO authenticated USING (user_id = auth.uid());