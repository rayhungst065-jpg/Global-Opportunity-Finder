import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { collegeCriteriaSchema, criteriaKey } from "@/lib/college-research-policy";
import { runCollegeResearch } from "@/lib/college-research.server";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

export const researchColleges = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ criteria: collegeCriteriaSchema, confirmPremiumSearch: z.literal(true) }).parse(input))
  .handler(async ({ context, data }) => {
    const gateway = process.env["LOVABLE_API_KEY"];
    const parallel = process.env["PARALLEL_API_KEY"];
    const gemini = process.env["GEMINI_API_KEY"];
    // Reserve atomically under auth.uid(); cache returns before any provider or admin call.
    const { data: reservation, error } = await context.supabase.rpc("reserve_college_research", { p_key: criteriaKey(data.criteria), p_criteria: data.criteria });
    if (error) throw new Error("College Research could not reserve a search. No provider request was made.");
    const claim = z.object({ allowed: z.boolean(), cached: z.boolean(), message: z.string().optional(), row: z.object({ id: z.string().uuid(), user_id: z.string().uuid() }).passthrough().optional() }).parse(reservation);
    if (claim.cached) return { cached: true, message: "Previously saved research reused. No external requests.", id: claim.row?.id };
    if (!claim.allowed || !claim.row || claim.row.user_id !== context.userId) return { cached: false, message: claim.message ?? "Research unavailable; no search started.", id: undefined };
    const id = claim.row.id;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      if (!gateway || !parallel || !gemini) throw new Error("College Research connections are incomplete. No search started.");
      const result = await runCollegeResearch(data.criteria, { gateway, parallel, gemini });
      const { error: writeError } = await supabaseAdmin.from("college_research").update({ status: "ready", results: result.results as unknown as Json, sources: result.sources as unknown as Json, error_message: result.warning, completed_at: new Date().toISOString() }).eq("id", id).eq("user_id", context.userId);
      if (writeError) throw new Error("Research completed but could not be saved. No automatic retry was made.");
      return { cached: false, message: result.warning ?? "College Research saved. Confirm details with each institution.", id };
    } catch (error) {
      const message = error instanceof Error ? error.message.replaceAll(gemini ?? "__no_key__", "[redacted]").replaceAll(parallel ?? "__no_key__", "[redacted]").replaceAll(gateway ?? "__no_key__", "[redacted]") : "College Research failed; no retry was made.";
      await supabaseAdmin.from("college_research").update({ status: "failed", error_message: message, completed_at: new Date().toISOString() }).eq("id", id).eq("user_id", context.userId);
      return { cached: false, message, id };
    }
  });
