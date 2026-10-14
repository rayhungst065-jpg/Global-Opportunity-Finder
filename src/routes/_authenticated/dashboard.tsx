import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";
import { categoryName, formatDeadline } from "@/components/site/OpportunityCard";
import { useUser } from "@/lib/auth";
import { profileCompletion, recommend, useAllOpportunities, useProfile } from "@/lib/profile";
import { upcomingOf, useSavedList } from "@/lib/saved-list";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Opportunity Finder" },
      { name: "description", content: "Your recommendations, saved opportunities and upcoming deadlines." },
      { property: "og:title", content: "My Dashboard — Opportunity Finder" },
      { property: "og:description", content: "Your personal opportunity workspace." },
    ],
  }),
  component: Dashboard,
});

const btn = "inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90";
const more = "text-sm text-primary hover:underline";

function Dashboard() {
  const { user } = useUser();
  const profile = useProfile(user?.id);
  const all = useAllOpportunities();
  const saved = useSavedList(user?.id);
  const p = profile.data;
  const pct = profileCompletion(p);
  const recs = recommend(p, all.data ?? []).slice(0, 3);
  const items = saved.data ?? [];
  const upcoming = upcomingOf(items).slice(0, 5);

  return (
    <WorkspaceShell title={`Welcome${p?.first_name ? `, ${p.first_name}` : ""}`} subtitle="Here's what's happening with your opportunities.">
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Profile completion" action={<Link to="/profile" className={more}>Edit</Link>}>
          <p className="text-4xl font-semibold">{pct}%</p>
          <div className="mt-3 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
          {pct < 100 && <p className="mt-3 text-sm text-muted-foreground">A fuller profile means better suggestions.</p>}
        </Panel>

        <div className="lg:col-span-2">
          <Panel title="Your interests & preferences" action={<Link to="/profile" className={more}>Update</Link>}>
            {p && (p.interests.length || p.preferred_categories.length || p.intended_major) ? (
              <div className="flex flex-wrap gap-2 text-sm">
                {p.intended_major && <Tag>{p.intended_major}</Tag>}
                {p.preferred_categories.map((c) => <Tag key={c} strong>{categoryName(c)}</Tag>)}
                {p.interests.map((i) => <Tag key={i}>{i}</Tag>)}
                <Tag>{p.format_preference === "in_person" ? "In person" : p.format_preference === "online" ? "Online" : "Online or in person"}</Tag>
                {p.preferred_regions.map((r) => <Tag key={r}>{r}</Tag>)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">You haven't added interests yet. <Link to="/onboarding" className="text-primary hover:underline">Answer a few questions</Link></p>
            )}
          </Panel>
        </div>
      </div>

      <div className="mt-6">
        <Panel title="Recommended for you" action={<Link to="/recommended" className={more}>See all</Link>}>
          {recs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet. Add categories or interests to your profile, or browse all opportunities.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-3">
              {recs.map(({ o, reasons }) => (
                <li key={o.id} className="rounded-2xl border border-border p-4">
                  <p className="text-xs text-primary">{categoryName(o.category)}{o.is_demo && <span className="ml-2 text-destructive">Demo data</span>}</p>
                  <Link to="/opportunities/$id" params={{ id: o.id }} className="mt-1 block font-medium hover:underline">{o.title}</Link>
                  <p className="mt-2 text-xs text-muted-foreground">{reasons.join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recently saved" action={<Link to="/saved" className={more}>View all</Link>}>
          {items.length === 0 ? <p className="text-sm text-muted-foreground">Nothing saved yet.</p> : (
            <ul className="divide-y divide-border">
              {items.slice(0, 4).map((s) => s.opportunity && (
                <li key={s.id} className="flex justify-between gap-4 py-3 text-sm">
                  <Link to="/opportunities/$id" params={{ id: s.opportunity.id }} className="hover:underline">{s.opportunity.title}</Link>
                  <span className="capitalize text-muted-foreground">{s.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Upcoming deadlines" action={<Link to="/deadlines" className={more}>View all</Link>}>
          {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming deadlines among your saved opportunities.</p> : (
            <ul className="divide-y divide-border">
              {upcoming.map((s) => (
                <li key={s.id} className="flex justify-between gap-4 py-3 text-sm">
                  <span>{s.opportunity!.title}</span>
                  <span className="text-muted-foreground">{formatDeadline(s.opportunity!.deadline)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-10 rounded-3xl bg-primary-soft p-8 text-center">
        <p className="text-lg font-medium text-accent-foreground">Ready to find something new?</p>
        <Link to="/opportunities" className={`${btn} mt-4`}>Discover more opportunities</Link>
      </div>
    </WorkspaceShell>
  );
}

function Tag({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <span className={`rounded-full px-3 py-1 ${strong ? "bg-primary-soft text-accent-foreground" : "border border-border text-muted-foreground"}`}>{children}</span>;
}
