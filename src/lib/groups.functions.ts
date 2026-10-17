import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Private collaboration groups. RLS restricts every read to members, so these
 * functions only ever return groups the signed-in student belongs to.
 */

/** My groups (created by me or I'm a member/invitee), with member list. */
export const listMyGroups = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: groups, error } = await context.supabase
      .from("collab_groups")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (groups ?? []).map((g) => g.id);
    const { data: members, error: mErr } = ids.length
      ? await context.supabase.from("collab_group_members").select("*").in("group_id", ids)
      : { data: [], error: null };
    if (mErr) throw new Error(mErr.message);
    const userIds = [...new Set((members ?? []).map((m) => m.user_id))];
    const { data: profiles } = userIds.length
      ? await context.supabase.from("profiles").select("id, display_name, avatar_path").in("id", userIds)
      : { data: [] };
    const names = new Map((profiles ?? []).map((p) => [p.id, p]));
    return (groups ?? []).map((g) => ({
      ...g,
      mine: g.created_by === context.userId,
      members: (members ?? [])
        .filter((m) => m.group_id === g.id)
        .map((m) => ({ ...m, profile: names.get(m.user_id) ?? null })),
    }));
  });
export type GroupRow = Awaited<ReturnType<typeof listMyGroups>>[number];

/** Create a private group; the creator becomes the owner member. */
export const createGroup = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({
      name: z.string().trim().min(3).max(120),
      description: z.string().trim().max(1000).optional().transform((v) => v ?? ""),
      goal: z.string().trim().max(300).optional().transform((v) => v || null),
    }).parse(d),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    // Generate the id here: the read policy requires membership, which only
    // exists after the owner row below, so insert-then-select would fail RLS.
    const id = crypto.randomUUID();
    const { error } = await context.supabase
      .from("collab_groups")
      .insert({ id, ...data, created_by: context.userId });
    if (error) throw new Error(error.message);
    const { error: mErr } = await context.supabase
      .from("collab_group_members")
      .insert({ group_id: id, user_id: context.userId, role: "owner", status: "active" });
    if (mErr) throw new Error(mErr.message);
    return { ok: true };
  });

/** Owner invites a student (must be an accepted connection — checked server-side). */
export const inviteToGroup = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ group_id: z.string().uuid(), user_id: z.string().uuid() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: conn } = await context.supabase
      .from("connections")
      .select("id")
      .eq("status", "accepted")
      .or(`and(requester_id.eq.${context.userId},addressee_id.eq.${data.user_id}),and(requester_id.eq.${data.user_id},addressee_id.eq.${context.userId})`)
      .maybeSingle();
    if (!conn) throw new Error("You can only invite students you're connected with.");
    const { error } = await context.supabase
      .from("collab_group_members")
      .insert({ group_id: data.group_id, user_id: data.user_id });
    if (error) throw new Error(error.message.includes("duplicate") ? "Already invited." : error.message);
    return { ok: true };
  });

/** Accept an invitation, leave a group, or (owner) remove a member. */
export const updateMembership = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ group_id: z.string().uuid(), user_id: z.string().uuid(), action: z.enum(["accept", "leave", "remove"]) }).parse(d),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    if (data.action === "accept") {
      if (data.user_id !== context.userId) throw new Error("You can only accept your own invitation.");
      const { error } = await context.supabase
        .from("collab_group_members")
        .update({ status: "active" })
        .eq("group_id", data.group_id)
        .eq("user_id", context.userId)
        .eq("status", "invited");
      if (error) throw new Error(error.message);
      return { ok: true };
    }
    if (data.action === "leave" && data.user_id !== context.userId) throw new Error("Invalid request.");
    const { error } = await context.supabase
      .from("collab_group_members")
      .delete()
      .eq("group_id", data.group_id)
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
