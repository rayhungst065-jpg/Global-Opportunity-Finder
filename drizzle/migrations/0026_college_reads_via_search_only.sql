DROP POLICY IF EXISTS "Students read imported colleges" ON public.colleges;
DROP POLICY IF EXISTS "Students read spreadsheet notes" ON public.college_source_notes;
REVOKE SELECT ON public.colleges FROM authenticated, anon;
REVOKE SELECT ON public.college_source_notes FROM authenticated, anon;
CREATE OR REPLACE FUNCTION public.search_colleges(p_query text DEFAULT ''::text, p_region text DEFAULT ''::text, p_country text DEFAULT ''::text, p_type text DEFAULT ''::text, p_sort text DEFAULT 'name'::text, p_page integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
WITH filtered AS (
 SELECT * FROM public.colleges
 WHERE auth.uid() IS NOT NULL
 AND (p_query='' OR university ILIKE '%' || p_query || '%' OR country ILIKE '%' || p_query || '%')
 AND (p_region='' OR region=p_region) AND (p_country='' OR country=p_country) AND (p_type='' OR institution_type=p_type)
), page_rows AS (
 SELECT * FROM filtered ORDER BY
 CASE WHEN p_sort='rank' AND qs_rank ~ '^[0-9]+$' THEN qs_rank::integer END ASC NULLS LAST,
 CASE WHEN p_sort='enrollment' AND enrollment ~ '^[0-9]+$' THEN enrollment::integer END DESC NULLS LAST,
 CASE WHEN p_sort='country' THEN country END ASC NULLS LAST,
 university ASC, source_row ASC LIMIT 24 OFFSET greatest(0, least(p_page,10000))*24
)
SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(p)) FROM page_rows p),'[]'::jsonb),'total',(SELECT count(*) FROM filtered),
'regions',(SELECT coalesce(jsonb_agg(v),'[]'::jsonb) FROM (SELECT DISTINCT region v FROM public.colleges WHERE region IS NOT NULL ORDER BY region) t),
'countries',(SELECT coalesce(jsonb_agg(v),'[]'::jsonb) FROM (SELECT DISTINCT country v FROM public.colleges WHERE country IS NOT NULL ORDER BY country) t),
 'types',(SELECT coalesce(jsonb_agg(v),'[]'::jsonb) FROM (SELECT DISTINCT institution_type v FROM public.colleges WHERE institution_type IS NOT NULL ORDER BY institution_type) t)) END;
$function$;
REVOKE EXECUTE ON FUNCTION public.search_colleges(text,text,text,text,text,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_colleges(text,text,text,text,text,integer) TO authenticated;