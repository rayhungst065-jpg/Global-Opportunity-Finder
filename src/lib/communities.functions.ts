import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const communityCategories = [
  "Robotics & Engineering",
  "Computer Science & AI",
  "Research & Science",
  "Competition Teams",
  "Environmental Projects",
  "Volunteering & Community Service",
  "International & Cultural Exchange",
  "Other",
] as const;

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

const proposalInput = z.object({
  name: text(120),
  category: z.enum(communityCategories),
  topic: text(200),
  purpose: text(1000),
  problem: optionalText(1000),
  short_term_goals: optionalText(1000),
  long_term_goals: optionalText(1000),
  activities: optionalText(1000),
  participants: optionalText(500),
  format: z.enum(["online", "in_person", "hybrid"]),
  meeting_frequency: optionalText(200),
  description: text(2000),
  rules: optionalText(2000),
});

/** Signed-in directory: every row in communities is an approved group. */
export const listCommunities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ q: z.string().max(100).optional(), category: z.string().max(80).optional() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase.from("communities").select("*").order("name");
    if (data.category) query = query.eq("category", data.category);
    if (data.q) {
      const term = data.q.replace(/[%,()*]/g, " ").trim();
      if (term) query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%,purpose.ilike.%${term}%`);
    }
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((c) => c.id);
    // Approved-member counts are non-sensitive aggregates; membership rows are
    // member-scoped by RLS, so count them with the privileged client.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: members, error: mErr } = ids.length
      ? await supabaseAdmin.from("community_memberships").select("community_id").in("community_id", ids).eq("status", "approved")
      : { data: [], error: null };
    if (mErr) throw new Error(mErr.message);
    const counts = new Map<string, number>();
    for (const m of members ?? []) counts.set(m.community_id, (counts.get(m.community_id) ?? 0) + 1);
    return (rows ?? []).map((c) => ({ ...c, member_count: counts.get(c.id) ?? 0 }));
  });

export const getCommunity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("communities").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

/** Submit a new community proposal (status pending). RLS enforces creator_id = auth.uid(). */
export const submitProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => proposalInput.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("community_proposals")
      .insert({ ...data, creator_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/** The signed-in student's own proposals, any status. */
export const myProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("community_proposals")
      .select("*")
      .eq("creator_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

/** Edit a still-pending proposal, or withdraw it. RLS blocks edits after review. */
export const updateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), action: z.enum(["edit", "withdraw"]), fields: proposalInput.optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch =
      data.action === "withdraw"
        ? { status: "withdrawn" as const }
        : { ...(data.fields ?? {}), status: "pending" as const };
    const { data: row, error } = await context.supabase
      .from("community_proposals")
      .update(patch)
      .eq("id", data.id)
      .eq("creator_id", context.userId)
      .eq("status", "pending")
      .select()
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Proposal not found or already reviewed.");
    return row;
  });

type AuthedClient = { from: (t: string) => any };

async function requireAdmin(supabase: AuthedClient, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Not authorized: administrators only.");
}

/** Whether the signed-in user is an admin (drives UI gating; server re-checks on every action). */
export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return data.map((r) => r.role);
  });

/** Admin: all proposals, newest pending first. */
export const listAllProposals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase
      .from("community_proposals")
      .select("*")
      .order("status", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

/**
 * Admin: approve or reject a proposal. Approval creates the public community
 * row via the privileged client (students cannot insert into communities).
 */
export const reviewProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), decision: z.enum(["approved", "rejected"]), note: z.string().trim().max(1000).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdmin(context.supabase, context.userId);
    const { data: proposal, error: readErr } = await context.supabase
      .from("community_proposals")
      .select("*")
      .eq("id", data.id)
      .single();
    if (readErr) throw new Error(readErr.message);
    if (proposal.status !== "pending") throw new Error("This proposal has already been reviewed.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.decision === "approved") {
      const { error: insErr } = await supabaseAdmin.from("communities").insert({
        name: proposal.name,
        category: proposal.category,
        description: proposal.description,
        purpose: proposal.purpose,
        goals: [proposal.short_term_goals, proposal.long_term_goals].filter(Boolean).join("\n\n") || null,
        activities: proposal.activities,
        rules: proposal.rules,
        format: proposal.format,
        meeting_frequency: proposal.meeting_frequency,
        created_by: proposal.creator_id,
      });
      if (insErr) throw new Error(insErr.message);
    }
    const { error: upErr } = await supabaseAdmin
      .from("community_proposals")
      .update({ status: data.decision, review_note: data.note ?? null, reviewed_by: context.userId, reviewed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (upErr) throw new Error(upErr.message);
    return { ok: true };
  });
