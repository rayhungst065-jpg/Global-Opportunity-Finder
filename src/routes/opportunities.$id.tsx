import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { SiteShell } from "@/components/site/SiteLayout";
import { categoryName, formatDeadline, SaveButton } from "@/components/site/OpportunityCard";
import { getOpportunity } from "@/lib/opportunities.functions";
import { useUser } from "@/lib/auth";
import { statusLabel, useSavedIds, useToggleSave } from "@/lib/saved";

export const Route = createFileRoute("/opportunities/$id")({
  loader: async ({ params }) => {
    const o = await getOpportunity({ data: { id: params.id } }).catch(() => null);
    if (!o) throw notFound();
    return o;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Opportunity"} — Opportunity Finder` },
      { name: "description", content: loaderData?.description?.slice(0, 150) ?? "Student opportunity details." },
      { property: "og:title", content: loaderData?.title ?? "Opportunity" },
      { property: "og:description", content: loaderData?.description?.slice(0, 150) ?? "Student opportunity details." },
    ],
  }),
  notFoundComponent: () => (
    <SiteShell><p className="mx-auto max-w-3xl px-5 py-24">This opportunity wasn't found. <Link to="/opportunities" className="text-primary hover:underline">Browse all</Link></p></SiteShell>
  ),
  component: Detail,
});

function Detail() {
  const o = Route.useLoaderData();
  const { user } = useUser();
  const saved = useSavedIds(user?.id);
  const toggle = useToggleSave(user?.id);
  const [msg, setMsg] = useState("");
  const isSaved = saved.data?.has(o.id) ?? false;

  return (
    <SiteShell>
      <article className="mx-auto max-w-3xl px-5 py-20">
        <Link to="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">← All opportunities</Link>
        {o.is_demo && (
          <p className="mt-6 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">Demo data — this is a sample listing for testing, not a real opportunity.</p>
        )}
        <p className="mt-6 text-sm font-medium text-primary">{categoryName(o.category)} · {statusLabel[o.application_status]}</p>
        <h1 className="mt-2 text-4xl font-semibold">{o.title}</h1>
        <p className="mt-2 text-muted-foreground">{o.organizer} · {o.location}</p>
        <dl className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div><dt className="font-medium">Deadline</dt><dd className="text-muted-foreground">{formatDeadline(o.deadline)}</dd></div>
          <div><dt className="font-medium">Eligibility</dt><dd className="text-muted-foreground">{o.eligibility || "Not listed"}</dd></div>
        </dl>
        <p className="mt-8 leading-relaxed text-muted-foreground">{o.description}</p>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <SaveButton
            saved={isSaved}
            disabled={toggle.isPending}
            onClick={() => {
              if (!user) return setMsg("Log in or create an account to save opportunities.");
              toggle.mutate({ id: o.id, saved: isSaved }, { onError: (e) => setMsg(e.message) });
            }}
          />
          {o.official_url ? (
            <a href={o.official_url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Official website ↗</a>
          ) : (
            <span className="text-sm text-muted-foreground">No official link listed</span>
          )}
        </div>
        {msg && <p className="mt-4 text-sm text-destructive">{msg}</p>}
      </article>
    </SiteShell>
  );
}
