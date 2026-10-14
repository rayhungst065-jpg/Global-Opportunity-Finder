import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** The student's saved items joined with listing details (RLS: own rows only). */
export function useSavedList(userId: string | undefined) {
  return useQuery({
    queryKey: ["saved-list", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_opportunities")
        .select("id, status, created_at, opportunity:opportunities(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function upcomingOf<T extends { opportunity: { deadline: string | null } | null }>(items: T[]) {
  const today = new Date().toISOString().slice(0, 10);
  return items
    .filter((s) => s.opportunity?.deadline && s.opportunity.deadline >= today)
    .sort((a, b) => a.opportunity!.deadline!.localeCompare(b.opportunity!.deadline!));
}
