import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Opportunity = Database["public"]["Tables"]["opportunities"]["Row"];
export type SavedStatus = Database["public"]["Enums"]["saved_status"];

/** IDs of opportunities the signed-in student saved (RLS limits rows to their own). */
export function useSavedIds(userId: string | undefined) {
  return useQuery({
    queryKey: ["saved-ids", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return new Set<string>();
      const { data, error } = await supabase.from("saved_opportunities").select("opportunity_id").eq("user_id", userId);
      if (error) throw error;
      return new Set(data.map((r) => r.opportunity_id));
    },
  });
}

export function useToggleSave(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, saved }: { id: string; saved: boolean }) => {
      if (!userId) throw new Error("Sign in to save opportunities.");
      const res = saved
        ? await supabase.from("saved_opportunities").delete().eq("opportunity_id", id).eq("user_id", userId)
        : await supabase.from("saved_opportunities").insert({ opportunity_id: id, user_id: userId });
      if (res.error) throw res.error;
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["saved-ids"] });
      qc.invalidateQueries({ queryKey: ["saved-list"] });
    },
  });
}

export const statusLabel: Record<Opportunity["application_status"], string> = {
  open: "Open",
  rolling: "Rolling",
  upcoming: "Upcoming",
  closed: "Closed",
};
