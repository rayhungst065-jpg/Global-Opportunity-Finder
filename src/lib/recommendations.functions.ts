import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { discoverOnlineOpportunities } from "@/lib/online-opportunities.server";

export const onlineRecommendations = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => discoverOnlineOpportunities(context.supabase, context.userId));