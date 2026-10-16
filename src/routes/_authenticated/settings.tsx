import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { UserRound, Shield, Compass, Bell, Handshake, UserCog } from "lucide-react";
import { WorkspaceShell, Panel, useSignOut } from "@/components/site/WorkspaceShell";
import { Field, submitBtn } from "@/components/site/AuthCard";
import { AvatarUploader } from "@/components/site/AvatarUploader";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { useProfile, type Category } from "@/lib/profile";
import { categories } from "@/lib/categories";
import { readVisibility, visibilityFields } from "@/lib/profile-options";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Opportunity Finder" },
      { name: "description", content: "Manage your profile, privacy, preferences and account." },
      { property: "og:title", content: "Settings — Opportunity Finder" },
      { property: "og:description", content: "Account and privacy settings." },
    ],
  }),
  component: Settings,
});

const sections = [
  { id: "account", label: "Account", icon: UserCog },
  { id: "profile", label: "Profile information", icon: UserRound },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "preferences", label: "Opportunity preferences", icon: Compass },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "connections", label: "Connections & safety", icon: Handshake },
] as const;

const chip = (on: boolean) => `cursor-pointer rounded-full border px-4 py-2 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`;
const toggleRow = "flex items-start justify-between gap-4 rounded-xl border border-border px-4 py-3";

