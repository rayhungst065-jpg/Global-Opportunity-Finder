import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { OpportunityCard } from "@/components/site/OpportunityCard";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { useToggleSave, type SavedStatus } from "@/lib/saved";
import { useSavedList } from "@/lib/saved-list";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved Opportunities — Global Opportunity Finder" },
      { name: "description", content: "Opportunities you saved, with your application progress." },
      { property: "og:title", content: "Saved Opportunities — Global Opportunity Finder" },
      { property: "og:description", content: "Track your saved opportunities." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Saved,
});

const statuses: SavedStatus[] = ["interested", "applying", "submitted"];

function Saved() {
  const { user } = useUser();
  const qc = useQueryClient();
  const saved = useSavedList(user?.id);
  const toggle = useToggleSave(user?.id);
  async function setStatus(id: string, status: SavedStatus) {
    if (!user) return;
    await supabase.from("saved_opportunities").update({ status }).eq("id", id).eq("user_id", user.id);
    qc.invalidateQueries({ queryKey: ["saved-list"] });
  }
  const items = saved.data ?? [];
  return (
    <WorkspaceShell title="Saved Opportunities" subtitle="Track where you are with each one.">
      {saved.isLoading ? <p className="text-muted-foreground">Loading…</p> : items.length === 0 ? (
        <p className="text-muted-foreground">You haven't saved anything yet. <Link to="/opportunities" className="text-primary hover:underline">Explore opportunities</Link></p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {items.map((s) => s.opportunity && (
            <OpportunityCard key={s.id} o={s.opportunity} action={
              <div className="flex items-center gap-2">
                <select aria-label="Application progress" value={s.status} onChange={(e) => setStatus(s.id, e.target.value as SavedStatus)} className="rounded-full border border-border bg-background px-2 py-1 text-xs capitalize">
                  {statuses.map((st) => <option key={st} value={st}>{st}</option>)}
                </select>
                <button onClick={() => toggle.mutate({ id: s.opportunity!.id, saved: true })} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
              </div>
            } />
          ))}
        </div>
      )}
    </WorkspaceShell>
  );
}
