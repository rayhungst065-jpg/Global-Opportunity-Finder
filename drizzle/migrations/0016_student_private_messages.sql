CREATE UNIQUE INDEX IF NOT EXISTS connections_unique_pair ON public.connections (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id));

CREATE OR REPLACE FUNCTION public.guard_connection_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.requester_id <> OLD.requester_id OR NEW.addressee_id <> OLD.addressee_id THEN
    RAISE EXCEPTION 'Connection participants cannot be changed';
  END IF;
  IF OLD.status <> 'pending' AND NEW.status <> OLD.status THEN
    RAISE EXCEPTION 'Only pending requests can be answered';
  END IF;
  IF NEW.status NOT IN ('pending','accepted','declined') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_connection_update ON public.connections;
CREATE TRIGGER guard_connection_update BEFORE UPDATE ON public.connections FOR EACH ROW EXECUTE FUNCTION public.guard_connection_update();

CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.connections c WHERE c.status = 'accepted'
    AND ((c.requester_id = _a AND c.addressee_id = _b) OR (c.requester_id = _b AND c.addressee_id = _a)));
$$;

CREATE TABLE public.student_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);
CREATE INDEX student_messages_pair_idx ON public.student_messages (LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at);
GRANT SELECT, INSERT ON public.student_messages TO authenticated;
GRANT ALL ON public.student_messages TO service_role;
ALTER TABLE public.student_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Participants read their messages" ON public.student_messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Friends send messages as themselves" ON public.student_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.are_friends(auth.uid(), recipient_id));
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_messages;