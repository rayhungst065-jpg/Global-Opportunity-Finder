import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { ProfileForm } from "@/components/site/ProfileForm";
import { AvatarUploader } from "@/components/site/AvatarUploader";
import { useUser } from "@/lib/auth";
import { useProfile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Opportunity Finder" },
      { name: "description", content: "Edit your education level, interests and opportunity preferences." },
      { property: "og:title", content: "My Profile — Opportunity Finder" },
      { property: "og:description", content: "Update your preferences for better matches." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useUser();
  const profile = useProfile(user?.id);
  const [saved, setSaved] = useState(false);
  return (
    <WorkspaceShell title="My Profile" subtitle="Every field is optional. You choose what other students can see.">
      {!user || profile.isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : profile.isError ? (
        <p className="text-destructive">Couldn't load your profile. Please refresh the page.</p>
      ) : (
        <>
          {saved && <p role="status" className="mb-6 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">Profile saved.</p>}
          <div className="mb-6">
            <AvatarUploader userId={user.id} path={profile.data?.avatar_path ?? null} name={profile.data?.display_name ?? null} />
          </div>
          <ProfileForm key={profile.dataUpdatedAt} userId={user.id} profile={profile.data ?? null} onDone={() => { setSaved(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      )}
    </WorkspaceShell>
  );
}
