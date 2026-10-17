import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { useProfile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/college-match")({
  head: () => ({
    meta: [
      { title: "College Match — Global Opportunity Finder" },
      { name: "description", content: "Explore colleges that fit your intended major, preferences, and goals." },
    ],
  }),
  component: CollegeMatch,
});

const regions = ["Africa", "Asia", "Europe", "Latin America", "Middle East", "North America", "Oceania"];
const institutionTypes = ["Public university", "Private university", "Liberal arts college", "Community college", "Technical institute"];
const campusSizes = ["Small (under 5,000)", "Medium (5,000–15,000)", "Large (over 15,000)", "No preference"];
const budgets = ["Under $10k / year", "$10k–$30k / year", "$30k–$60k / year", "Over $60k / year", "No set budget"];

const chip = (on: boolean) => `cursor-pointer rounded-full border px-4 py-2 text-sm transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent"}`;
const input = "mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none transition focus:border-ring focus:ring-4 focus:ring-primary-soft";

type Prefs = {
  intended_major: string;
  preferred_regions: string[];
  institution_types: string[];
  campus_size: string;
  budget_range: string;
  financial_aid_interest: boolean;
};

function CollegeMatch() {
  const { user } = useUser();
  const qc = useQueryClient();
  const profile = useProfile(user?.id).data;
  const saved = useQuery({
    queryKey: ["college-preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("college_preferences").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [d, setD] = useState<Prefs>({
    intended_major: "", preferred_regions: [], institution_types: [], campus_size: "", budget_range: "", financial_aid_interest: false,
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (saved.data) {
      setD({
        intended_major: saved.data.intended_major ?? "",
        preferred_regions: saved.data.preferred_regions,
        institution_types: saved.data.institution_types,
        campus_size: saved.data.campus_size ?? "",
        budget_range: saved.data.budget_range ?? "",
        financial_aid_interest: saved.data.financial_aid_interest,
      });
    } else if (saved.data === null && profile?.intended_major) {
      setD((p) => ({ ...p, intended_major: profile.intended_major ?? "" }));
    }
  }, [saved.data, profile?.intended_major]);

  const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  async function save() {
    if (!user) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from("college_preferences").upsert({
      user_id: user.id,
      intended_major: d.intended_major.trim().slice(0, 120) || null,
      preferred_regions: d.preferred_regions,
      institution_types: d.institution_types,
      campus_size: d.campus_size || null,
      budget_range: d.budget_range || null,
      financial_aid_interest: d.financial_aid_interest,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) return setMsg({ ok: false, text: "Couldn't save your preferences. Please try again." });
    await qc.invalidateQueries({ queryKey: ["college-preferences"] });
    setMsg({ ok: true, text: "Preferences saved." });
  }

  const filled = [d.intended_major, d.campus_size, d.budget_range].filter(Boolean).length + (d.preferred_regions.length ? 1 : 0) + (d.institution_types.length ? 1 : 0);

  return (
    <WorkspaceShell title="College Match" subtitle="Set your college preferences — they'll power matching once a verified college dataset is connected.">
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Panel title="Your college preferences">
          <div className="space-y-6">
            <label className="block"><span className="text-sm font-medium">Intended major or field of study</span>
              <input className={input} placeholder="e.g. Biology, Computer Science, Undecided" value={d.intended_major} onChange={(e) => setD({ ...d, intended_major: e.target.value })} /></label>

            <fieldset><legend className="text-sm font-medium">Preferred countries or regions</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {regions.map((r) => (
                  <button type="button" key={r} aria-pressed={d.preferred_regions.includes(r)} className={chip(d.preferred_regions.includes(r))}
                    onClick={() => setD({ ...d, preferred_regions: toggle(d.preferred_regions, r) })}>{r}</button>
                ))}
              </div></fieldset>

            <fieldset><legend className="text-sm font-medium">Institution type</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {institutionTypes.map((t) => (
                  <button type="button" key={t} aria-pressed={d.institution_types.includes(t)} className={chip(d.institution_types.includes(t))}
                    onClick={() => setD({ ...d, institution_types: toggle(d.institution_types, t) })}>{t}</button>
                ))}
              </div></fieldset>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block"><span className="text-sm font-medium">Campus size</span>
                <select className={input} value={d.campus_size} onChange={(e) => setD({ ...d, campus_size: e.target.value })}>
                  <option value="">No preference</option>
                  {campusSizes.filter((s) => s !== "No preference").map((s) => <option key={s}>{s}</option>)}
                </select></label>
              <label className="block"><span className="text-sm font-medium">Budget range</span>
                <select className={input} value={d.budget_range} onChange={(e) => setD({ ...d, budget_range: e.target.value })}>
                  <option value="">No set budget</option>
                  {budgets.filter((b) => b !== "No set budget").map((b) => <option key={b}>{b}</option>)}
                </select></label>
            </div>

            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={d.financial_aid_interest} onChange={(e) => setD({ ...d, financial_aid_interest: e.target.checked })} />
              <span><span className="text-sm font-medium">I'm interested in financial aid or scholarships</span>
                <span className="block text-sm text-muted-foreground">Matches will note aid options when data is available. Nothing here guarantees eligibility.</span></span>
            </label>

            <div className="flex items-center gap-4">
              <button onClick={save} disabled={saving} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
                {saving ? "Saving…" : "Save preferences"}
              </button>
              {msg && <p className={`text-sm ${msg.ok ? "text-teal" : "text-destructive"}`}>{msg.text}</p>}
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Your matches">
            <div className="rounded-2xl border border-dashed border-border p-5 text-center">
              <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">No verified college data connected yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                We won't show invented colleges, costs, or acceptance rates. Matching launches once a reliable, verifiable college dataset is connected — then every result will explain why it fits your preferences and link to the official university site.
              </p>
            </div>
            {filled > 0 && (
              <p className="mt-4 text-sm text-muted-foreground">
                Your saved preferences ({filled} set) are ready and will be used as soon as matching goes live.
              </p>
            )}
          </Panel>
          <Panel title="In the meantime">
            <p className="text-sm text-muted-foreground">
              Keep your <Link to="/profile" className="text-primary hover:underline">intended major and interests</Link> up to date — they're shared with opportunity recommendations today and college matching later.
            </p>
          </Panel>
        </div>
      </div>
    </WorkspaceShell>
  );
}
