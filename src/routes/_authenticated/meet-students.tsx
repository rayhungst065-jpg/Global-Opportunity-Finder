import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Trash2, MessageSquare, Plus } from "lucide-react";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";
import { Avatar } from "@/components/site/Avatar";
import { useUser } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import {
  listMyConnections, respondRequest, removeConnection,
  type StudentCard, type ConnectionRow,
} from "@/lib/connections.functions";
import { listMyGroups, createGroup, inviteToGroup, updateMembership } from "@/lib/groups.functions";

export const Route = createFileRoute("/_authenticated/meet-students")({
  head: () => ({
    meta: [
      { title: "Meet Students — Global Opportunity Finder" },
      { name: "description", content: "Your connections, messages, and private collaboration groups." },
    ],
  }),
  component: MeetStudents,
});

const chip = "rounded-full bg-primary-soft px-2.5 py-0.5 text-xs text-accent-foreground";
const input = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-primary-soft";
const smallBtn = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition";

function StudentCardView({ s, action }: { s: StudentCard; action?: React.ReactNode }) {
  return (
    <li className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <Avatar path={s.avatar_path} name={s.display_name} size="sm" />
        <div className="min-w-0">
          <p className="truncate font-medium">{s.display_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {[s.education_level, s.intended_major, s.country_region].filter(Boolean).join(" · ") || "Student"}
          </p>
        </div>
      </div>
      {s.bio && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{s.bio}</p>}
      {(s.interests.length > 0 || s.goals.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {s.interests.slice(0, 4).map((i) => <span key={i} className={chip}>{i}</span>)}
          {s.goals.slice(0, 2).map((g) => <span key={g} className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs text-teal">{g}</span>)}
        </div>
      )}
      {action && <div className="mt-auto pt-4">{action}</div>}
    </li>
  );
}

function MeetStudents() {
  const { user } = useUser();
  const profile = useProfile(user?.id).data;
  const [tab, setTab] = useState<"messages" | "friends" | "groups">("friends");

  const connections = useQuery({
    queryKey: ["my-connections"],
    queryFn: () => listMyConnections({}),
    enabled: !!user,
  });
  const rows: ConnectionRow[] = connections.data ?? [];
  const incoming = rows.filter((r) => !r.outgoing && r.status === "pending");

  const tabs = [
    { key: "messages", label: "Messages" },
    { key: "friends", label: `Friends${incoming.length ? ` (${incoming.length})` : ""}` },
    { key: "groups", label: "Groups" },
  ] as const;

  return (
    <WorkspaceShell title="Meet Students" subtitle="Your direct connections and private collaboration groups.">
      {!profile?.discoverable && (
        <p className="mb-5 rounded-xl bg-coral-soft p-3 text-sm text-coral">
          You're not discoverable yet, so other students can't find or request you.{" "}
          <Link to="/settings" className="font-medium underline">Turn on discovery in Settings</Link>.
        </p>
      )}

      <div className="mb-6 flex gap-1 rounded-full border border-border bg-card p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-4 py-2 text-sm transition ${tab === t.key ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "messages" && <MessagesTab />}
      {tab === "friends" && <FriendsTab userId={user?.id} rows={rows} />}
      {tab === "groups" && <GroupsTab userId={user?.id} connections={rows} />}
    </WorkspaceShell>
  );
}

/* ---------------- Messages (honest placeholder) ---------------- */

function MessagesTab() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
      <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
      <h2 className="mt-4 font-display text-xl font-semibold">Messaging isn't available yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Direct messages are still in development. They'll launch together with blocking and reporting controls,
        so conversations stay safe. For now, use connection requests and collaboration groups to reach out.
      </p>
    </div>
  );
}

/* ---------------- Friends ---------------- */

function FriendsTab({ userId, rows }: { userId: string | undefined; rows: ConnectionRow[] }) {
  const qc = useQueryClient();
  const [notice, setNotice] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-connections"] });
  const onErr = (e: unknown) => setNotice(e instanceof Error ? e.message : "Something went wrong.");

  const respond = useMutation({ mutationFn: (v: { id: string; accept: boolean }) => respondRequest({ data: v }), onSuccess: () => { setNotice(""); refresh(); }, onError: onErr });
  const remove = useMutation({ mutationFn: (id: string) => removeConnection({ data: { id } }), onSuccess: () => { setNotice(""); refresh(); }, onError: onErr });

  const incoming = rows.filter((r) => !r.outgoing && r.status === "pending");
  const outgoing = rows.filter((r) => r.outgoing && r.status === "pending");
  const accepted = rows.filter((r) => r.status === "accepted");

  return (
    <>
      {notice && <p className="mb-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{notice}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Incoming requests (${incoming.length})`}>
          {incoming.length === 0 ? <p className="text-sm text-muted-foreground">No incoming requests.</p> : (
            <ul className="space-y-3">
              {incoming.map((r) => r.other && (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Avatar path={r.other.avatar_path} name={r.other.display_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.other.display_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{r.other.intended_major ?? "Student"}</p>
                  </div>
                  <button disabled={respond.isPending} onClick={() => respond.mutate({ id: r.id, accept: true })} className={`${smallBtn} bg-primary text-primary-foreground`}><Check className="h-3.5 w-3.5" /> Accept</button>
                  <button disabled={respond.isPending} onClick={() => respond.mutate({ id: r.id, accept: false })} className={`${smallBtn} border border-border hover:bg-accent`}><X className="h-3.5 w-3.5" /> Decline</button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title={`Outgoing requests (${outgoing.length})`}>
          {outgoing.length === 0 ? <p className="text-sm text-muted-foreground">No outgoing requests.</p> : (
            <ul className="space-y-3">
              {outgoing.map((r) => r.other && (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Avatar path={r.other.avatar_path} name={r.other.display_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.other.display_name}</p>
                    <p className="text-xs text-muted-foreground">Waiting for a response</p>
                  </div>
                  <button disabled={remove.isPending} onClick={() => remove.mutate(r.id)} className={`${smallBtn} border border-border hover:bg-accent`}>Cancel</button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold">My friends ({accepted.length})</h2>
        {accepted.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No connections yet. Find students under{" "}
            <Link to="/communities" className="text-primary hover:underline">Communities → Discover Groups → Find Students</Link>.
          </p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accepted.map((r) => r.other && (
              <StudentCardView key={r.id} s={r.other} action={
                <button disabled={remove.isPending} onClick={() => remove.mutate(r.id)} className={`${smallBtn} border border-border text-muted-foreground hover:bg-accent`}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove connection
                </button>
              } />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

/* ---------------- Groups (private collaboration) ---------------- */

function GroupsTab({ userId, connections }: { userId: string | undefined; connections: ConnectionRow[] }) {
  const qc = useQueryClient();
  const [composing, setComposing] = useState(false);
  const [notice, setNotice] = useState("");
  const [invitePick, setInvitePick] = useState<Record<string, string>>({});

  const groups = useQuery({
    queryKey: ["my-groups"],
    queryFn: () => listMyGroups({}),
    enabled: !!userId,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-groups"] });
  const onErr = (e: unknown) => setNotice(e instanceof Error ? e.message : "Something went wrong.");

  const create = useMutation({
    mutationFn: (v: { name: string; description: string; goal: string }) => createGroup({ data: v }),
    onSuccess: () => { setNotice(""); setComposing(false); refresh(); },
    onError: onErr,
  });
  const invite = useMutation({
    mutationFn: (v: { group_id: string; user_id: string }) => inviteToGroup({ data: v }),
    onSuccess: () => { setNotice(""); refresh(); },
    onError: onErr,
  });
  const membership = useMutation({
    mutationFn: (v: { group_id: string; user_id: string; action: "accept" | "leave" | "remove" }) => updateMembership({ data: v }),
    onSuccess: () => { setNotice(""); refresh(); },
    onError: onErr,
  });

  const friends = connections.filter((r) => r.status === "accepted" && r.other);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Private spaces for competition teams, research projects, and shared goals. Groups never appear in the public community directory.
        </p>
        <button onClick={() => setComposing((v) => !v)} className={`${smallBtn} shrink-0 bg-primary px-4 py-2 text-primary-foreground hover:opacity-90`}>
          <Plus className="h-4 w-4" /> New group
        </button>
      </div>
      {notice && <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{notice}</p>}

      {composing && (
        <form
          className="mt-5 space-y-3 rounded-2xl border border-border bg-card p-5 shadow-soft"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            create.mutate({
              name: String(f.get("name") ?? ""),
              description: String(f.get("description") ?? ""),
              goal: String(f.get("goal") ?? ""),
            });
          }}
        >
          <input name="name" required minLength={3} maxLength={120} className={input} placeholder="Group name — e.g. Robotics Nationals Team" />
          <textarea name="description" maxLength={1000} rows={3} className={input} placeholder="What is this group for?" />
          <input name="goal" maxLength={300} className={input} placeholder="Shared goal (optional)" />
          <div className="flex gap-2">
            <button disabled={create.isPending} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {create.isPending ? "Creating…" : "Create group"}
            </button>
            <button type="button" onClick={() => setComposing(false)} className="rounded-full border border-border px-5 py-2 text-sm hover:bg-accent">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {groups.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
        : groups.isError ? <p className="text-sm text-destructive">Couldn't load groups. Please refresh.</p>
        : (groups.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No groups yet. Create one and invite students you're connected with.
          </p>
        ) : (
          <ul className="space-y-4">
            {(groups.data ?? []).map((g) => {
              const myMembership = g.members.find((m) => m.user_id === userId);
              const activeMembers = g.members.filter((m) => m.status === "active");
              const invited = g.members.filter((m) => m.status === "invited");
              const invitable = friends.filter((f) => !g.members.some((m) => m.user_id === (f.outgoing ? f.addressee_id : f.requester_id)));
              return (
                <li key={g.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-medium">{g.name}</h3>
                    {g.mine ? (
                      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-accent-foreground">Owner</span>
                    ) : myMembership?.status === "invited" ? (
                      <span className="rounded-full bg-coral-soft px-3 py-1 text-xs font-medium text-coral">Invited</span>
                    ) : (
                      <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-medium text-teal">Member</span>
                    )}
                  </div>
                  {g.description && <p className="mt-1.5 text-sm text-muted-foreground">{g.description}</p>}
                  {g.goal && <p className="mt-2 text-sm"><span className="font-medium">Goal:</span> {g.goal}</p>}

                  <div className="mt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Members ({activeMembers.length})</p>
                    <ul className="mt-2 space-y-2">
                      {g.members.map((m) => (
                        <li key={m.user_id} className="flex items-center gap-2.5 text-sm">
                          <Avatar path={m.profile?.avatar_path ?? null} name={m.profile?.display_name ?? "Student"} size="sm" />
                          <span className="min-w-0 flex-1 truncate">{m.profile?.display_name ?? "Student"}</span>
                          {m.role === "owner" && <span className="text-xs text-muted-foreground">Owner</span>}
                          {m.status === "invited" && <span className="text-xs text-coral">Invited</span>}
                          {m.user_id === userId && m.status === "invited" && (
                            <button onClick={() => membership.mutate({ group_id: g.id, user_id: m.user_id, action: "accept" })}
                              className={`${smallBtn} bg-primary text-primary-foreground`}>Accept invite</button>
                          )}
                          {g.mine && m.user_id !== userId && (
                            <button onClick={() => membership.mutate({ group_id: g.id, user_id: m.user_id, action: "remove" })}
                              className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {g.mine && (
                    <div className="mt-4 flex items-center gap-2">
                      <select
                        className="rounded-xl border border-input bg-background px-3 py-2 text-sm"
                        value={invitePick[g.id] ?? ""}
                        onChange={(e) => setInvitePick((p) => ({ ...p, [g.id]: e.target.value }))}
                      >
                        <option value="">Invite a connection…</option>
                        {invitable.map((f) => {
                          const oid = f.outgoing ? f.addressee_id : f.requester_id;
                          return <option key={oid} value={oid}>{f.other!.display_name}</option>;
                        })}
                      </select>
                      <button
                        disabled={!invitePick[g.id] || invite.isPending}
                        onClick={() => invite.mutate({ group_id: g.id, user_id: invitePick[g.id]! })}
                        className={`${smallBtn} bg-primary text-primary-foreground disabled:opacity-50`}
                      >
                        Invite
                      </button>
                    </div>
                  )}
                  {invited.length > 0 && g.mine && (
                    <p className="mt-2 text-xs text-muted-foreground">{invited.length} invitation{invited.length > 1 ? "s" : ""} pending.</p>
                  )}

                  {!g.mine && myMembership && (
                    <button onClick={() => membership.mutate({ group_id: g.id, user_id: userId!, action: "leave" })}
                      className="mt-4 text-xs text-muted-foreground hover:text-destructive">Leave group</button>
                  )}
                  <p className="mt-3 text-xs text-muted-foreground">Group messaging isn't available yet — coordinate via connection requests for now.</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
