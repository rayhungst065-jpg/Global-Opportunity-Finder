import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { Opportunity } from "@/lib/saved";
import { isNormalRecommendation } from "@/lib/opportunity-source";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Category = Database["public"]["Enums"]["opportunity_category"];

/** The signed-in student's own profile row (RLS restricts to auth.uid()). */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Record an actual catalog visit, preserving all existing profile preferences. */
export async function markOpportunitiesExplored(userId: string) {
  const { data: profile, error } = await supabase.from("profiles").select("preferences").eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!profile) return;
  const preferences = profile.preferences;
  const existing = typeof preferences === "object" && preferences !== null && !Array.isArray(preferences) ? preferences : {};
  if (existing["opportunities_explored"] === true) return;
  const { error: updateError } = await supabase.from("profiles").update({ preferences: { ...existing, opportunities_explored: true } }).eq("id", userId);
  if (updateError) throw updateError;
}

/** All public listings, read in the browser (anon/auth SELECT policy). */
export function useAllOpportunities() {
  return useQuery({
    queryKey: ["opportunities-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("opportunities").select("*");
      if (error) throw error;
      return data;
    },
  });
}

/** Which profile fields count toward the completion meter. */
export function profileCompletion(p: Profile | null | undefined) {
  if (!p) return 0;
  const checks = [
    !!(p.display_name || p.first_name),
    !!p.avatar_path,
    !!p.bio,
    !!p.education_level,
    !!p.grade,
    !!p.intended_major,
    p.interests.length > 0,
    p.goals.length > 0,
    p.preferred_categories.length > 0,
    p.languages.length > 0 || p.skills.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/** Simple rule-based matching: category, interest keywords, format. Closed listings excluded. */
export function recommend(p: Profile | null | undefined, list: Opportunity[], includeDemo = false) {
  if (!p) return [];
  const words = [...p.interests, p.intended_major ?? ""].map((w) => w.toLowerCase().trim()).filter(Boolean);
  return list
    .filter((o) => (includeDemo && o.is_demo && o.application_status !== "closed") || isNormalRecommendation(o))
    .map((o) => {
      const text = `${o.title} ${o.description} ${o.eligibility}`.toLowerCase();
      const online = o.location.toLowerCase().includes("online");
      let score = 0;
      const reasons: string[] = [];
      if (p.preferred_categories.includes(o.category)) { score += 3; reasons.push("Matches a category you chose"); }
      const hit = words.find((w) => text.includes(w));
      if (hit) { score += 2; reasons.push(`Mentions "${hit}"`); }
      if (p.format_preference === "online" && online) { score += 1; reasons.push("Available online"); }
      if (p.format_preference === "in_person" && !online) { score += 1; reasons.push("In person"); }
      return { o, score, reasons };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);
}
