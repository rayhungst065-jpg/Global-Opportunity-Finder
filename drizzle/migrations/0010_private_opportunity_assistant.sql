CREATE TABLE public.assistant_conversations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, title text NOT NULL DEFAULT 'Opportunity chat', summary text, archived boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_conversations TO authenticated;
GRANT ALL ON public.assistant_conversations TO service_role;
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY assistant_conversations_owner ON public.assistant_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TABLE public.assistant_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES public.assistant_conversations(id) ON DELETE CASCADE, user_id uuid NOT NULL, message_id text NOT NULL, role text NOT NULL CHECK (role IN ('user','assistant')), parts jsonb NOT NULL DEFAULT '[]', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(conversation_id, message_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assistant_messages TO authenticated;
GRANT ALL ON public.assistant_messages TO service_role;
ALTER TABLE public.assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY assistant_messages_owner ON public.assistant_messages FOR ALL TO authenticated USING (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.assistant_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid())) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.assistant_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE INDEX assistant_messages_conversation_order ON public.assistant_messages(conversation_id, created_at);
CREATE INDEX assistant_conversations_owner_updated ON public.assistant_conversations(user_id, updated_at DESC);
CREATE TRIGGER assistant_conversations_touch BEFORE UPDATE ON public.assistant_conversations FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TABLE public.assistant_access_state (user_id uuid PRIMARY KEY, blocked_message text NOT NULL, status integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.assistant_access_state TO authenticated;
GRANT ALL ON public.assistant_access_state TO service_role;
ALTER TABLE public.assistant_access_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY assistant_access_owner_read ON public.assistant_access_state FOR SELECT TO authenticated USING (auth.uid() = user_id);