function Toggle({ checked, onChange, label, desc }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string }) {
  return (
    <label className={toggleRow}>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {desc && <span className="mt-0.5 block text-xs text-muted-foreground">{desc}</span>}
      </span>
      <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-primary" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

function Settings() {
  const { user } = useUser();
  const signOut = useSignOut();
  const qc = useQueryClient();
  const profile = useProfile(user?.id);
  const p = profile.data;
  const [active, setActive] = useState<(typeof sections)[number]["id"]>("account");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const pw = String(f.get("password") ?? "");
    if (pw.length < 8) return setPwMsg({ ok: false, text: "Use at least 8 characters." });
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) return setPwMsg({ ok: false, text: error.message });
    form.reset();
    setPwMsg({ ok: true, text: "Password updated." });
  }

  async function saveProfile(patch: import("@/integrations/supabase/types").Database["public"]["Tables"]["profiles"]["Update"]) {
    if (!user) return;
    setSaving(true);
    setSaveMsg(null);
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    setSaving(false);
    if (error) return setSaveMsg({ ok: false, text: "Couldn't save. Please try again." });
    await qc.invalidateQueries({ queryKey: ["profile"] });
    setSaveMsg({ ok: true, text: "Saved." });
  }

  const vis = readVisibility(p?.visibility);

  return (
    <WorkspaceShell title="Settings" subtitle="Manage your profile, privacy, preferences and account.">
      <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings sections">
          {sections.map((s) => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${active === s.id ? "bg-primary-soft font-medium text-accent-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
              <s.icon className="h-4 w-4 shrink-0" /> {s.label}
            </button>
          ))}
        </nav>

        <div className="max-w-2xl space-y-6">
          {saveMsg && active !== "account" && (
            <p role="status" className={`rounded-xl p-3 text-sm ${saveMsg.ok ? "bg-teal-soft text-teal" : "bg-destructive/10 text-destructive"}`}>{saveMsg.text}</p>
          )}

          {active === "account" && (
            <>
              <Panel title="Account">
                <p className="text-sm text-muted-foreground">Signed in as <span className="text-foreground">{user?.email}</span></p>
              </Panel>
              <Panel title="Change password">
                <form onSubmit={changePassword} className="space-y-4">
                  <Field label="New password" name="password" type="password" autoComplete="new-password" />
                  <button className={submitBtn}>Update password</button>
                  {pwMsg && <p className={`text-sm ${pwMsg.ok ? "text-teal" : "text-destructive"}`}>{pwMsg.text}</p>}
                </form>
              </Panel>
              <Panel title="Log out">
                <button onClick={signOut} className="rounded-full border border-border px-5 py-2 text-sm hover:bg-accent">Log out of this device</button>
              </Panel>
              <Panel title="Delete account">
                <p className="text-sm text-muted-foreground">
                  Account deletion isn't self-serve yet. Deleting an account must also remove your profile, saved opportunities, connections, community memberships, and stored files, so it needs a carefully authorized process. Contact us through the <Link to="/contact" className="text-primary hover:underline">contact page</Link> and we'll handle it.
                </p>
              </Panel>
            </>
          )}

          {active === "profile" && (
            <>
              <Panel title="Profile picture">
                {user && <AvatarUploader userId={user.id} path={p?.avatar_path ?? null} name={p?.display_name ?? null} />}
              </Panel>
              <Panel title="Profile details">
                <p className="text-sm text-muted-foreground">
                  Your display name, bio, education, major, interests and goals are edited on your profile page so you can see exactly how they look.
                </p>
                <Link to="/profile" search={{ edit: true }} className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Edit profile information
                </Link>
              </Panel>
            </>
          )}

          {active === "privacy" && p && (
            <Panel title="Privacy">
              <div className="space-y-3">
                <Toggle
                  checked={p.discoverable}
                  onChange={(v) => saveProfile({ discoverable: v })}
                  label="Let other students discover me"
                  desc="Off by default. When on, signed-in students can find you in Meet Students. Your email is never shown."
                />
                <Toggle
                  checked={p.discoverable}
                  onChange={(v) => saveProfile({ discoverable: v })}
                  label="Allow connection requests"
                  desc="Same switch as discovery: students can only send you requests while you're discoverable."
                />
              </div>
              <fieldset disabled={!p.discoverable} className="mt-5 disabled:opacity-50">
                <legend className="text-sm font-medium">What appears on my student profile</legend>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {visibilityFields.map((f) => (
                    <label key={f.key} className="flex items-center gap-3 rounded-xl border border-border px-4 py-2.5 text-sm">
                      <input type="checkbox" className="h-4 w-4 accent-primary" checked={vis[f.key]}
                        onChange={(e) => saveProfile({ visibility: { ...vis, [f.key]: e.target.checked } })} />
                      {f.label}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Your display name is always shown when discovery is on. These rules are enforced by the server, not just hidden in the app.</p>
              </fieldset>
              {saving && <p className="mt-3 text-xs text-muted-foreground">Saving…</p>}
            </Panel>
          )}

          {active === "preferences" && p && (
            <Panel title="Opportunity preferences" action={saving ? <span className="text-xs text-muted-foreground">Saving…</span> : undefined}>
              <p className="mb-4 text-sm text-muted-foreground">These power your recommendations on the dashboard.</p>
              <fieldset><legend className="text-sm font-medium">Categories of interest</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button type="button" key={c.key} aria-pressed={p.preferred_categories.includes(c.key)} className={chip(p.preferred_categories.includes(c.key))}
                      onClick={() => saveProfile({ preferred_categories: p.preferred_categories.includes(c.key) ? p.preferred_categories.filter((x) => x !== c.key) : [...p.preferred_categories, c.key as Category] })}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-5"><legend className="text-sm font-medium">Participation format</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {([["online", "Online"], ["in_person", "In person"], ["either", "Either"]] as const).map(([v, l]) => (
                    <button type="button" key={v} aria-pressed={p.format_preference === v} className={chip(p.format_preference === v)}
                      onClick={() => saveProfile({ format_preference: v })}>{l}</button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-5"><legend className="text-sm font-medium">Preferred regions</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["Africa", "Asia", "Europe", "Latin America", "Middle East", "North America", "Oceania"].map((r) => (
                    <button type="button" key={r} aria-pressed={p.preferred_regions.includes(r)} className={chip(p.preferred_regions.includes(r))}
                      onClick={() => saveProfile({ preferred_regions: p.preferred_regions.includes(r) ? p.preferred_regions.filter((x) => x !== r) : [...p.preferred_regions, r] })}>{r}</button>
                  ))}
                </div>
              </fieldset>
              <p className="mt-5 text-sm text-muted-foreground">
                Intended major and education level are part of your <Link to="/profile" search={{ edit: true }} className="text-primary hover:underline">profile</Link> and also feed recommendations.
              </p>
            </Panel>
          )}

          {active === "notifications" && (
            <Panel title="Notifications">
              <p className="text-sm text-muted-foreground">
                Email and deadline notifications haven't been built yet, so there are no notification settings to manage. Rather than show toggles that do nothing, this section will appear once notifications actually work. For now, your <Link to="/deadlines" className="text-primary hover:underline">deadlines page</Link> is the way to track dates.
              </p>
            </Panel>
          )}

          {active === "connections" && (
            <>
              <Panel title="My connections">
                <p className="text-sm text-muted-foreground">View your connections and respond to requests.</p>
                <Link to="/meet-students" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Open Meet Students
                </Link>
              </Panel>
              <Panel title="Blocking & reporting">
                <p className="text-sm text-muted-foreground">
                  Blocking and reporting tools aren't implemented yet. They're planned before any messaging feature launches, so students always have a way to protect themselves. If someone is misusing the platform now, please use the <Link to="/contact" className="text-primary hover:underline">contact page</Link>.
                </p>
              </Panel>
            </>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
