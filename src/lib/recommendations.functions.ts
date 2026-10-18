import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generalLiveSearchUnavailable } from "@/lib/college-research-policy";

export const onlineRecommendations = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async () => generalLiveSearchUnavailable());