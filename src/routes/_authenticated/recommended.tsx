import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { OpportunityCard, SaveButton } from "@/components/site/OpportunityCard";
import { useUser } from "@/lib/auth";
import { recommend, useAllOpportunities, useProfile } from "@/lib/profile";
import { useSavedIds, useToggleSave } from "@/lib/saved";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { onlineRecommendations } from "@/lib/recommendations.functions";

export const Route = createFileRoute("/_authenticated/recommended")({
  head: () => ({
    meta: [
      { title: "Recommended for Me — Global Opportunity Finder" },
      { name: "description", content: "Opportunities matched to your profile and interests." },
      { property: "og:title", content: "Recommended for Me — Global Opportunity Finder" },
      { property: "og:description", content: "Personal opportunity suggestions." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const findOnline = useServerFn(onlineRecommendations);
  const [showDemo, setShowDemo] = useState(false);
  const online = useQuery({ queryKey: ["online-recommendations", user?.id, profile.data?.updated_at], queryFn: () => findOnline(), enabled: false, staleTime: Infinity, retry: false, refetchOnWindowFocus: false });
  const stored = recommend(profile.data, all.data ?? [], showDemo);
  const recs = showDemo ? stored.filter(r => r.o.is_demo) : online.data?.length ? online.data : stored;
  return (
    <WorkspaceShell title="Recommended for Me" subtitle="Official-source opportunities matched to your interests, major, education and region. Always confirm eligibility and dates with the organizer.">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground"><Checkbox checked={showDemo} onCheckedChange={v => setShowDemo(v === true)} />Demo records (testing only)</label>
        <Button variant="outline" disabled={online.isFetching || !profile.data || showDemo} onClick={() => void online.refetch()}><RefreshCw className={online.isFetching ? "animate-spin" : ""} />Search online (uses credits)</Button>
      </div>
      {online.error && !showDemo && <p role="alert" className="mb-4 text-sm text-destructive">{online.error.message}</p>}
      {(profile.error || all.error) && <p role="alert" className="mb-4 text-sm text-destructive">{profile.error?.message ?? all.error?.message}</p>}
      {online.isFetching && <p role="status" className="mb-4 text-muted-foreground">Searching official sources and checking opportunity details…</p>}
      {all.isLoading || profile.isLoading ? <p role="status" className="text-muted-foreground">Loading saved catalog matches…</p> : recs.length === 0 ? (
        <p className="text-muted-foreground">No matches yet. <Link to="/profile" className="text-primary hover:underline">Update your profile</Link> or <Link to="/opportunities" className="text-primary hover:underline">browse everything</Link>.</p>
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
