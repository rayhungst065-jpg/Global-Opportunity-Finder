import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readVisibility } from "@/lib/profile-options";
import type { Database } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Student discovery card: only fields the student chose to show.
 * Display name is always included when discovery is on; everything else
 * follows their per-field visibility choices. Email is never exposed.
 */
function toCard(p: ProfileRow) {
  const v = readVisibility(p.visibility);
  return {
    id: p.id,
    display_name: p.display_name || p.first_name || "Student",
    avatar_path: v.avatar ? p.avatar_path : null,
    bio: v.bio ? p.bio : null,
    country_region: v.country_region ? p.country_region : null,
    education_level: v.education ? p.education_level : null,
    grade: v.education ? p.grade : null,
    intended_major: v.major ? p.intended_major : null,
    languages: v.languages ? p.languages : [],
    interests: v.interests ? p.interests : [],
    skills: v.skills ? p.skills : [],
    goals: v.goals ? p.goals : [],
  };
}
export type StudentCard = ReturnType<typeof toCard>;

/** Discoverable students, newest first. Field-level privacy applied server-side. */
export const discoverStudents = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({ q: z.string().max(100).optional(), major: z.string().max(120).optional(), interest: z.string().max(60).optional(), country: z.string().max(120).optional(), education: z.string().max(120).optional() }).parse(d ?? {}),
  )
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.rpc("student_profile_cards", { p_discovery: true });
    if (error) throw new Error(error.message);
    let cards = (rows ?? []).map(toCard);
    if (data.major) {
      const term = data.major.toLowerCase();
      cards = cards.filter((c) => c.intended_major?.toLowerCase().includes(term));
    }
    if (data.interest) {
      const term = data.interest.toLowerCase();
      cards = cards.filter((c) => c.interests.some((i) => i.toLowerCase().includes(term)) || c.skills.some((s) => s.toLowerCase().includes(term)));
    }
    if (data.country) {
      const term = data.country.toLowerCase();
      cards = cards.filter((c) => c.country_region?.toLowerCase().includes(term));
    }
    if (data.education) cards = cards.filter((c) => c.education_level === data.education);
    if (data.q) {
      const term = data.q.toLowerCase();
      cards = cards.filter((c) =>
        [c.display_name, c.bio ?? "", c.intended_major ?? "", ...c.interests, ...c.goals].join(" ").toLowerCase().includes(term),
      );
    }
    return cards;
  });

/** One student's visibility-filtered profile (null when not visible to the caller). */
export const getStudent = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase.rpc("student_profile_cards", { p_ids: [data.id] });
    if (error) throw new Error(error.message);
    const p = rows?.[0];
    return p ? toCard(p) : null;
  });

/** All connections involving the signed-in student (any status, either direction). */
export const listMyConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("connections")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = [...new Set((rows ?? []).flatMap((r) => [r.requester_id, r.addressee_id]))].filter((i) => i !== context.userId);
    const { data: profiles } = ids.length
      ? await context.supabase.rpc("student_profile_cards", { p_ids: ids })
      : { data: [] };
    const cards = new Map((profiles ?? []).map((p) => [p.id, toCard(p)]));
    return (rows ?? []).map((r) => ({
      ...r,
      other: cards.get(r.requester_id === context.userId ? r.addressee_id : r.requester_id) ?? null,
      outgoing: r.requester_id === context.userId,
    }));
  });
export type ConnectionRow = Awaited<ReturnType<typeof listMyConnections>>[number];

/** Send a connection request. RLS blocks self-requests and non-discoverable addressees. */
export const sendRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ to: z.string().uuid() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    if (data.to === context.userId) throw new Error("You can't connect with yourself.");
    // Reverse pair already exists? Reuse it instead of duplicating.
    const { data: existing } = await context.supabase
      .from("connections")
      .select("id, status, requester_id")
      .or(`and(requester_id.eq.${context.userId},addressee_id.eq.${data.to}),and(requester_id.eq.${data.to},addressee_id.eq.${context.userId})`)
      .maybeSingle();
    if (existing) {
      if (existing.status === "declined" && existing.requester_id === context.userId) {
        // Re-request after a decline: replace the old row (requester may delete; only addressee may update).
        const { error: delErr } = await context.supabase.from("connections").delete().eq("id", existing.id);
        if (delErr) throw new Error(delErr.message);
        const { error } = await context.supabase.from("connections").insert({ requester_id: context.userId, addressee_id: data.to });
        if (error) throw new Error(error.message);
        return { ok: true };
      }
      throw new Error("A request between you two already exists.");
    }
    const { error } = await context.supabase.from("connections").insert({ requester_id: context.userId, addressee_id: data.to });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Accept or decline an incoming request (addressee only, enforced by RLS). */
export const respondRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid(), accept: z.boolean() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("connections")
      .update({ status: data.accept ? "accepted" : "declined", responded_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("addressee_id", context.userId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Cancel an outgoing request or remove an existing connection (either party). */
export const removeConnection = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .middleware([requireSupabaseAuth])
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("connections").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
