import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { OpportunityCard, SaveButton } from "@/components/site/OpportunityCard";
import { listOpportunities } from "@/lib/opportunities.functions";
import { catalogCategories, catalogCategoryKeys } from "@/lib/opportunity-catalog";
import { useUser } from "@/lib/auth";
import { useSavedIds, useToggleSave } from "@/lib/saved";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { visibleCatalog } from "@/lib/opportunity-source";
import { markOpportunitiesExplored } from "@/lib/profile";

const search = z.object({
  q: z.string().optional(),
  category: z.enum(catalogCategoryKeys).optional(),
});
type Search = z.infer<typeof search>;

const listQuery = (s: Search) =>
  queryOptions({ queryKey: ["opportunities", s.q ?? "", s.category ?? ""], queryFn: () => listOpportunities({ data: s }) });

export const Route = createFileRoute("/_authenticated/opportunities/")({
  validateSearch: search,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(listQuery(deps)),
  head: () => ({
    meta: [
      { title: "Browse Opportunities — Global Opportunity Finder" },
      { name: "description", content: "Search student volunteer, competition, cultural exchange, research, leadership and education opportunities." },
      { property: "og:title", content: "Browse Opportunities — Global Opportunity Finder" },
      { property: "og:description", content: "Search and save student opportunities by category." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Opportunities,
});

function Opportunities() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/opportunities/" });
  const { data } = useSuspenseQuery(listQuery(s));
  const { user } = useUser();
  const qc = useQueryClient();
  useEffect(() => {
    if (!user) return;
    void markOpportunitiesExplored(user.id).then(() => qc.invalidateQueries({ queryKey: ["profile", user.id] })).catch(() => {
      // Visit tracking must not interrupt browsing or saving opportunities.
    });
  }, [user?.id, qc]);
  const saved = useSavedIds(user?.id);
  const toggle = useToggleSave(user?.id);
  const [q, setQ] = useState(s.q ?? "");
  useEffect(() => setQ(s.q ?? ""), [s.q]);
  const [msg, setMsg] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const listings = visibleCatalog(data, showDemo);

  return (
    <WorkspaceShell title="Explore Opportunities" subtitle="Always confirm details and deadlines on the organizer's official website.">
        <form
          className="flex flex-col gap-3 md:flex-row"
          onSubmit={(e) => { e.preventDefault(); navigate({ search: (p) => ({ ...p, q: q.trim() || undefined }) }); }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, organizer or keyword"
            aria-label="Search opportunities"
            className="min-w-0 flex-1 rounded-full border border-input bg-background px-5 py-3 outline-none focus:border-ring focus:ring-4 focus:ring-primary-soft"
          />
          <Button type="submit" className="h-auto rounded-full px-6 py-3">Search</Button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {[{ key: undefined, name: "All" }, ...catalogCategories].map((c) => (
            <Button
              key={c.name}
              aria-pressed={s.category === c.key}
              onClick={() => navigate({ search: (p) => ({ ...p, category: c.key as Search["category"] }) })}
              className={`rounded-full px-4 py-1.5 text-sm ${s.category === c.key ? "bg-foreground text-background" : "border border-border hover:bg-accent"}`}
            >
              {c.name}
            </Button>
          ))}
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><Checkbox checked={showDemo} onCheckedChange={value => setShowDemo(value === true)} />Include demo records (testing only)</label>

        {msg && <p className="mt-4 text-sm text-destructive">{msg}</p>}

        {listings.length === 0 ? (
          <p className="mt-12 text-muted-foreground">No opportunities match your search yet.</p>
        ) : (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {listings.map((o) => {
              const isSaved = saved.data?.has(o.id) ?? false;
              return (
                <OpportunityCard
                  key={o.id}
                  o={o}
                  action={
                    <SaveButton
                      saved={isSaved}
                      disabled={toggle.isPending}
                      onClick={() => {
                        if (!user) return setMsg("Log in or create an account to save opportunities.");
                        setMsg("");
                        toggle.mutate({ id: o.id, saved: isSaved }, { onError: (e) => setMsg(e.message) });
                      }}
                    />
                  }
                />
              );
            })}
          </div>
        )}
    </WorkspaceShell>
  );
}
