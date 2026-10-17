import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteLayout";
import { OpportunityCard, SaveButton } from "@/components/site/OpportunityCard";
import { listOpportunities } from "@/lib/opportunities.functions";
import { categories } from "@/lib/categories";
import { useUser } from "@/lib/auth";
import { useSavedIds, useToggleSave } from "@/lib/saved";

const search = z.object({
  q: z.string().optional(),
  category: z.enum(["volunteer", "competitions", "research", "awards"]).optional(),
});
type Search = z.infer<typeof search>;

const listQuery = (s: Search) =>
  queryOptions({ queryKey: ["opportunities", s.q ?? "", s.category ?? ""], queryFn: () => listOpportunities({ data: s }) });

export const Route = createFileRoute("/opportunities/")({
  validateSearch: search,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(listQuery(deps)),
  head: () => ({
    meta: [
      { title: "Browse Opportunities — Global Opportunity Finder" },
      { name: "description", content: "Search volunteer programs, competitions, research and scholarships for students." },
      { property: "og:title", content: "Browse Opportunities — Global Opportunity Finder" },
      { property: "og:description", content: "Search and save student opportunities by category." },
    ],
  }),
  component: Opportunities,
});

function Opportunities() {
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/opportunities/" });
  const { data } = useSuspenseQuery(listQuery(s));
  const { user } = useUser();
  const saved = useSavedIds(user?.id);
  const toggle = useToggleSave(user?.id);
  const [q, setQ] = useState(s.q ?? "");
  const [msg, setMsg] = useState("");

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-4xl font-semibold md:text-5xl">Browse opportunities</h1>
        <p className="mt-3 text-muted-foreground">Always confirm details and deadlines on the organizer's official website.</p>

        <form
          className="mt-8 flex flex-col gap-3 md:flex-row"
          onSubmit={(e) => { e.preventDefault(); navigate({ search: (p) => ({ ...p, q: q.trim() || undefined }) }); }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title, organizer or keyword"
            aria-label="Search opportunities"
            className="flex-1 rounded-full border border-input bg-background px-5 py-3 outline-none focus:border-ring focus:ring-4 focus:ring-primary-soft"
          />
          <button className="rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:opacity-90">Search</button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {[{ key: undefined, name: "All" }, ...categories].map((c) => (
            <button
              key={c.name}
              onClick={() => navigate({ search: (p) => ({ ...p, category: c.key as Search["category"] }) })}
              className={`rounded-full px-4 py-1.5 text-sm ${s.category === c.key ? "bg-foreground text-background" : "border border-border hover:bg-accent"}`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {msg && <p className="mt-4 text-sm text-destructive">{msg}</p>}

        {data.length === 0 ? (
          <p className="mt-12 text-muted-foreground">No opportunities match your search yet.</p>
        ) : (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {data.map((o) => {
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
      </section>
    </SiteShell>
  );
}
