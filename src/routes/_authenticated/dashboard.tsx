import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteLayout";
import { formatDeadline, OpportunityCard } from "@/components/site/OpportunityCard";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { useToggleSave, type SavedStatus } from "@/lib/saved";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your Dashboard — Opportunity Finder" },
      { name: "description", content: "Your saved opportunities and upcoming deadlines." },
      { property: "og:title", content: "Your Dashboard — Opportunity Finder" },
      { property: "og:description", content: "Track saved opportunities and deadlines." },
    ],
  }),
  component: Dashboard,
});

const statuses: SavedStatus[] = ["interested", "applying", "submitted"];

function Dashboard() {
  const { user } = useUser();
  const qc = useQueryClient();
  const toggle = useToggleSave(user?.id);
  const profile = useQuery({
    queryKey: ["profile"],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const saved = useQuery({
    queryKey: ["saved-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_opportunities")
        .select("id, status, opportunity:opportunities(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  async function setStatus(id: string, status: SavedStatus) {
    await supabase.from("saved_opportunities").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["saved-list"] });
  }

  const items = saved.data ?? [];
  const upcoming = items
    .filter((s) => s.opportunity?.deadline && s.opportunity.deadline >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.opportunity!.deadline!.localeCompare(b.opportunity!.deadline!));

  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h1 className="text-4xl font-semibold">Hi{profile.data?.display_name ? `, ${profile.data.display_name}` : ""}</h1>
        {profile.data && !profile.data.onboarded && (
          <p className="mt-4 rounded-xl bg-primary-soft p-4 text-sm text-accent-foreground">
            Finish your profile so we can suggest better opportunities. <Link to="/profile" className="font-medium underline">Set up profile</Link>
          </p>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          <Stat label="Saved" value={items.length} />
          <Stat label="Applying" value={items.filter((i) => i.status === "applying").length} />
          <Stat label="Submitted" value={items.filter((i) => i.status === "submitted").length} />
        </div>

        <h2 className="mt-14 text-2xl font-semibold">Upcoming deadlines</h2>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-muted-foreground">No upcoming deadlines among your saved opportunities.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-2xl border border-border">
            {upcoming.map((s) => (
              <li key={s.id} className="flex justify-between px-5 py-3 text-sm">
                <span>{s.opportunity!.title}</span>
                <span className="text-muted-foreground">{formatDeadline(s.opportunity!.deadline)}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-14 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Saved opportunities</h2>
          <Link to="/opportunities" className="text-sm text-primary hover:underline">Browse more</Link>
        </div>
        {saved.isLoading ? (
          <p className="mt-3 text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-3 text-muted-foreground">You haven't saved anything yet.</p>
        ) : (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => s.opportunity && (
              <OpportunityCard
                key={s.id}
                o={s.opportunity}
                action={
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Application progress"
                      value={s.status}
                      onChange={(e) => setStatus(s.id, e.target.value as SavedStatus)}
                      className="rounded-full border border-border bg-background px-2 py-1 text-xs capitalize"
                    >
                      {statuses.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                    <button onClick={() => toggle.mutate({ id: s.opportunity!.id, saved: true })} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>
    </SiteShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-semibold">{value}</p>
    </div>
  );
}
