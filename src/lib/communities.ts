import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type Membership = Database["public"]["Tables"]["community_memberships"]["Row"];

/** The signed-in student's memberships (pending + approved), via RLS. */
export function useMyMemberships(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-memberships", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("community_memberships").select("*").eq("user_id", userId!);
      if (error) throw error;
      return data;
    },
  });
}

/** Approved member count for a community (creator/member-scoped RLS may hide rows for others, so this is best-effort). */
export function useMemberCount(communityId: string | undefined) {
  return useQuery({
    queryKey: ["member-count", communityId],
    enabled: !!communityId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("community_memberships")
        .select("id", { count: "exact", head: true })
        .eq("community_id", communityId!)
        .eq("status", "approved");
      if (error) throw error;
      return count ?? 0;
    },
  });
}

/** Pending join requests for a community the signed-in student created. */
export function useJoinRequests(communityId: string | undefined, isCreator: boolean) {
  return useQuery({
    queryKey: ["join-requests", communityId],
    enabled: !!communityId && isCreator,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_memberships")
        .select("*")
        .eq("community_id", communityId!)
        .eq("status", "pending");
      if (error) throw error;
      return data;
    },
  });
}

export function useMembershipActions(userId: string | undefined) {
  const qc = useQueryClient();
  const done = () => {
    qc.invalidateQueries({ queryKey: ["my-memberships", userId] });
    qc.invalidateQueries({ queryKey: ["member-count"] });
    qc.invalidateQueries({ queryKey: ["join-requests"] });
  };
  const join = useMutation({
    mutationFn: async (communityId: string) => {
      const { error } = await supabase.from("community_memberships").insert({ community_id: communityId, user_id: userId! });
      if (error) throw error;
    },
    onSuccess: done,
  });
  const leave = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from("community_memberships").delete().eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: done,
  });
  const approve = useMutation({
    mutationFn: async (membershipId: string) => {
      const { error } = await supabase.from("community_memberships").update({ status: "approved" }).eq("id", membershipId);
      if (error) throw error;
    },
    onSuccess: done,
  });
  return { join, leave, approve };
}
