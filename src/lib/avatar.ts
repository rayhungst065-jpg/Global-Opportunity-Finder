import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** Returns an error message, or null when the file is acceptable. */
export function validateAvatar(file: File) {
  if (!AVATAR_TYPES.includes(file.type)) return "Please choose a JPG, PNG or WebP image.";
  if (file.size > AVATAR_MAX_BYTES) return "That image is larger than 2 MB. Please choose a smaller one.";
  return null;
}

/** Short-lived signed URL for a private avatar (bucket is private; RLS limits reads). */
export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar-url", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path!, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}

export function useAvatarActions(userId: string, currentPath: string | null) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["profile"] });

  async function upload(file: File) {
    const bad = validateAvatar(file);
    if (bad) throw new Error(bad);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: false });
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
