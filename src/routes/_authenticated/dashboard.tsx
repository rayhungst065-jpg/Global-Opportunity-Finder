import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";
import { Avatar } from "@/components/site/Avatar";
import { categoryName, formatDeadline, SaveButton } from "@/components/site/OpportunityCard";
import { useUser } from "@/lib/auth";
import { profileCompletion, recommend, useAllOpportunities, useProfile } from "@/lib/profile";
import { upcomingOf, useSavedList } from "@/lib/saved-list";
import { useSavedIds, useToggleSave } from "@/lib/saved";

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
const ghost = "inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-accent";
const more = "text-sm text-primary hover:underline";

function Dashboard() {
  const { user } = useUser();
  const profile = useProfile(user?.id);
  const all = useAllOpportunities();
  const saved = useSavedList(user?.id);
  const savedIds = useSavedIds(user?.id);
  const toggle = useToggleSave(user?.id);
  const p = profile.data;
  const pct = profileCompletion(p);
  const recs = recommend(p, all.data ?? []).slice(0, 3);
  const items = saved.data ?? [];
  const upcoming = upcomingOf(items).slice(0, 5);
  const name = p?.display_name || p?.first_name;
  const tags = p ? [...p.interests, ...p.goals] : [];

  return (
    <WorkspaceShell title={`Welcome${name ? `, ${name}` : ""}`} subtitle="Discover new opportunities and keep track of what matters to you.">
      {profile.isError && <p className="mb-6 text-sm text-destructive">Couldn't load your profile. Please refresh.</p>}

      <section className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-wrap items-center gap-6">
          <Avatar path={p?.avatar_path} name={name ?? user?.email} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">Profile completion</p>
            <p className="text-3xl font-semibold">{pct}%</p>
            <div className="mt-2 h-2 max-w-sm rounded-full bg-muted"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
            {pct < 100 && <p className="mt-2 text-sm text-muted-foreground">Add a picture, bio and goals for better suggestions.</p>}
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/profile" className={ghost}>Edit profile</Link>
          <Link to="/opportunities" className={ghost}>Explore opportunities</Link>
          <span className={`${ghost} cursor-not-allowed opacity-60`} title="Coming in the next stage">Communities · coming soon</span>
          <span className={`${ghost} cursor-not-allowed opacity-60`} title="Coming in a later stage">Meet students · coming soon</span>
        </div>
      </section>

      <div className="mt-6">
        <Panel title="My interests & goals" action={<Link to="/profile" className={more}>Edit</Link>}>
          {tags.length || p?.intended_major ? (
            <div className="flex flex-wrap gap-2 text-sm">
              {p?.intended_major && <Tag strong>{p.intended_major}</Tag>}
              {p?.interests.map((i) => <Tag key={i} strong>{i}</Tag>)}
              {p?.goals.map((g) => <Tag key={g}>{g}</Tag>)}
              {p?.preferred_categories.map((c) => <Tag key={c}>{categoryName(c)}</Tag>)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No interests yet. <Link to="/profile" className="text-primary hover:underline">Add some</Link> to get suggestions.</p>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Recommended for you" action={<Link to="/recommended" className={more}>See all</Link>}>
          {all.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : all.isError ? <p className="text-sm text-destructive">Couldn't load opportunities.</p> : recs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet. Add categories or interests to your profile, or <Link to="/opportunities" className="text-primary hover:underline">browse all opportunities</Link>.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-3">
              {recs.map(({ o, reasons }) => {
                const isSaved = savedIds.data?.has(o.id) ?? false;
                return (
                  <li key={o.id} className="flex flex-col rounded-2xl border border-border p-4">
                    <p className="text-xs text-primary">{categoryName(o.category)}{o.is_demo && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">Demo data · not real</span>}</p>
                    <Link to="/opportunities/$id" params={{ id: o.id }} className="mt-1 font-medium hover:underline">{o.title}</Link>
                    <p className="text-xs text-muted-foreground">{o.organizer}</p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
                    {o.eligibility && <p className="mt-1 text-xs text-muted-foreground">Eligibility: {o.eligibility}</p>}
                    <p className="mt-1 text-xs">{formatDeadline(o.deadline)}</p>
                    <p className="mt-2 text-xs text-primary">{reasons.join(" · ")}</p>
                    <div className="mt-auto flex items-center gap-3 pt-3">
                      <SaveButton saved={isSaved} disabled={toggle.isPending} onClick={() => toggle.mutate({ id: o.id, saved: isSaved })} />
                      {o.official_url && <a href={o.official_url} target="_blank" rel="noopener noreferrer" className={more}>Official site ↗</a>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Recently saved" action={<Link to="/saved" className={more}>View all</Link>}>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground"><p>Nothing saved yet.</p><Link to="/opportunities" className={`${btn} mt-3`}>Explore opportunities</Link></div>
          ) : (
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
                  <Link to="/opportunities/$id" params={{ id: s.opportunity!.id }} className="hover:underline">{s.opportunity!.title}</Link>
                  <span className="text-muted-foreground">{formatDeadline(s.opportunity!.deadline)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Suggested communities"><p className="text-sm text-muted-foreground">Communities open in the next stage. Nothing to show yet.</p></Panel>
        <Panel title="Global connections"><p className="text-sm text-muted-foreground">{p?.discoverable ? "You're opted in to discovery. Student matching opens in a later stage." : "Student discovery is off. You can turn it on in your profile's privacy settings."}</p></Panel>
        <Panel title="Upcoming events"><p className="text-sm text-muted-foreground">No events scheduled.</p></Panel>
      </div>
    </WorkspaceShell>
  );
}

function Tag({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <span className={`rounded-full px-3 py-1 ${strong ? "bg-primary-soft text-accent-foreground" : "border border-border text-muted-foreground"}`}>{children}</span>;
}
