ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS country_region text,
  ADD COLUMN IF NOT EXISTS format_preference text NOT NULL DEFAULT 'either',
  ADD COLUMN IF NOT EXISTS preferred_regions text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_format_preference_check CHECK (format_preference IN ('online','in_person','either'));