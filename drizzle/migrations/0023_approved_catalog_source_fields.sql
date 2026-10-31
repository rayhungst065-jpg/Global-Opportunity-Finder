ALTER TYPE public.opportunity_category ADD VALUE IF NOT EXISTS 'cultural_exchange';
ALTER TYPE public.opportunity_category ADD VALUE IF NOT EXISTS 'leadership';
ALTER TYPE public.opportunity_category ADD VALUE IF NOT EXISTS 'education';
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS source_key text;
ALTER TABLE public.opportunities ADD COLUMN IF NOT EXISTS source_record jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS opportunities_source_key_unique ON public.opportunities (source_key) WHERE source_key IS NOT NULL;
COMMENT ON COLUMN public.opportunities.source_key IS 'Stable approved master-record identifier for idempotent imports; null for existing private or demo rows.';
COMMENT ON COLUMN public.opportunities.source_record IS 'Original approved spreadsheet fields; preserve source wording and do not infer missing dates, eligibility or verification.';