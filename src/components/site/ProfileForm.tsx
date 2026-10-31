import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/lib/categories";
import type { Category, Profile } from "@/lib/profile";
import { educationLevels, goalOptions, interestOptions, readVisibility, visibilityFields, type Visibility } from "@/lib/profile-options";

const levels = educationLevels;
const regions = ["Africa", "Asia", "Europe", "Latin America", "Middle East", "North America", "Oceania"];
const formats = [
  { v: "online", l: "Online" },
  { v: "in_person", l: "In person" },
  { v: "either", l: "Either" },
] as const;

type Draft = {
  first_name: string; bio: string; education_level: string; grade: string; country_region: string;
  intended_major: string; languages: string; interests: string[]; customInterest: string; skills: string;
  goals: string[]; preferred_categories: Category[];
  format_preference: "online" | "in_person" | "either"; preferred_regions: string[];
  discoverable: boolean; visibility: Visibility;
};

const input = "mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none transition focus:border-ring focus:ring-4 focus:ring-primary-soft";
const chip = (on: boolean) => `cursor-pointer rounded-full border px-4 py-2 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`;
const list = (s: string, max = 20, len = 40) => s.split(",").map((x) => x.trim().slice(0, len)).filter(Boolean).slice(0, max);

/**
 * Profile editor shared by onboarding (stepped) and the profile page (all at once).
 * Every field is optional. Writes only to the signed-in student's own row.
 */
