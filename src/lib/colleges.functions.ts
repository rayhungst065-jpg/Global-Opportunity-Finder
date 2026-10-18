import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const collegeSearchSchema = z.object({
  query: z.string().trim().max(250).default(""), region: z.string().max(100).default(""),
  country: z.string().max(100).default(""), type: z.string().max(150).default(""),
  sort: z.enum(["name", "rank", "country", "enrollment"]).default("name"), page: z.number().int().min(0).max(10000).default(0),
});
const collegeRow = z.object({ id: z.string(), university: z.string(), qs_rank: z.string().nullable(), region: z.string().nullable(), country: z.string().nullable(), institution_type: z.string().nullable(), tuition: z.string().nullable(), campus_size: z.string().nullable(), gpa_requirement: z.string().nullable(), acceptance_rate: z.string().nullable(), official_website: z.string().nullable(), enrollment: z.string().nullable() });
export const searchColleges = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => collegeSearchSchema.parse(v))
  .handler(async ({ context, data }) => {
    const { data: result, error } = await context.supabase.rpc("search_colleges", { p_query: data.query, p_region: data.region, p_country: data.country, p_type: data.type, p_sort: data.sort, p_page: data.page });
    if (error) throw new Error(error.message);
    return z.object({ rows: z.array(collegeRow), total: z.number(), regions: z.array(z.string()), countries: z.array(z.string()), types: z.array(z.string()) }).parse(result);
  });