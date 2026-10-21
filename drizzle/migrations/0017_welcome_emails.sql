CREATE TABLE public.welcome_emails (
  user_id uuid PRIMARY KEY,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.welcome_emails TO service_role;
ALTER TABLE public.welcome_emails ENABLE ROW LEVEL SECURITY;
-- Server-only bookkeeping: no client policies. Existing accounts are marked so only new registrations get a welcome email.
INSERT INTO public.welcome_emails (user_id) SELECT id FROM auth.users ON CONFLICT DO NOTHING;