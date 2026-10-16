import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Check, X, Trash2 } from "lucide-react";
import { WorkspaceShell, Panel } from "@/components/site/WorkspaceShell";
import { Avatar } from "@/components/site/Avatar";
import { useUser } from "@/lib/auth";
import { useProfile } from "@/lib/profile";
import {
  discoverStudents, listMyConnections, sendRequest, respondRequest, removeConnection,
  type StudentCard, type ConnectionRow,
} from "@/lib/connections.functions";

export const Route = createFileRoute("/_authenticated/meet-students")({
  head: () => ({
    meta: [
      { title: "Meet Students — Opportunity Finder" },
      { name: "description", content: "Discover students in other countries who share your interests and goals." },
    ],
  }),
  component: MeetStudents,
});

const chip = "rounded-full bg-primary-soft px-2.5 py-0.5 text-xs text-accent-foreground";
const input = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-primary-soft";

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
  const qc = useQueryClient();
  const [tab, setTab] = useState<"discover" | "requests" | "connections">("discover");
  const [q, setQ] = useState("");
  const [major, setMajor] = useState("");
  const [interest, setInterest] = useState("");
  const [notice, setNotice] = useState("");

  const students = useQuery({
    queryKey: ["discover-students", q, major, interest],
    queryFn: () => discoverStudents({ data: { q: q || undefined, major: major || undefined, interest: interest || undefined } }),
    enabled: !!user,
  });
  const connections = useQuery({
    queryKey: ["my-connections"],
    queryFn: () => listMyConnections({}),
    enabled: !!user,
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-connections"] });
    qc.invalidateQueries({ queryKey: ["discover-students"] });
  };
  const onErr = (e: unknown) => setNotice(e instanceof Error ? e.message : "Something went wrong.");

  const send = useMutation({ mutationFn: (to: string) => sendRequest({ data: { to } }), onSuccess: () => { setNotice(""); refresh(); }, onError: onErr });
  const respond = useMutation({ mutationFn: (v: { id: string; accept: boolean }) => respondRequest({ data: v }), onSuccess: () => { setNotice(""); refresh(); }, onError: onErr });
  const remove = useMutation({ mutationFn: (id: string) => removeConnection({ data: { id } }), onSuccess: () => { setNotice(""); refresh(); }, onError: onErr });

  const rows: ConnectionRow[] = connections.data ?? [];
  const incoming = rows.filter((r) => !r.outgoing && r.status === "pending");
  const outgoing = rows.filter((r) => r.outgoing && r.status === "pending");
  const accepted = rows.filter((r) => r.status === "accepted");
  const pendingWith = new Set(rows.filter((r) => r.status === "pending").map((r) => (r.outgoing ? r.addressee_id : r.requester_id)));
  const connectedWith = new Set(accepted.map((r) => (r.outgoing ? r.addressee_id : r.requester_id)));

  const tabs = [
    { key: "discover", label: "Discover" },
    { key: "requests", label: `Requests${incoming.length ? ` (${incoming.length})` : ""}` },
    { key: "connections", label: `My Connections${accepted.length ? ` (${accepted.length})` : ""}` },
  ] as const;

  const smallBtn = "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition";

  return (
    <WorkspaceShell title="Meet Students" subtitle="Find teammates and study partners who share your interests and goals.">
      {!profile?.discoverable && (
        <p className="mb-5 rounded-xl bg-coral-soft p-3 text-sm text-coral">
          You're not discoverable yet, so other students can't find or request you. You can still browse.{" "}
          <Link to="/settings" className="font-medium underline">Turn on discovery in Settings</Link>.
        </p>
      )}
      {notice && <p className="mb-5 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{notice}</p>}

      <div className="mb-6 flex gap-1 rounded-full border border-border bg-card p-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-4 py-2 text-sm transition ${tab === t.key ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_1fr_1fr]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className={`${input} pl-10`} placeholder="Search name, bio, goals…" value={q} onChange={(e) => setQ(e.target.value)} />
            </label>
            <input className={input} placeholder="Filter by intended major" value={major} onChange={(e) => setMajor(e.target.value)} />
            <input className={input} placeholder="Filter by interest or skill" value={interest} onChange={(e) => setInterest(e.target.value)} />
          </div>
          {students.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
          : students.isError ? <p className="text-sm text-destructive">Couldn't load students. Please refresh.</p>
          : (students.data ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No discoverable students match yet. Discovery is opt-in, so the directory grows as more students turn it on.
            </p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(students.data ?? []).map((s) => (
                <StudentCardView key={s.id} s={s} action={
                  connectedWith.has(s.id) ? <span className="text-xs font-medium text-teal">Connected</span>
                  : pendingWith.has(s.id) ? <span className="text-xs text-muted-foreground">Request pending</span>
                  : (
                    <button disabled={send.isPending} onClick={() => send.mutate(s.id)}
                      className={`${smallBtn} bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50`}>
                      <UserPlus className="h-3.5 w-3.5" /> Send request
                    </button>
                  )
                } />
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "requests" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Incoming">
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
          <Panel title="Outgoing">
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
      )}

      {tab === "connections" && (
        accepted.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No connections yet. Send a request from the Discover tab to get started.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {accepted.map((r) => r.other && (
              <StudentCardView key={r.id} s={r.other} action={
                <button disabled={remove.isPending} onClick={() => remove.mutate(r.id)} className={`${smallBtn} border border-border text-muted-foreground hover:bg-accent`}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove connection
                </button>
              } />
            ))}
          </ul>
        )
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        Only students who opted in to discovery appear here, and each card shows only the fields they chose to share. Messaging isn't available yet — it will arrive with blocking and reporting controls.
      </p>
    </WorkspaceShell>
  );
}
