import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { formatDeadline } from "@/components/site/OpportunityCard";
import { useUser } from "@/lib/auth";
import { upcomingOf, useSavedList } from "@/lib/saved-list";

export const Route = createFileRoute("/_authenticated/deadlines")({
  head: () => ({
    meta: [
      { title: "Deadlines — Global Opportunity Finder" },
      { name: "description", content: "Upcoming deadlines for your saved opportunities." },
      { property: "og:title", content: "Deadlines — Global Opportunity Finder" },
      { property: "og:description", content: "Never miss an application deadline." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Deadlines,
});

function Deadlines() {
  const { user } = useUser();
  const saved = useSavedList(user?.id);
  const items = saved.data ?? [];
  const upcoming = upcomingOf(items);
  const noDate = items.filter((s) => s.opportunity && !s.opportunity.deadline);
  const day = (d: string) => Math.ceil((new Date(d + "T00:00:00").getTime() - Date.now()) / 86400000);
  return (
    <WorkspaceShell title="Deadlines" subtitle="From your saved opportunities. Always confirm dates on the official website.">
      {saved.isLoading ? <p className="text-muted-foreground">Loading…</p> : upcoming.length === 0 ? (
        <p className="text-muted-foreground">No upcoming deadlines. <Link to="/opportunities" className="text-primary hover:underline">Find opportunities to save</Link></p>
      ) : (
        <ul className="divide-y divide-border rounded-3xl border border-border bg-card">
          {upcoming.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <Link to="/opportunities/$id" params={{ id: s.opportunity!.id }} className="font-medium hover:underline">{s.opportunity!.title}</Link>
              <span className="text-right text-sm text-muted-foreground">{formatDeadline(s.opportunity!.deadline)}<br />{day(s.opportunity!.deadline!)} days left</span>
            </li>
          ))}
        </ul>
      )}
      {noDate.length > 0 && <p className="mt-6 text-sm text-muted-foreground">{noDate.length} saved {noDate.length === 1 ? "opportunity has" : "opportunities have"} no deadline listed.</p>}
    </WorkspaceShell>
  );
}
