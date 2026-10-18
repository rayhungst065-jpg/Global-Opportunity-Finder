import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Search, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { searchColleges } from "@/lib/colleges.functions";
import { safeOfficialUrl } from "@/lib/opportunity-source";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { useProfile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/college-match")({
  head: () => ({
    meta: [
      { title: "College Search — Global Opportunity Finder" },
      { name: "description", content: "Search, filter and sort the saved university spreadsheet database." },
          { property: "og:title", content: "College Search — Global Opportunity Finder" },
      { property: "og:description", content: "Search, filter and sort the saved university spreadsheet database." },
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
  const [filters, setFilters] = useState({ query: "", region: "", country: "", type: "", sort: "name" as "name" | "rank" | "country" | "enrollment", page: 0 });
  const [searchText, setSearchText] = useState("");
  const searchFn = useServerFn(searchColleges);
  const catalog = useQuery({ queryKey: ["college-catalog", filters], queryFn: () => searchFn({ data: filters }), retry: false });
  const changeFilter = (key: "region" | "country" | "type", value: string) => setFilters(f => ({ ...f, [key]: value, page: 0 }));

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

  return (
    <WorkspaceShell title="College Search" subtitle="Universities from your saved spreadsheet. Figures may be approximate or out of date; confirm details with each institution.">
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
                <span className="block text-sm text-muted-foreground">Your preference is saved; the spreadsheet does not provide verified scholarship or financial-aid eligibility.</span></span>
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
          <Panel title="Search universities">
            <form onSubmit={e => { e.preventDefault(); setFilters(f => ({ ...f, query: searchText.trim(), page: 0 })); }}>
              <label className="block text-sm font-medium">University or country<input aria-label="University or country" className={input} value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Search universities" /></label>
              <Button type="submit" className="mt-3 w-full"><Search />Search</Button>
            </form>
            <div className="mt-4 space-y-4">
              {([['region', 'Region', catalog.data?.regions], ['country', 'Country', catalog.data?.countries], ['type', 'Institution type', catalog.data?.types]] as const).map(([key,label,values]) => <label key={key} className="block text-sm font-medium">{label}<select aria-label={label} className={input} value={filters[key]} onChange={e => changeFilter(key,e.target.value)}><option value="">All</option>{values?.map(v => <option key={v} value={v}>{v}</option>)}</select></label>)}
              <label className="block text-sm font-medium">Sort by<select aria-label="Sort by" className={input} value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value as typeof f.sort, page: 0 }))}><option value="name">University name</option><option value="rank">QS rank (exact ranks first)</option><option value="country">Country</option><option value="enrollment">Enrollment (largest first)</option></select></label>
              <Button variant="ghost" onClick={() => { setSearchText(""); setFilters({ query: "", region: "", country: "", type: "", sort: "name", page: 0 }); }}>Clear filters</Button>
            </div>
          </Panel>
          <div className="border-l-2 border-coral pl-4 text-sm text-muted-foreground"><GraduationCap className="mb-2 h-6 w-6" />Source: college_research_database.xlsx. Ranking bands and other approximate values are shown exactly as supplied. Blank cells are shown as “Not provided”; N/A values are preserved.</div>
        </div>
      </div>
      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">University results</h2>
        {catalog.error && <p role="alert" className="mt-3 text-sm text-destructive">{catalog.error.message}</p>}
        {catalog.isPending ? <p role="status" className="mt-4 text-muted-foreground">Loading universities…</p> : <p role="status" className="mt-2 text-sm text-muted-foreground">{catalog.data?.total ?? 0} universities · Page {filters.page + 1}</p>}
        <div className="mt-5 grid gap-5 md:grid-cols-2">{catalog.data?.rows.map(r => {
          const url = safeOfficialUrl(r.official_website);
          return <article key={r.id} className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-lg font-semibold break-words">{r.university}</h3><p className="mt-1 text-sm text-muted-foreground">{r.country || "Not provided"} · {r.region || "Not provided"}</p>
            <dl className="mt-4 space-y-3">{[["QS Rank (2027)",r.qs_rank],["Type",r.institution_type],["Tuition (approx., per year, undergrad)",r.tuition],["Campus size",r.campus_size],["GPA requirement",r.gpa_requirement],["Acceptance rate (approx.)",r.acceptance_rate],["Enrollment (approx. total)",r.enrollment]].map(([label,value]) => <div key={label}><dt className="text-sm font-medium">{label}</dt><dd className="text-sm text-muted-foreground break-words">{value ?? "Not provided"}</dd></div>)}</dl>
            {url ? <Button asChild variant="link" className="mt-4 h-auto whitespace-normal p-0"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink />Official website</a></Button> : <p className="mt-4 text-sm text-muted-foreground">Official website: {r.official_website ?? "Not provided"}</p>}
          </article>;
        })}</div>
        {catalog.data && !catalog.data.rows.length && <p className="mt-4 text-muted-foreground">No universities match these filters.</p>}
        <div className="mt-6 flex items-center justify-between gap-3"><Button variant="outline" disabled={filters.page === 0 || catalog.isFetching} onClick={() => setFilters(f => ({ ...f, page: f.page-1 }))}><ChevronLeft />Previous</Button><Button variant="outline" disabled={!catalog.data || (filters.page+1)*24 >= catalog.data.total || catalog.isFetching} onClick={() => setFilters(f => ({ ...f, page: f.page+1 }))}>Next<ChevronRight /></Button></div>
        <p className="mt-5 text-sm text-muted-foreground"><Link to="/assistant" className="text-primary hover:underline">AI Opportunity Assistant</Link> · <Link to="/recommended" className="text-primary hover:underline">Your saved chat recommendations</Link></p>
      </section>
    </WorkspaceShell>
  );
}
