import type { Profile } from "@/lib/profile";

export function hasExplored(profile: Pick<Profile, "preferences"> | null | undefined, savedCount: number) {
  const preferences = profile?.preferences;
  return savedCount > 0 || (typeof preferences === "object" && preferences !== null && !Array.isArray(preferences) && preferences["opportunities_explored"] === true);
}