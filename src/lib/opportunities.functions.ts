import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const categoryEnum = z.enum(["volunteer", "competitions", "research", "awards"]);

/** Public, read-only list of opportunities with optional search + category filter. */
export const listOpportunities = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ q: z.string().max(100).optional(), category: categoryEnum.optional() }).parse(d ?? {}),
  )
  .handler(async ({ data }) => {
    let query = publicClient()
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
    const { data: row, error } = await publicClient().from("opportunities").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
