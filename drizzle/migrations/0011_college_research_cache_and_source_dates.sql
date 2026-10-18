ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS last_verified_at timestamptz;
COMMENT ON COLUMN public.opportunities.last_verified_at IS 'Last reliable official-source verification; never derived from AI generation or ordinary updated_at.';
CREATE TABLE public.college_research (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 criteria_key text NOT NULL,
 criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','ready','failed')),
 results jsonb NOT NULL DEFAULT '[]'::jsonb,
 sources jsonb NOT NULL DEFAULT '[]'::jsonb,
 error_message text,
 created_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz
);
GRANT SELECT ON public.college_research TO authenticated;
GRANT ALL ON public.college_research TO service_role;
ALTER TABLE public.college_research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own college research" ON public.college_research FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE INDEX college_research_owner_criteria ON public.college_research(user_id, criteria_key, created_at DESC);
CREATE OR REPLACE FUNCTION public.reserve_college_research(p_key text, p_criteria jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_user uuid := auth.uid(); v_row public.college_research; v_count integer;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF length(p_key) > 2000 OR jsonb_typeof(p_criteria) <> 'object' THEN RAISE EXCEPTION 'Invalid criteria'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
 SELECT * INTO v_row FROM public.college_research WHERE user_id=v_user AND criteria_key=p_key AND status='ready' ORDER BY created_at DESC LIMIT 1;
 IF FOUND THEN RETURN jsonb_build_object('allowed',false,'cached',true,'row',to_jsonb(v_row)); END IF;
 IF EXISTS (SELECT 1 FROM public.college_research WHERE user_id=v_user AND status='pending' AND created_at > now()-interval '10 minutes') THEN
  RETURN jsonb_build_object('allowed',false,'cached',false,'message','College Research is already running. Please wait; no second search was started.');
 END IF;
 SELECT count(*) INTO v_count FROM public.college_research WHERE user_id=v_user AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
 IF v_count >= 2 THEN RETURN jsonb_build_object('allowed',false,'cached',false,'message','Daily College Research limit reached (2 new searches per UTC day). Saved results remain available.'); END IF;
 INSERT INTO public.college_research(user_id,criteria_key,criteria) VALUES(v_user,p_key,p_criteria) RETURNING * INTO v_row;
 RETURN jsonb_build_object('allowed',true,'cached',false,'row',to_jsonb(v_row));
END; $$;
REVOKE ALL ON FUNCTION public.reserve_college_research(text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_college_research(text,jsonb) TO authenticated;