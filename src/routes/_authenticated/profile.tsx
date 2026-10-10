import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteLayout";
import { Field, submitBtn } from "@/components/site/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/lib/categories";
import type { Database } from "@/integrations/supabase/types";

type Cat = Database["public"]["Enums"]["opportunity_category"];

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile — Opportunity Finder" },
      { name: "description", content: "Set your education level, interests and preferred categories." },
      { property: "og:title", content: "Your Profile — Opportunity Finder" },
      { property: "og:description", content: "Tell us about yourself to get better matches." },
    ],
  }),
  component: Profile,
});

const levels = ["Middle school", "High school", "Undergraduate", "Graduate", "Other"];

function Profile() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("profiles").select("*").eq("id", u.user!.id).maybeSingle();
      if (error) throw error;
      return { ...data, id: u.user!.id };
    },
  });
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  if (isLoading || !profile) return <SiteShell><p className="mx-auto max-w-2xl px-5 py-24 text-muted-foreground">Loading…</p></SiteShell>;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim().slice(0, 120) || null;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: profile!.id,
      display_name: s("display_name"),
      education_level: s("education_level"),
      grade: s("grade"),
      intended_major: s("intended_major"),
      interests: String(f.get("interests") ?? "").split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20),
      preferred_categories: f.getAll("categories") as Cat[],
      onboarded: true,
    });
    setSaving(false);
    if (error) return setMsg(error.message);
    await qc.invalidateQueries({ queryKey: ["profile"] });
    navigate({ to: "/dashboard" });
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-2xl px-5 py-20">
        <h1 className="text-4xl font-semibold">Your profile</h1>
        <p className="mt-2 text-muted-foreground">Only you can see this information.</p>
        <form onSubmit={onSubmit} className="mt-10 space-y-5">
          <Field label="Display name" name="display_name" defaultValue={profile.display_name ?? ""} />
          <label className="block">
            <span className="text-sm font-medium">Education level</span>
            <select name="education_level" defaultValue={profile.education_level ?? ""} className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3">
              <option value="">Select…</option>
              {levels.map((l) => <option key={l}>{l}</option>)}
            </select>
          </label>
          <Field label="Grade or year" name="grade" placeholder="e.g. 11th grade" defaultValue={profile.grade ?? ""} />
          <Field label="Intended major" name="intended_major" placeholder="e.g. Biology" defaultValue={profile.intended_major ?? ""} />
          <Field label="Interests (comma separated)" name="interests" placeholder="robotics, writing, climate" defaultValue={(profile.interests ?? []).join(", ")} />
          <fieldset>
            <legend className="text-sm font-medium">Preferred categories</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {categories.map((c) => (
                <label key={c.key} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
                  <input type="checkbox" name="categories" value={c.key} defaultChecked={profile.preferred_categories?.includes(c.key)} />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>
          <button className={submitBtn} disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
          {msg && <p className="text-sm text-destructive">{msg}</p>}
        </form>
      </section>
    </SiteShell>
  );
}
