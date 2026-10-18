import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Handshake, GraduationCap, ArrowRight, MessageCircle } from "lucide-react";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";
import { categoryName, formatDeadline, SaveButton } from "@/components/site/OpportunityCard";
import { useUser } from "@/lib/auth";
import { profileCompletion, recommend, useAllOpportunities, useProfile } from "@/lib/profile";
import { upcomingOf, useSavedList } from "@/lib/saved-list";
import { useSavedIds, useToggleSave } from "@/lib/saved";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Global Opportunity Finder" },
      { name: "description", content: "Your recommendations, saved opportunities and upcoming deadlines." },
      { property: "og:title", content: "My Dashboard — Global Opportunity Finder" },
      { property: "og:description", content: "Your personal opportunity workspace." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const more = "text-sm text-primary hover:underline";

const quickLinks = [
  { to: "/assistant", label: "Opportunity Assistant", desc: "Your opportunities and action plans", icon: MessageCircle, classes: "bg-primary-soft text-accent-foreground" },
  { to: "/communities", label: "Communities", desc: "Browse and join student groups", icon: Users, classes: "bg-primary-soft text-accent-foreground" },
  { to: "/meet-students", label: "Meet Students", desc: "Find teammates — in development", icon: Handshake, classes: "bg-teal-soft text-teal" },
  { to: "/college-match", label: "College Search", desc: "Explore the saved university database", icon: GraduationCap, classes: "bg-coral-soft text-coral" },
] as const;

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
  const upcoming = upcomingOf(items).slice(0, 4);
  const name = p?.display_name || p?.first_name;

  return (
    <WorkspaceShell title={`Welcome${name ? `, ${name}` : ""}`} subtitle="Your opportunities at a glance.">
      {profile.isError && <p className="mb-6 text-sm text-destructive">Couldn't load your profile. Please refresh.</p>}

      {/* Compact completion strip */}
      <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium">Profile completion</p>
            <p className="text-sm font-semibold text-primary">{pct}%</p>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted"><div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
        </div>
        {pct < 100 && <Link to="/profile" search={{ edit: true }} className="shrink-0 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-accent">Complete profile</Link>}
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Upcoming deadlines" action={<Link to="/deadlines" className={more}>View all</Link>}>
          {upcoming.length === 0 ? <p className="text-sm text-muted-foreground">No upcoming deadlines among your saved opportunities.</p> : (
            <ul className="divide-y divide-border">
              {upcoming.map((s) => (
                <li key={s.id} className="flex justify-between gap-4 py-2.5 text-sm">
                  <Link to="/opportunities/$id" params={{ id: s.opportunity!.id }} className="truncate hover:underline">{s.opportunity!.title}</Link>
                  <span className="shrink-0 text-muted-foreground">{formatDeadline(s.opportunity!.deadline)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recently saved" action={<Link to="/saved" className={more}>View all</Link>}>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing saved yet. <Link to="/opportunities" className="text-primary hover:underline">Explore opportunities</Link>.</p>
          ) : (
            <ul className="divide-y divide-border">
              {items.slice(0, 4).map((s) => s.opportunity && (
                <li key={s.id} className="flex justify-between gap-4 py-2.5 text-sm">
                  <Link to="/opportunities/$id" params={{ id: s.opportunity.id }} className="truncate hover:underline">{s.opportunity.title}</Link>
                  <span className="shrink-0 capitalize text-muted-foreground">{s.status}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-5">
        <Panel title="Recommended for you" action={<Link to="/recommended" className={more}>See all</Link>}>
          {all.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : all.isError ? <p className="text-sm text-destructive">Couldn't load opportunities.</p> : recs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet. Add categories or interests to your profile, or <Link to="/opportunities" className="text-primary hover:underline">browse all opportunities</Link>.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-3">
              {recs.map(({ o, reasons }) => {
                const isSaved = savedIds.data?.has(o.id) ?? false;
                return (
                  <li key={o.id} className="flex flex-col rounded-xl border border-border p-4">
                    <p className="text-xs text-primary">{categoryName(o.category)}{o.is_demo && <span className="ml-2 rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">Demo data · not real</span>}</p>
                    <Link to="/opportunities/$id" params={{ id: o.id }} className="mt-1 font-medium hover:underline">{o.title}</Link>
                    <p className="text-xs text-muted-foreground">{o.organizer}</p>
                    <p className="mt-1 text-xs">{formatDeadline(o.deadline)}</p>
                    <p className="mt-2 text-xs text-teal">{reasons.join(" · ")}</p>
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

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {quickLinks.map((q) => (
          <Link key={q.to} to={q.to} className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${q.classes}`}><q.icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{q.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{q.desc}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </WorkspaceShell>
  );
}
