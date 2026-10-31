import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { optimizeAvatar, validateAvatar } from "@/lib/avatar-image";
export { AVATAR_TYPES, AVATAR_MAX_BYTES, validateAvatar } from "@/lib/avatar-image";

/** Private avatar loaded through an authenticated, RLS-checked download each time
 * (no shareable signed link), so revoked access takes effect on the next load. */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar-url", path],
    enabled: !!path,
    staleTime: 60 * 1000,
    gcTime: 60 * 1000,
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage.from("avatars").download(path);
      if (error) throw error;
      return URL.createObjectURL(data);
    },
  });
}

export function useAvatarActions(userId: string, currentPath: string | null) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["profile"] });

  async function upload(file: File) {
    const bad = validateAvatar(file);
    if (bad) throw new Error(bad);
    const optimized = await optimizeAvatar(file);
    const ext = optimized.type === "image/webp" ? "webp" : optimized.type === "image/png" ? "png" : "jpg";
    const path = `${userId}/avatar-${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("avatars").upload(path, optimized, { contentType: optimized.type, upsert: false });
    if (up.error) throw new Error("Upload failed. Please try again.");
    const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", userId);
    if (error) {
      await supabase.storage.from("avatars").remove([path]);
      throw new Error("Couldn't save your picture. Please try again.");
    }
    if (currentPath) await supabase.storage.from("avatars").remove([currentPath]);
    await refresh();
  }

  async function remove() {
    const { error } = await supabase.from("profiles").update({ avatar_path: null }).eq("id", userId);
    if (error) throw new Error("Couldn't remove your picture. Please try again.");
    if (currentPath) await supabase.storage.from("avatars").remove([currentPath]);
    await refresh();
  }

  return { upload, remove };
}
