CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.opportunity_category AS ENUM ('volunteer', 'competitions', 'research', 'awards');
CREATE TYPE public.application_status AS ENUM ('open', 'rolling', 'upcoming', 'closed');
CREATE TYPE public.saved_status AS ENUM ('interested', 'applying', 'submitted');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  education_level text,
  grade text,
  intended_major text,
  interests text[] NOT NULL DEFAULT '{}',
  preferred_categories public.opportunity_category[] NOT NULL DEFAULT '{}',
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category public.opportunity_category NOT NULL,
  organizer text NOT NULL,
  official_url text,
  description text NOT NULL DEFAULT '',
  eligibility text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT 'Online',
  deadline date,
  application_status public.application_status NOT NULL DEFAULT 'open',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX opportunities_category_idx ON public.opportunities (category);
CREATE INDEX opportunities_deadline_idx ON public.opportunities (deadline);
GRANT SELECT ON public.opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read opportunities" ON public.opportunities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert opportunities" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update opportunities" ON public.opportunities FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete opportunities" ON public.opportunities FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.saved_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  status public.saved_status NOT NULL DEFAULT 'interested',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, opportunity_id)
);
CREATE INDEX saved_user_idx ON public.saved_opportunities (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_opportunities TO authenticated;
GRANT ALL ON public.saved_opportunities TO service_role;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own saved select" ON public.saved_opportunities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own saved insert" ON public.saved_opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own saved update" ON public.saved_opportunities FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own saved delete" ON public.saved_opportunities FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER opportunities_touch BEFORE UPDATE ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.opportunities (title, category, organizer, official_url, description, eligibility, location, deadline, application_status, is_demo) VALUES
('[DEMO] Community Garden Volunteer Program', 'volunteer', 'Demo Organizer (not real)', NULL, 'Sample listing for testing the site. This is not a real opportunity.', 'Demo: high school students, any grade.', 'Online', NULL, 'rolling', true),
('[DEMO] Youth Coding Challenge', 'competitions', 'Demo Organizer (not real)', NULL, 'Sample listing for testing search and saving. Not a real competition.', 'Demo: ages 13–18.', 'Online', NULL, 'open', true),
('[DEMO] Summer Lab Research Placement', 'research', 'Demo Organizer (not real)', NULL, 'Sample listing for testing filters. Not a real program.', 'Demo: grades 10–12 interested in science.', 'Hybrid', NULL, 'upcoming', true),
('[DEMO] Student Leadership Scholarship', 'awards', 'Demo Organizer (not real)', NULL, 'Sample listing for testing the dashboard. Not a real scholarship.', 'Demo: undergraduate or final-year high school students.', 'Online', NULL, 'closed', true);