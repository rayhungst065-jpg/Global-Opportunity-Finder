import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Search, ExternalLink } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { researchColleges } from "@/lib/college-research.functions";
import { collegeCriteriaSchema, collegeResultSchema, type CollegeResult } from "@/lib/college-research-policy";
import { verificationState } from "@/lib/opportunity-source";
import { useRef } from "react";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { useProfile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/college-match")({
  head: () => ({
    meta: [
      { title: "College Research — Global Opportunity Finder" },
      { name: "description", content: "Research official college sources using selected criteria and reuse your saved results." },
          { property: "og:title", content: "College Research — Global Opportunity Finder" },
      { property: "og:description", content: "Research official college sources using selected criteria and reuse your saved results." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      if (!user) return null;
      const { data, error } = await supabase.from("college_preferences").select("*").eq("user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [d, setD] = useState<Prefs>({
    intended_major: "", preferred_regions: [], institution_types: [], campus_size: "", budget_range: "", financial_aid_interest: false,
  });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [researching, setResearching] = useState(false);
  const [consent, setConsent] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<string>();
  const researchLock = useRef(false);
  const runResearch = useServerFn(researchColleges);
  const history = useQuery({
    queryKey: ["college-research", user?.id], enabled: !!user, retry: false,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("college_research").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });
  const activeResearch = history.data?.find(r => r.id === selectedResearch) ?? history.data?.find(r => r.status === "ready");
  const parsedResults = collegeResultSchema.array().safeParse(activeResearch?.results);
  const results: CollegeResult[] = parsedResults.success ? parsedResults.data : [];

  async function research() {
    if (!user || !consent || researchLock.current) return;
    const parsed = collegeCriteriaSchema.safeParse(d);
    if (!parsed.success) { setMsg({ ok: false, text: parsed.error.issues[0]?.message ?? "Select criteria first." }); return; }
    researchLock.current = true; setResearching(true); setMsg(null);
    try {
      const result = await runResearch({ data: { criteria: parsed.data, confirmPremiumSearch: true } });
      if (result.id) setSelectedResearch(result.id);
      await qc.invalidateQueries({ queryKey: ["college-research", user.id] });
      setMsg({ ok: true, text: result.message });
    } catch (e) { setMsg({ ok: false, text: e instanceof Error ? e.message : "Research failed; no retry was made." }); }
    finally { researchLock.current = false; setResearching(false); setConsent(false); }
  }

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
    <WorkspaceShell title="College Research" subtitle="Official college sources and saved research. Premium search uses credits; matching never guarantees admission, affordability or financial aid.">
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Panel title="Your college preferences">
          <div className="space-y-6">
            <label className="block"><span className="text-sm font-medium">Intended major or field of study</span>
              <input className={input} placeholder="e.g. Biology, Computer Science, Undecided" value={d.intended_major} onChange={(e) => setD({ ...d, intended_major: e.target.value })} /></label>

            <fieldset><legend className="text-sm font-medium">Preferred countries or regions</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {regions.map((r) => (
                  <Button variant="outline" type="button" key={r} aria-pressed={d.preferred_regions.includes(r)} className={chip(d.preferred_regions.includes(r))}
                    onClick={() => setD({ ...d, preferred_regions: toggle(d.preferred_regions, r) })}>{r}</Button>
                ))}
              </div></fieldset>

            <fieldset><legend className="text-sm font-medium">Institution type</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {institutionTypes.map((t) => (
                  <Button variant="outline" type="button" key={t} aria-pressed={d.institution_types.includes(t)} className={chip(d.institution_types.includes(t))}
                    onClick={() => setD({ ...d, institution_types: toggle(d.institution_types, t) })}>{t}</Button>
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
                <span className="block text-sm text-muted-foreground">Research will note aid only when supported by source evidence. Nothing here guarantees eligibility.</span></span>
            </label>

            <div className="flex items-center gap-4">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save preferences"}
              </Button>
              {msg && <p className={`text-sm ${msg.ok ? "text-teal" : "text-destructive"}`}>{msg.text}</p>}
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Research action">
            <p className="text-sm text-muted-foreground">Up to 2 new searches per student per UTC day. Each uses one Parallel search, at most one extraction of 3 pages, and at most one Gemini comparison. Failures count; no automatic retries. Previously saved criteria reuse their results without new requests.</p>
            <label className="mt-4 flex items-start gap-2 text-sm"><Checkbox checked={consent} onCheckedChange={v => setConsent(v === true)} /><span>I confirm premium College Research for my selected criteria. Charges may apply.</span></label>
            <Button className="mt-4 w-full whitespace-normal" disabled={!consent || researching || filled === 0 && !d.financial_aid_interest} onClick={research}><Search className={researching ? "animate-pulse" : ""} />{researching ? "Researching…" : "Research colleges (premium)"}</Button>
            {researching && <p role="status" className="mt-3 text-sm text-muted-foreground">Checking source pages and preparing a comparison…</p>}
          </Panel>
          <Panel title="Saved research">
            {history.error && <p role="alert" className="text-sm text-destructive">{history.error.message}</p>}
            {!history.data?.length && <div className="py-4 text-center"><GraduationCap className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 text-sm text-muted-foreground">No saved research yet. No search has started.</p></div>}
            <div className="space-y-2">{history.data?.map(r => <Button key={r.id} variant={r.id === activeResearch?.id ? "secondary" : "ghost"} className="h-auto w-full justify-start whitespace-normal text-left" onClick={() => setSelectedResearch(r.id)}>{new Date(r.created_at).toLocaleDateString()} · {r.status === "ready" ? "Saved results" : r.status === "pending" ? "Pending — not automatically resumed" : "Failed attempt"}</Button>)}</div>
            {activeResearch?.error_message && <p className="mt-3 text-sm text-muted-foreground">{activeResearch.error_message}</p>}
          </Panel>
        </div>
      </div>
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">College comparisons</h2>
        {activeResearch && <p className="mt-2 text-sm text-muted-foreground">Saved source evidence, not a comprehensive college dataset. Confirm all costs, dates and eligibility with the institution. Opening these results does not recheck sources.</p>}
        <div className="mt-5 grid gap-5 md:grid-cols-2">{results.map(r => <article key={r.source_url} className="rounded-lg border border-border bg-card p-5">
          <h3 className="text-lg font-semibold">{r.institution}</h3>
          <p className="mt-2 text-xs text-muted-foreground">{verificationState(r.checked_at, null)}</p>
          <p className="mt-3 text-sm">{r.fit}</p>
          <dl className="mt-4 space-y-3">{r.facts.map((f, i) => <div key={i}><dt className="text-sm font-medium">{f.label}</dt><dd className="text-sm text-muted-foreground">{f.value}</dd><dd className="mt-1 text-xs text-muted-foreground">Source excerpt: “{f.evidence}”</dd></div>)}</dl>
          {!!r.missing_information.length && <p className="mt-4 text-sm text-muted-foreground">Not verified: {r.missing_information.join(" · ")}</p>}
          <Button asChild variant="link" className="mt-4 h-auto whitespace-normal p-0"><a href={r.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink />Official institution source</a></Button>
        </article>)}</div>
        {activeResearch?.status === "ready" && !results.length && <p className="mt-4 text-sm text-muted-foreground">No candidates passed the evidence checks. No college facts were invented.</p>}
        <p className="mt-5 text-sm text-muted-foreground">Your <Link to="/profile" className="text-primary hover:underline">profile</Link> continues to power stored opportunity recommendations.</p>
      </section>
    </WorkspaceShell>
  );
}
