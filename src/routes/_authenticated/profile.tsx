import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { ProfileForm } from "@/components/site/ProfileForm";
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
    <WorkspaceShell title="My Profile" subtitle="Only you can see this. Every field is optional.">
      {!user || profile.isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          {saved && <p className="mb-6 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">Profile saved.</p>}
          <ProfileForm key={profile.dataUpdatedAt} userId={user.id} profile={profile.data ?? null} onDone={() => setSaved(true)} />
        </>
      )}
    </WorkspaceShell>
  );
}