export function ProfileForm({ userId, profile, stepped, onDone }: { userId: string; profile: Profile | null; stepped?: boolean; onDone: () => void }) {
  const qc = useQueryClient();
  const [d, setD] = useState<Draft>({
    first_name: profile?.display_name ?? profile?.first_name ?? "",
    bio: profile?.bio ?? "",
    education_level: profile?.education_level ?? "",
    grade: profile?.grade ?? "",
    country_region: profile?.country_region ?? "",
    intended_major: profile?.intended_major ?? "",
    languages: (profile?.languages ?? []).join(", "),
    interests: profile?.interests ?? [],
    customInterest: "",
    skills: (profile?.skills ?? []).join(", "),
    goals: profile?.goals ?? [],
    preferred_categories: profile?.preferred_categories ?? [],
    format_preference: (profile?.format_preference as Draft["format_preference"]) ?? "either",
    preferred_regions: profile?.preferred_regions ?? [],
    discoverable: profile?.discoverable ?? false,
    visibility: readVisibility(profile?.visibility),
  });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const clip = (s: string) => s.trim().slice(0, 120) || null;

  function addCustom() {
    const v = d.customInterest.trim().slice(0, 40);
    if (v && !d.interests.includes(v) && d.interests.length < 20) set("interests", [...d.interests, v]);
    set("customInterest", "");
  }

  async function save() {
    setSaving(true);
    setMsg("");
    const { error } = await supabase.from("profiles").update({
      first_name: clip(d.first_name),
      display_name: clip(d.first_name),
      bio: d.bio.trim().slice(0, 500) || null,
      education_level: clip(d.education_level),
      grade: clip(d.grade),
      country_region: clip(d.country_region),
      intended_major: clip(d.intended_major),
      languages: list(d.languages, 10, 30),
      interests: d.interests.slice(0, 20),
      skills: list(d.skills),
      goals: d.goals.slice(0, 12),
      preferred_categories: d.preferred_categories,
      format_preference: d.format_preference,
      preferred_regions: d.preferred_regions,
      discoverable: d.discoverable,
      visibility: d.visibility,
      onboarded: true,
    }).eq("id", userId);
    setSaving(false);
    if (error) return setMsg("Couldn't save your profile. Please try again.");
    await qc.invalidateQueries({ queryKey: ["profile"] });
    onDone();
  }

  const customInterests = d.interests.filter((i) => !interestOptions.includes(i));

  const steps = [
    {
      title: "About you",
      body: (
        <div className="space-y-5">
          <label className="block"><span className="text-sm font-medium">Display name</span>
            <input className={input} value={d.first_name} maxLength={120} onChange={(e) => set("first_name", e.target.value)} autoComplete="nickname" /></label>
          <label className="block"><span className="text-sm font-medium">Bio</span>
            <textarea className={`${input} min-h-24`} maxLength={500} placeholder="Introduce yourself in your own words — your interests, personality, goals, passions, or the projects and collaborations you're looking for." value={d.bio} onChange={(e) => set("bio", e.target.value)} />
            <span className="mt-1 block text-xs text-muted-foreground">{d.bio.length}/500</span></label>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block"><span className="text-sm font-medium">Education level</span>
              <select className={input} value={d.education_level} onChange={(e) => set("education_level", e.target.value)}>
                <option value="">Prefer not to say</option>{levels.map((l) => <option key={l} value={l}>{l}</option>)}
              </select></label>
            <label className="block"><span className="text-sm font-medium">Grade or year</span>
              <input className={input} placeholder="e.g. 11th grade, Year 2" value={d.grade} onChange={(e) => set("grade", e.target.value)} /></label>
          </div>
          <label className="block"><span className="text-sm font-medium">Country</span>
            <input className={input} placeholder="e.g. Canada" value={d.country_region} onChange={(e) => set("country_region", e.target.value)} />
            <span className="mt-1 block text-xs text-muted-foreground">Optional. No address needed.</span></label>
          <label className="block"><span className="text-sm font-medium">Languages (separate with commas)</span>
            <input className={input} placeholder="English, Spanish, Mandarin" value={d.languages} onChange={(e) => set("languages", e.target.value)} /></label>
        </div>
      ),
    },
    {
      title: "Your interests",
      body: (
        <div className="space-y-6">
          <label className="block"><span className="text-sm font-medium">Intended major or academic interest</span>
            <input className={input} placeholder="e.g. Biology, Computer Science, Undecided" value={d.intended_major} onChange={(e) => set("intended_major", e.target.value)} /></label>
          <fieldset><legend className="text-sm font-medium">Interests (choose any)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[...interestOptions, ...customInterests].map((i) => (
                <button type="button" key={i} aria-pressed={d.interests.includes(i)} className={chip(d.interests.includes(i))} onClick={() => set("interests", toggle(d.interests, i))}>{i}</button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input aria-label="Add your own interest" className={`${input} mt-0`} placeholder="Add your own, e.g. astronomy" value={d.customInterest}
                onChange={(e) => set("customInterest", e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }} />
              <button type="button" onClick={addCustom} className="rounded-xl border border-border px-4 text-sm hover:bg-accent">Add</button>
            </div></fieldset>
        </div>
      ),
    },
    {
      title: "What you're looking for",
      body: (
        <div className="space-y-6">
          <fieldset><legend className="text-sm font-medium">Goals</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {goalOptions.map((g) => (
                <button type="button" key={g} aria-pressed={d.goals.includes(g)} className={chip(d.goals.includes(g))} onClick={() => set("goals", toggle(d.goals, g))}>{g}</button>
              ))}
            </div></fieldset>
          <fieldset><legend className="text-sm font-medium">Opportunity categories</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button type="button" key={c.key} aria-pressed={d.preferred_categories.includes(c.key)} className={chip(d.preferred_categories.includes(c.key))}
                  onClick={() => set("preferred_categories", toggle(d.preferred_categories, c.key as Category))}>{c.name}</button>
              ))}
            </div></fieldset>
          <fieldset><legend className="text-sm font-medium">Format</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {formats.map((f) => (
                <button type="button" key={f.v} aria-pressed={d.format_preference === f.v} className={chip(d.format_preference === f.v)} onClick={() => set("format_preference", f.v)}>{f.l}</button>
              ))}
            </div></fieldset>
          <fieldset><legend className="text-sm font-medium">Preferred regions (optional)</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {regions.map((r) => (
                <button type="button" key={r} aria-pressed={d.preferred_regions.includes(r)} className={chip(d.preferred_regions.includes(r))} onClick={() => set("preferred_regions", toggle(d.preferred_regions, r))}>{r}</button>
              ))}
            </div></fieldset>
        </div>
      ),
    },
    {
      title: "Privacy",
      body: (
        <div className="space-y-6">
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={d.discoverable} onChange={(e) => set("discoverable", e.target.checked)} />
            <span><span className="text-sm font-medium">Let other students discover me</span>
              <span className="block text-sm text-muted-foreground">Off by default. When on, other signed-in students will be able to find you by shared interests once student discovery opens. Your email is never shown.</span></span>
          </label>
          <fieldset disabled={!d.discoverable} className="disabled:opacity-50"><legend className="text-sm font-medium">What other students can see</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {visibilityFields.map((f) => (
                <label key={f.key} className="flex items-center gap-3 rounded-xl border border-border px-4 py-2.5 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-primary" checked={d.visibility[f.key]} onChange={(e) => set("visibility", { ...d.visibility, [f.key]: e.target.checked })} />
                  {f.label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Your display name is always shown when discovery is on.</p>
          </fieldset>
        </div>
      ),
    },
  ];

  const btn = "rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50";
  const ghost = "rounded-full px-5 py-3 text-sm text-muted-foreground hover:text-foreground";

  if (!stepped) {
    return (
      <div className="space-y-6">
        {steps.map((s) => (
          <section key={s.title} className="rounded-3xl border border-border bg-card p-6">
            <h2 className="mb-5 text-lg font-semibold">{s.title}</h2>{s.body}
          </section>
        ))}
        <button className={btn} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save profile"}</button>
        {msg && <p className="text-sm text-destructive">{msg}</p>}
      </div>
    );
  }

  const last = step === steps.length - 1;
  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-lift">
      <p className="text-sm text-muted-foreground">Step {step + 1} of {steps.length}</p>
      <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
      <h2 className="mt-6 text-2xl font-semibold">{steps[step]!.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">Every question is optional. You can change answers later.</p>
      <div className="mt-6">{steps[step]!.body}</div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={ghost} disabled={step === 0} onClick={() => setStep(step - 1)}>{step > 0 ? "← Back" : ""}</button>
        <div className="flex gap-2">
          <button type="button" className={ghost} onClick={() => (last ? save() : setStep(step + 1))}>Skip</button>
          <button type="button" className={btn} disabled={saving} onClick={() => (last ? save() : setStep(step + 1))}>{last ? (saving ? "Saving…" : "Finish") : "Next"}</button>
        </div>
      </div>
      {msg && <p className="mt-4 text-sm text-destructive">{msg}</p>}
    </div>
  );
}
