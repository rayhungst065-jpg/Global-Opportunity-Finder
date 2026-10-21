import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Read-only catalog client. The public catalog has no anonymous database
 * policy, so public pages read it here on the server only. */
async function catalogClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

const categoryEnum = z.enum(["volunteer", "competitions", "research", "awards"]);

/** Public, read-only list of opportunities with optional search + category filter. */
export const listOpportunities = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ q: z.string().max(100).optional(), category: categoryEnum.optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    let query = (await catalogClient())
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
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: row, error } = await (await catalogClient()).from("opportunities").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
