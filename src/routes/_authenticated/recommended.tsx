import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { OpportunityCard, SaveButton } from "@/components/site/OpportunityCard";
import { useUser } from "@/lib/auth";
import { recommend, useAllOpportunities, useProfile } from "@/lib/profile";
import { useSavedIds, useToggleSave } from "@/lib/saved";

export const Route = createFileRoute("/_authenticated/recommended")({
  head: () => ({
    meta: [
      { title: "Recommended for Me — Opportunity Finder" },
      { name: "description", content: "Opportunities matched to your profile and interests." },
      { property: "og:title", content: "Recommended for Me — Opportunity Finder" },
      { property: "og:description", content: "Personal opportunity suggestions." },
    ],
  }),
  component: Recommended,
});

function Recommended() {
  const { user } = useUser();
  const profile = useProfile(user?.id);
  const all = useAllOpportunities();
  const saved = useSavedIds(user?.id);
  const toggle = useToggleSave(user?.id);
  const recs = recommend(profile.data, all.data ?? []);
  return (
    <WorkspaceShell title="Recommended for Me" subtitle="Matched on the categories, interests and format in your profile. Closed listings are hidden.">
      {all.isLoading || profile.isLoading ? <p className="text-muted-foreground">Loading…</p> : recs.length === 0 ? (
        <p className="text-muted-foreground">No matches yet. <Link to="/profile" search={{ edit: false }} className="text-primary hover:underline">Update your profile</Link> or <Link to="/opportunities" className="text-primary hover:underline">browse everything</Link>.</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {recs.map(({ o, reasons }) => {
            const isSaved = saved.data?.has(o.id) ?? false;
            return (
              <div key={o.id}>
                <OpportunityCard o={o} action={<SaveButton saved={isSaved} disabled={toggle.isPending} onClick={() => toggle.mutate({ id: o.id, saved: isSaved })} />} />
                <p className="mt-2 px-2 text-xs text-muted-foreground">Why: {reasons.join(" · ")}</p>
              </div>
            );
          })}
        </div>
      )}
    </WorkspaceShell>
  );
}
