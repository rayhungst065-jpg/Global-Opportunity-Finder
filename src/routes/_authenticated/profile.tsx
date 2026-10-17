import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { ProfileForm } from "@/components/site/ProfileForm";
import { AvatarUploader } from "@/components/site/AvatarUploader";
import { Avatar } from "@/components/site/Avatar";
import { useUser } from "@/lib/auth";
import { useProfile, type Profile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (s: Record<string, unknown>) => (s["edit"] === true ? { edit: true as const } : {}),
  head: () => ({
    meta: [
      { title: "My Profile — Global Opportunity Finder" },
      { name: "description", content: "View and edit your student profile, interests and opportunity preferences." },
      { property: "og:title", content: "My Profile — Global Opportunity Finder" },
      { property: "og:description", content: "Your student profile and preferences." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const chip = "rounded-full px-3 py-1 text-sm";
const editBtn = "inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function ProfileView({ p, onEdit }: { p: Profile; onEdit: () => void }) {
  const name = p.display_name || p.first_name || "Unnamed student";
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar path={p.avatar_path} name={name} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold">{name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {[p.education_level, p.grade, p.intended_major].filter(Boolean).join(" · ") || "Student"}
            </p>
            {p.bio && <p className="mt-3 max-w-xl text-sm text-muted-foreground">{p.bio}</p>}
          </div>
          <button onClick={onEdit} className={editBtn}><Pencil className="h-4 w-4" /> Edit profile</button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h3 className="text-base font-semibold">About</h3>
        <dl className="mt-2 divide-y divide-border">
          <Row label="Intended major">{p.intended_major ?? <span className="text-muted-foreground">Not set</span>}</Row>
          <Row label="Education">{[p.education_level, p.grade].filter(Boolean).join(" · ") || <span className="text-muted-foreground">Not set</span>}</Row>
          <Row label="Interests">
            {p.interests.length ? (
              <span className="flex flex-wrap gap-2">{p.interests.map((i) => <span key={i} className={`${chip} bg-primary-soft text-accent-foreground`}>{i}</span>)}</span>
            ) : <span className="text-muted-foreground">Not set</span>}
          </Row>
          <Row label="Goals">
            {p.goals.length ? (
              <span className="flex flex-wrap gap-2">{p.goals.map((g) => <span key={g} className={`${chip} bg-teal-soft text-teal`}>{g}</span>)}</span>
            ) : <span className="text-muted-foreground">Not set</span>}
          </Row>
          <Row label="Languages">
            {p.languages.length ? (
              <span className="flex flex-wrap gap-2">{p.languages.map((l) => <span key={l} className={`${chip} bg-coral-soft text-coral`}>{l}</span>)}</span>
            ) : <span className="text-muted-foreground">Not set</span>}
          </Row>
          <Row label="Skills">
            {p.skills.length ? (
              <span className="flex flex-wrap gap-2">{p.skills.map((s) => <span key={s} className={`${chip} border border-border text-muted-foreground`}>{s}</span>)}</span>
            ) : <span className="text-muted-foreground">Not set</span>}
          </Row>
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          You control what other students can see in your <Link to="/settings" className="text-primary hover:underline">privacy settings</Link>.
        </p>
      </section>
    </div>
  );
}

function ProfilePage() {
  const { user } = useUser();
  const profile = useProfile(user?.id);
  const { edit } = Route.useSearch();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const setEdit = (v: boolean) => navigate({ to: "/profile", search: v ? { edit: true as const } : {}, replace: true });

  return (
    <WorkspaceShell
      title={edit ? "Edit Profile" : "My Profile"}
      subtitle={edit ? "Every field is optional. You choose what other students can see." : "How your student profile looks."}
    >
      {!user || profile.isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : profile.isError ? (
        <p className="text-destructive">Couldn't load your profile. Please refresh the page.</p>
      ) : edit ? (
        <>
          {saved && <p role="status" className="mb-6 rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">Profile saved.</p>}
          <div className="mb-6 flex items-start justify-between gap-4">
            <AvatarUploader userId={user.id} path={profile.data?.avatar_path ?? null} name={profile.data?.display_name ?? null} />
            <button onClick={() => setEdit(false)} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-accent">
              <X className="h-4 w-4" /> Done editing
            </button>
          </div>
          <ProfileForm key={profile.dataUpdatedAt} userId={user.id} profile={profile.data ?? null} onDone={() => { setSaved(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        </>
      ) : (
        <ProfileView p={profile.data!} onEdit={() => setEdit(true)} />
      )}
    </WorkspaceShell>
  );
}
