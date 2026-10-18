CREATE TABLE public.colleges (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 source_file text NOT NULL,
 source_row integer NOT NULL,
 university text NOT NULL,
 qs_rank text,
 region text,
 country text,
 institution_type text,
 tuition text,
 campus_size text,
 gpa_requirement text,
 acceptance_rate text,
 official_website text,
 enrollment text,
 original_values jsonb NOT NULL DEFAULT '{}'::jsonb,
 UNIQUE(source_file, source_row)
);
GRANT SELECT ON public.colleges TO authenticated;
GRANT ALL ON public.colleges TO service_role;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read imported colleges" ON public.colleges FOR SELECT TO authenticated USING (true);
CREATE INDEX colleges_country_idx ON public.colleges(country);
CREATE INDEX colleges_region_idx ON public.colleges(region);
CREATE TABLE public.college_source_notes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), source_file text NOT NULL, source_sheet text NOT NULL, source_row integer NOT NULL, original_values jsonb NOT NULL,
 UNIQUE(source_file, source_sheet, source_row)
);
GRANT SELECT ON public.college_source_notes TO authenticated;
GRANT ALL ON public.college_source_notes TO service_role;
ALTER TABLE public.college_source_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read spreadsheet notes" ON public.college_source_notes FOR SELECT TO authenticated USING(true);
CREATE TABLE public.saved_chat_recommendations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, assistant_message_id uuid NOT NULL REFERENCES public.assistant_messages(id) ON DELETE CASCADE,
 tool_call_id text NOT NULL, recommendation jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(user_id, assistant_message_id, tool_call_id)
);
GRANT SELECT, INSERT, DELETE ON public.saved_chat_recommendations TO authenticated;
GRANT ALL ON public.saved_chat_recommendations TO service_role;
ALTER TABLE public.saved_chat_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own chat recommendations" ON public.saved_chat_recommendations FOR SELECT TO authenticated USING(auth.uid()=user_id);
CREATE POLICY "Save own assistant recommendations" ON public.saved_chat_recommendations FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id AND EXISTS (SELECT 1 FROM public.assistant_messages m WHERE m.id=assistant_message_id AND m.user_id=auth.uid() AND m.role='assistant' AND EXISTS(SELECT 1 FROM jsonb_array_elements(m.parts) p WHERE p->>'type'='tool-recommendOpportunity' AND p->>'state'='output-available' AND p->>'toolCallId'=tool_call_id AND p->'output'=recommendation)));
CREATE POLICY "Remove own chat recommendations" ON public.saved_chat_recommendations FOR DELETE TO authenticated USING(auth.uid()=user_id);
COMMENT ON TABLE public.college_research IS 'DEPRECATED: historical premium research retained; current College Search uses imported public.colleges only.';
