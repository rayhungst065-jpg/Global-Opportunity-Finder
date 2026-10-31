ALTER TABLE public.profiles ADD COLUMN is_test_account boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.student_is_discoverable(p_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.profiles WHERE id=p_id AND discoverable AND NOT is_test_account); $function$;

CREATE OR REPLACE FUNCTION public.student_profile_cards(p_ids uuid[] DEFAULT NULL::uuid[], p_discovery boolean DEFAULT false)
 RETURNS SETOF profiles
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
 SELECT CASE WHEN p.id = auth.uid() THEN p ELSE jsonb_populate_record(NULL::public.profiles, jsonb_build_object(
 'id',p.id,'display_name',coalesce(p.display_name,p.first_name,'Student'),
 'avatar_path',CASE WHEN coalesce((p.visibility->>'avatar')::boolean,true) THEN p.avatar_path END,
 'bio',CASE WHEN coalesce((p.visibility->>'bio')::boolean,true) THEN p.bio END,
 'country_region',CASE WHEN coalesce((p.visibility->>'country_region')::boolean,false) THEN p.country_region END,
 'education_level',CASE WHEN coalesce((p.visibility->>'education')::boolean,true) THEN p.education_level END,
 'grade',CASE WHEN coalesce((p.visibility->>'education')::boolean,true) THEN p.grade END,
 'intended_major',CASE WHEN coalesce((p.visibility->>'major')::boolean,true) THEN p.intended_major END,
 'languages',CASE WHEN coalesce((p.visibility->>'languages')::boolean,true) THEN to_jsonb(p.languages) ELSE '[]'::jsonb END,
 'interests',CASE WHEN coalesce((p.visibility->>'interests')::boolean,true) THEN to_jsonb(p.interests) ELSE '[]'::jsonb END,
 'skills',CASE WHEN coalesce((p.visibility->>'skills')::boolean,true) THEN to_jsonb(p.skills) ELSE '[]'::jsonb END,
 'goals',CASE WHEN coalesce((p.visibility->>'goals')::boolean,true) THEN to_jsonb(p.goals) ELSE '[]'::jsonb END,
 'visibility','{}'::jsonb)) END
 FROM public.profiles p WHERE auth.uid() IS NOT NULL AND NOT p.is_test_account AND (p_ids IS NULL OR p.id=ANY(p_ids)) AND
 (CASE WHEN p_discovery THEN p.discoverable AND p.id<>auth.uid() ELSE
 p.id=auth.uid() OR p.discoverable OR EXISTS (SELECT 1 FROM public.connections c WHERE (c.requester_id=auth.uid() AND c.addressee_id=p.id) OR (c.addressee_id=auth.uid() AND c.requester_id=p.id)) OR
 EXISTS (SELECT 1 FROM public.collab_group_members a JOIN public.collab_group_members b ON a.group_id=b.group_id WHERE a.user_id=auth.uid() AND b.user_id=p.id AND a.status='active' AND b.status='active') OR EXISTS (SELECT 1 FROM public.community_posts cp WHERE cp.author_id=p.id)
 END) ORDER BY p.created_at DESC LIMIT 100;
$function$;