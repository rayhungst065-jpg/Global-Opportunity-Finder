import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { useUser } from "@/lib/auth";
import { listCommunities, communityCategories } from "@/lib/communities.functions";
import { useMyMemberships } from "@/lib/communities";

export const Route = createFileRoute("/_authenticated/communities/")({
  head: () => ({
    meta: [
      { title: "Communities — Opportunity Finder" },
      { name: "description", content: "Find student groups based on shared interests, academic goals, and projects." },
      { property: "og:title", content: "Communities — Opportunity Finder" },
      { property: "og:description", content: "Discover and join student communities." },
    ],
  }),
  component: Communities,
});

const formatLabel: Record<string, string> = { online: "Online", in_person: "In person", hybrid: "Hybrid" };

function Communities() {
  const { user } = useUser();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const memberships = useMyMemberships(user?.id);

  const list = useQuery({
    queryKey: ["communities", q, category],
    queryFn: () => listCommunities({ data: { q: q || undefined, category: category || undefined } }),
  });

  const statusOf = (id: string) => memberships.data?.find((m) => m.community_id === id)?.status;

  return (
    <WorkspaceShell title="Communities" subtitle="Find groups of students who share your interests and goals — or start your own.">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search communities…"
          className="w-full max-w-sm rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Link to="/communities/new" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Start a community
        </Link>
        <Link to="/communities/my" className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-accent">
          My proposals
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["", ...communityCategories].map((c) => (
          <button
            key={c || "all"}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${category === c ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-accent"}`}
          >
            {c || "All"}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : list.isError ? (
          <p className="text-sm text-destructive">Couldn't load communities. Please refresh.</p>
        ) : list.data!.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <p className="font-medium">No communities yet{q || category ? " for this search" : ""}.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Approved groups appear here. Be the first — <Link to="/communities/new" className="text-primary hover:underline">propose a community</Link>.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.data!.map((c) => {
              const st = statusOf(c.id);
              return (
                <li key={c.id} className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-accent-foreground">{c.category}</span>
                    <span className="text-xs text-muted-foreground">{formatLabel[c.format] ?? c.format}</span>
                  </div>
                  <Link to="/communities/$id" params={{ id: c.id }} className="mt-3 font-display text-lg font-medium hover:underline">
                    {c.name}
                  </Link>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    {st === "approved" ? (
                      <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-medium text-teal">Joined</span>
                    ) : st === "pending" ? (
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">Request pending</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Open to join requests</span>
                    )}
                    <Link to="/communities/$id" params={{ id: c.id }} className="text-sm text-primary hover:underline">
                      View group →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </WorkspaceShell>
  );
}
