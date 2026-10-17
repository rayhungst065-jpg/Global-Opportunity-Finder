import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";
import { useUser } from "@/lib/auth";
import { getCommunity } from "@/lib/communities.functions";
import { useJoinRequests, useMemberCount, useMembershipActions, useMyMemberships } from "@/lib/communities";

export const Route = createFileRoute("/_authenticated/communities/$id")({
  head: () => ({
    meta: [
      { title: "Community — Global Opportunity Finder" },
      { name: "description", content: "Community goals, activities, rules, and membership." },
    ],
  }),
  component: CommunityPage,
});

const formatLabel: Record<string, string> = { online: "Online", in_person: "In person", hybrid: "Hybrid" };

function CommunityPage() {
  const { id } = Route.useParams();
  const { user } = useUser();
  const community = useQuery({ queryKey: ["community", id], queryFn: () => getCommunity({ data: { id } }) });
  const memberships = useMyMemberships(user?.id);
  const count = useMemberCount(id);
  const actions = useMembershipActions(user?.id);

  const c = community.data;
  const isCreator = !!user && !!c && c.created_by === user.id;
  const requests = useJoinRequests(id, isCreator);
  const mine = memberships.data?.find((m) => m.community_id === id);

  if (community.isLoading) return <WorkspaceShell title="Community"><p className="text-sm text-muted-foreground">Loading…</p></WorkspaceShell>;
  if (community.isError || !c)
    return (
      <WorkspaceShell title="Community not found">
        <p className="text-sm text-muted-foreground">This group doesn't exist or was removed. <Link to="/communities" className="text-primary hover:underline">Back to communities</Link></p>
      </WorkspaceShell>
    );

  const busy = actions.join.isPending || actions.leave.isPending;

  return (
    <WorkspaceShell title={c.name} subtitle={c.category}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-accent-foreground">{formatLabel[c.format] ?? c.format}</span>
        {c.meeting_frequency && <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">{c.meeting_frequency}</span>}
        {count.data !== undefined && <span className="text-xs text-muted-foreground">{count.data} approved member{count.data === 1 ? "" : "s"}</span>}
        <div className="ml-auto">
          {mine?.status === "approved" ? (
            <button onClick={() => actions.leave.mutate(mine.id)} disabled={busy} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50">
              Leave group
            </button>
          ) : mine?.status === "pending" ? (
            <button onClick={() => actions.leave.mutate(mine.id)} disabled={busy} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50">
              Cancel join request
            </button>
          ) : (
            <button onClick={() => actions.join.mutate(id)} disabled={busy} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              Request to join
            </button>
          )}
        </div>
      </div>
      {mine?.status === "pending" && <p className="mt-3 text-sm text-muted-foreground">Your join request is waiting for the group creator's approval.</p>}
      {(actions.join.isError || actions.leave.isError) && <p className="mt-3 text-sm text-destructive">Something went wrong. Please try again.</p>}

      <div className="mt-8 space-y-6">
        <Panel title="About this group"><p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{c.description}</p></Panel>
        {c.purpose && <Panel title="Purpose"><p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{c.purpose}</p></Panel>}
        {c.goals && <Panel title="Goals"><p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{c.goals}</p></Panel>}
        {c.activities && <Panel title="Activities"><p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{c.activities}</p></Panel>}
        {c.rules && <Panel title="Community rules"><p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{c.rules}</p></Panel>}

        {isCreator && (
          <Panel title="Join requests">
            {requests.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (requests.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests.</p>
            ) : (
              <ul className="divide-y divide-border">
                {requests.data!.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="text-muted-foreground">Request from a student · {new Date(r.created_at).toLocaleDateString()}</span>
                    <span className="flex gap-2">
                      <button onClick={() => actions.approve.mutate(r.id)} disabled={actions.approve.isPending} className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">Approve</button>
                      <button onClick={() => actions.leave.mutate(r.id)} disabled={actions.leave.isPending} className="rounded-full border border-border px-4 py-1.5 text-xs hover:bg-accent disabled:opacity-50">Decline</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">You created this group, so you approve who joins.</p>
          </Panel>
        )}
      </div>
    </WorkspaceShell>
  );
}
