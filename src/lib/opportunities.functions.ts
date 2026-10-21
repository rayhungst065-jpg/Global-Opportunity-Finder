import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


const categoryEnum = z.enum(["volunteer", "competitions", "research", "awards"]);

/** Signed-in, read-only list of opportunities with optional search + category filter. */
export const listOpportunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ q: z.string().max(100).optional(), category: categoryEnum.optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("opportunities")
      .select("*")
      .order("deadline", { ascending: true, nullsFirst: false })
      .order("title");
    if (data.category) query = query.eq("category", data.category);
    if (data.q) {
      const term = data.q.replace(/[%,()*]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,organizer.ilike.%${term}%,description.ilike.%${term}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows;
  });

export const getOpportunity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("opportunities").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
