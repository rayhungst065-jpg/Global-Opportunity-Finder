CREATE TABLE public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  purpose text,
  goals text,
  activities text,
  rules text,
  format text NOT NULL DEFAULT 'online',
  meeting_frequency text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.communities TO anon;
GRANT SELECT, UPDATE ON public.communities TO authenticated;
GRANT ALL ON public.communities TO service_role;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read communities" ON public.communities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Creator updates own community" ON public.communities FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

CREATE TABLE public.community_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  topic text NOT NULL,
  purpose text NOT NULL,
  problem text,
  short_term_goals text,
  long_term_goals text,
  activities text,
  participants text,
  format text NOT NULL DEFAULT 'online',
  meeting_frequency text,
  description text NOT NULL,
  rules text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX proposals_creator_idx ON public.community_proposals (creator_id);
CREATE INDEX proposals_status_idx ON public.community_proposals (status);
GRANT SELECT, INSERT, UPDATE ON public.community_proposals TO authenticated;
GRANT ALL ON public.community_proposals TO service_role;
ALTER TABLE public.community_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Creator or admin reads proposals" ON public.community_proposals FOR SELECT TO authenticated USING (auth.uid() = creator_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Student submits own proposal" ON public.community_proposals FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id AND status = 'pending');
CREATE POLICY "Creator edits pending proposal" ON public.community_proposals FOR UPDATE TO authenticated USING (auth.uid() = creator_id AND status = 'pending') WITH CHECK (auth.uid() = creator_id AND status IN ('pending','withdrawn'));
CREATE POLICY "Admin reviews proposals" ON public.community_proposals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.community_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id uuid NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (community_id, user_id)
);
CREATE INDEX memberships_user_idx ON public.community_memberships (user_id);
CREATE INDEX memberships_community_idx ON public.community_memberships (community_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_memberships TO authenticated;
GRANT ALL ON public.community_memberships TO service_role;
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members and creators read memberships" ON public.community_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.created_by = auth.uid()));
CREATE POLICY "Student requests to join" ON public.community_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Community creator approves requests" ON public.community_memberships FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.communities c WHERE c.id = community_id AND c.created_by = auth.uid()));
CREATE POLICY "Student leaves or cancels" ON public.community_memberships FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER proposals_touch BEFORE UPDATE ON public.community_proposals FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();