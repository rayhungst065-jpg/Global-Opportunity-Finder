import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { categories } from "@/lib/categories";
import type { Category, Profile } from "@/lib/profile";

const levels = ["Middle school", "High school", "Undergraduate", "Graduate", "Gap year", "Other"];
const regions = ["Africa", "Asia", "Europe", "Latin America", "Middle East", "North America", "Oceania"];
const formats = [
  { v: "online", l: "Online" },
  { v: "in_person", l: "In person" },
  { v: "either", l: "Either" },
] as const;

type Draft = {
  first_name: string; education_level: string; grade: string; country_region: string;
  intended_major: string; interests: string; preferred_categories: Category[];
  format_preference: "online" | "in_person" | "either"; preferred_regions: string[];
};

const input = "mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none transition focus:border-ring focus:ring-4 focus:ring-primary-soft";
const chip = (on: boolean) => `cursor-pointer rounded-full border px-4 py-2 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`;

/**
 * Profile editor shared by onboarding (stepped) and the profile page (all at once).
 * Every field is optional. Writes only to the signed-in student's own row.
 */
export function ProfileForm({ userId, profile, stepped, onDone }: { userId: string; profile: Profile | null; stepped?: boolean; onDone: () => void }) {
  const qc = useQueryClient();
  const [d, setD] = useState<Draft>({
    first_name: profile?.first_name ?? "",
    education_level: profile?.education_level ?? "",
    grade: profile?.grade ?? "",
    country_region: profile?.country_region ?? "",
    intended_major: profile?.intended_major ?? "",
    interests: (profile?.interests ?? []).join(", "),
    preferred_categories: profile?.preferred_categories ?? [],
    format_preference: (profile?.format_preference as Draft["format_preference"]) ?? "either",
    preferred_regions: profile?.preferred_regions ?? [],
  });
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const clip = (s: string) => s.trim().slice(0, 120) || null;

  async function save() {
    setSaving(true);
    setMsg("");
    const { error } = await supabase.from("profiles").update({
      first_name: clip(d.first_name),
      display_name: clip(d.first_name),
      education_level: clip(d.education_level),
      grade: clip(d.grade),
      country_region: clip(d.country_region),
      intended_major: clip(d.intended_major),
      interests: d.interests.split(",").map((x) => x.trim().slice(0, 40)).filter(Boolean).slice(0, 20),
      preferred_categories: d.preferred_categories,
      format_preference: d.format_preference,
      preferred_regions: d.preferred_regions,
      onboarded: true,
    }).eq("id", userId);
    setSaving(false);
    if (error) return setMsg(error.message);
    await qc.invalidateQueries({ queryKey: ["profile"] });
    onDone();
  }

  const steps = [
    {
      title: "About you",
      body: (
        <div className="space-y-5">
          <label className="block"><span className="text-sm font-medium">First name</span>
            <input className={input} value={d.first_name} onChange={(e) => set("first_name", e.target.value)} autoComplete="given-name" /></label>
          <label className="block"><span className="text-sm font-medium">Education level</span>
            <select className={input} value={d.education_level} onChange={(e) => set("education_level", e.target.value)}>
              <option value="">Prefer not to say</option>{levels.map((l) => <option key={l}>{l}</option>)}
            </select></label>
          <label className="block"><span className="text-sm font-medium">Grade or year</span>
            <input className={input} placeholder="e.g. 11th grade, Year 2" value={d.grade} onChange={(e) => set("grade", e.target.value)} /></label>
          <label className="block"><span className="text-sm font-medium">Country or general region</span>
            <input className={input} placeholder="e.g. Canada, Southeast Asia" value={d.country_region} onChange={(e) => set("country_region", e.target.value)} />
            <span className="mt-1 block text-xs text-muted-foreground">No addresses needed — a country or region is enough.</span></label>
        </div>
      ),
    },
    {
      title: "Your interests",
      body: (
        <div className="space-y-5">
          <label className="block"><span className="text-sm font-medium">Intended major or academic interest</span>
            <input className={input} placeholder="e.g. Biology, Computer Science, Undecided" value={d.intended_major} onChange={(e) => set("intended_major", e.target.value)} /></label>
          <label className="block"><span className="text-sm font-medium">Areas of interest (separate with commas)</span>
            <input className={input} placeholder="robotics, writing, climate, music" value={d.interests} onChange={(e) => set("interests", e.target.value)} /></label>
        </div>
      ),
    },
    {
      title: "What you're looking for",
      body: (
        <div className="space-y-6">
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
