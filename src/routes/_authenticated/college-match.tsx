import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { searchColleges } from "@/lib/colleges.functions";
import { safeOfficialUrl } from "@/lib/opportunity-source";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";

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

const input = "mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none transition focus:border-ring focus:ring-4 focus:ring-primary-soft";

function CollegeMatch() {
  const [filters, setFilters] = useState({ query: "", region: "", country: "", type: "", sort: "name" as "name" | "rank" | "country" | "enrollment", page: 0 });
  const searchFn = useServerFn(searchColleges);
  const catalog = useQuery({ queryKey: ["college-catalog", filters], queryFn: () => searchFn({ data: filters }), retry: false });
  const changeFilter = (key: "region" | "country" | "type", value: string) => setFilters(f => ({ ...f, [key]: value, page: 0 }));

  return (
    <WorkspaceShell title="College Search" subtitle="Universities from your saved spreadsheet. Figures may be approximate or out of date; confirm details with each institution.">
      <div className="space-y-6">
          <Panel title="Search universities">
            <div className="mt-4 space-y-4">
              {([['region', 'Region', catalog.data?.regions], ['country', 'Country', catalog.data?.countries], ['type', 'Institution type', catalog.data?.types]] as const).map(([key,label,values]) => <label key={key} className="block text-sm font-medium">{label}<select aria-label={label} className={input} value={filters[key]} onChange={e => changeFilter(key,e.target.value)}><option value="">All</option>{values?.map(v => <option key={v} value={v}>{v}</option>)}</select></label>)}
              <label className="block text-sm font-medium">Sort by<select aria-label="Sort by" className={input} value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value as typeof f.sort, page: 0 }))}><option value="name">University name</option><option value="rank">QS Ranking (Lowest Number First)</option><option value="country">Country</option><option value="enrollment">Enrollment (largest first)</option></select></label>
              <Button variant="ghost" onClick={() => setFilters({ query: "", region: "", country: "", type: "", sort: "name", page: 0 })}>Clear filters</Button>
            </div>
          </Panel>
          <div className="border-l-2 border-coral pl-4 text-sm text-muted-foreground"><GraduationCap className="mb-2 h-6 w-6" />Data Notice: This information is based on online sources available in 2026 and may be incomplete or outdated. Please visit each university’s official website to verify the latest details.</div>
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
