import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const csv = (max: number) =>
  z.string().trim().max(500).optional().transform((v) =>
    (v ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, max),
  );

const postInput = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10).max(3000),
  topics: csv(8),
  desired_skills: csv(8),
  collaboration_goal: z.string().trim().max(300).optional().transform((v) => v || null),
});

/** The student post feed, newest first. Signed-in students only (RLS). */
export const listPosts = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().max(100).optional() }).parse(d ?? {}))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    let query = context.supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.q) {
      const term = data.q.replace(/[%,()*]/g, " ").trim();
      if (term) query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const ids = [...new Set((rows ?? []).map((r) => r.author_id))];
    const { data: profiles } = ids.length
      ? await context.supabase.from("profiles").select("id, display_name, avatar_path").in("id", ids)
      : { data: [] };
    const names = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (rows ?? []).map((r) => ({ ...r, author: names.get(r.author_id) ?? null }));
  });
export type PostRow = Awaited<ReturnType<typeof listPosts>>[number];

/** Create a post. RLS enforces author_id = auth.uid(). */
export const createPost = createServerFn({ method: "POST" })
  .inputValidator((d) => postInput.parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("community_posts").insert({ ...data, author_id: context.userId });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Close or delete your own post. */
export const updatePost = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), action: z.enum(["close", "reopen", "delete"]) }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    if (data.action === "delete") {
      const { error } = await context.supabase.from("community_posts").delete().eq("id", data.id).eq("author_id", context.userId);
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    const { error } = await context.supabase
      .from("community_posts")
      .update({ status: data.action === "close" ? "closed" : "open" })
      .eq("id", data.id)
      .eq("author_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
