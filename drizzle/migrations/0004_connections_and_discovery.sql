CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  CHECK (requester_id <> addressee_id),
  UNIQUE (requester_id, addressee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants can read their connections" ON public.connections FOR SELECT TO authenticated USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "Students send requests as themselves to discoverable peers" ON public.connections FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid() AND addressee_id <> auth.uid() AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = addressee_id AND p.discoverable));
CREATE POLICY "Addressee responds to requests" ON public.connections FOR UPDATE TO authenticated USING (addressee_id = auth.uid()) WITH CHECK (addressee_id = auth.uid());
CREATE POLICY "Either participant can remove" ON public.connections FOR DELETE TO authenticated USING (requester_id = auth.uid() OR addressee_id = auth.uid());
CREATE POLICY "Signed-in students can read discoverable profiles" ON public.profiles FOR SELECT TO authenticated USING (discoverable = true);