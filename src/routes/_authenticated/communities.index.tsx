import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, UserPlus, Plus } from "lucide-react";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { Avatar } from "@/components/site/Avatar";
import { useUser } from "@/lib/auth";
import { listCommunities, communityCategories } from "@/lib/communities.functions";
import { useMyMemberships } from "@/lib/communities";
import { discoverStudents, listMyConnections, sendRequest, type StudentCard } from "@/lib/connections.functions";
import { listPosts, createPost, updatePost } from "@/lib/posts.functions";

export const Route = createFileRoute("/_authenticated/communities/")({
  head: () => ({
    meta: [
      { title: "Communities — Global Opportunity Finder" },
      { name: "description", content: "Find student groups based on shared interests, academic goals, and projects." },
      { property: "og:title", content: "Communities — Global Opportunity Finder" },
      { property: "og:description", content: "Discover and join student communities." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Communities,
});

const formatLabel: Record<string, string> = { online: "Online", in_person: "In person", hybrid: "Hybrid" };
const input = "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-primary-soft";
const chip = "rounded-full bg-primary-soft px-2.5 py-0.5 text-xs text-accent-foreground";

function Communities() {
  const { user } = useUser();
  const [tab, setTab] = useState<"groups" | "posts">("groups");

  return (
    <WorkspaceShell title="Communities" subtitle="Discover public, interest-based communities and share posts with other students. New communities appear here only after an administrator approves them.">
      <div className="mb-6 flex gap-1 rounded-full border border-border bg-card p-1">
        {([["groups", "Discover Communities"], ["posts", "Posts"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 rounded-full px-4 py-2 text-sm transition ${tab === key ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "groups" ? <DiscoverGroups userId={user?.id} /> : <Posts userId={user?.id} />}
    </WorkspaceShell>
  );
}

/* ---------------- Discover Groups ---------------- */

function DiscoverGroups({ userId }: { userId: string | undefined }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string>("");
  const memberships = useMyMemberships(userId);

  const list = useQuery({
    queryKey: ["communities", q, category],
    queryFn: () => listCommunities({ data: { q: q || undefined, category: category || undefined } }),
  });

  const statusOf = (id: string) => memberships.data?.find((m) => m.community_id === id)?.status;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search communities…"
          className="w-full max-w-sm rounded-full border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <Link to="/communities/new" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          Start a community
        </Link>
        <Link to="/communities/my" className="rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-accent">
          My proposals
        </Link>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {["", ...communityCategories].map((c) => (
          <button key={c || "all"} onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${category === c ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-accent"}`}>
            {c || "All"}
          </button>
        ))}
      </div>

      <div className="mt-8">
        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : list.isError ? (
          <p className="text-sm text-destructive">Couldn't load communities. Please refresh.</p>
        ) : list.data!.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
            <p className="font-medium">No communities yet{q || category ? " for this search" : ""}.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Approved groups appear here. Be the first — <Link to="/communities/new" className="text-primary hover:underline">propose a community</Link>.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.data!.map((c) => {
              const st = statusOf(c.id);
              return (
                <li key={c.id} className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-accent-foreground">{c.category}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatLabel[c.format] ?? c.format} · {c.member_count} member{c.member_count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <Link to="/communities/$id" params={{ id: c.id }} className="mt-3 font-display text-lg font-medium hover:underline">
                    {c.name}
                  </Link>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    {st === "approved" ? (
                      <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-medium text-teal">Joined</span>
                    ) : st === "pending" ? (
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">Request pending</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Open to join requests</span>
                    )}
                    <Link to="/communities/$id" params={{ id: c.id }} className="text-sm text-primary hover:underline">
                      View group →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <StudentDiscovery userId={userId} />
    </>
  );
}

/** Student discovery lives here — opted-in students only, privacy-filtered server-side. */
function StudentDiscovery({ userId }: { userId: string | undefined }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [major, setMajor] = useState("");
  const [notice, setNotice] = useState("");

  const students = useQuery({
    queryKey: ["discover-students", q, major],
    queryFn: () => discoverStudents({ data: { q: q || undefined, major: major || undefined } }),
    enabled: !!userId,
  });
  const connections = useQuery({
    queryKey: ["my-connections"],
    queryFn: () => listMyConnections({}),
    enabled: !!userId,
  });
  const send = useMutation({
    mutationFn: (to: string) => sendRequest({ data: { to } }),
    onSuccess: () => { setNotice(""); qc.invalidateQueries({ queryKey: ["my-connections"] }); },
    onError: (e) => setNotice(e instanceof Error ? e.message : "Something went wrong."),
  });

  const rows = connections.data ?? [];
  const pendingWith = new Set(rows.filter((r) => r.status === "pending").map((r) => (r.outgoing ? r.addressee_id : r.requester_id)));
  const connectedWith = new Set(rows.filter((r) => r.status === "accepted").map((r) => (r.outgoing ? r.addressee_id : r.requester_id)));

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="font-display text-xl font-semibold">Find Students</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Students who opted in to discovery. Each card shows only the fields they chose to share.
      </p>
      {notice && <p className="mt-3 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{notice}</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className={`${input} pl-10`} placeholder="Search name, bio, goals…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <input className={input} placeholder="Filter by intended major" value={major} onChange={(e) => setMajor(e.target.value)} />
      </div>
      <div className="mt-5">
        {students.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
        : students.isError ? <p className="text-sm text-destructive">Couldn't load students. Please refresh.</p>
        : (students.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No discoverable students match yet. Discovery is opt-in, so the directory grows as more students turn it on.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(students.data ?? []).map((s: StudentCard) => (
              <li key={s.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-soft">
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
                {s.interests.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {s.interests.slice(0, 4).map((i) => <span key={i} className={chip}>{i}</span>)}
                  </div>
                )}
                <div className="mt-auto pt-4">
                  {connectedWith.has(s.id) ? <span className="text-xs font-medium text-teal">Connected</span>
                  : pendingWith.has(s.id) ? <span className="text-xs text-muted-foreground">Request pending</span>
                  : (
                    <button disabled={send.isPending} onClick={() => send.mutate(s.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
                      <UserPlus className="h-3.5 w-3.5" /> Send request
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ---------------- Posts ---------------- */

function Posts({ userId }: { userId: string | undefined }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [composing, setComposing] = useState(false);
  const [notice, setNotice] = useState("");

  const posts = useQuery({
    queryKey: ["posts", q],
    queryFn: () => listPosts({ data: { q: q || undefined } }),
    enabled: !!userId,
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["posts"] });
  const onErr = (e: unknown) => setNotice(e instanceof Error ? e.message : "Something went wrong.");

  const create = useMutation({
    mutationFn: (v: { title: string; body: string; topics: string; desired_skills: string; collaboration_goal: string }) =>
      createPost({ data: v }),
    onSuccess: () => { setNotice(""); setComposing(false); refresh(); },
    onError: onErr,
  });
  const update = useMutation({
    mutationFn: (v: { id: string; action: "close" | "reopen" | "delete" }) => updatePost({ data: v }),
    onSuccess: () => { setNotice(""); refresh(); },
    onError: onErr,
  });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input className={`${input} rounded-full pl-10`} placeholder="Search posts…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <button onClick={() => setComposing((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Create Post
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
              title: String(f.get("title") ?? ""),
              body: String(f.get("body") ?? ""),
              topics: String(f.get("topics") ?? ""),
              desired_skills: String(f.get("desired_skills") ?? ""),
              collaboration_goal: String(f.get("collaboration_goal") ?? ""),
            });
          }}
        >
          <input name="title" required minLength={3} maxLength={160} className={input} placeholder="Title — e.g. Looking for teammates for a robotics competition" />
          <textarea name="body" required minLength={10} maxLength={3000} rows={4} className={input} placeholder="Describe the project, competition, or opportunity and what you're looking for…" />
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="topics" className={input} placeholder="Topics (comma-separated)" />
            <input name="desired_skills" className={input} placeholder="Desired skills (comma-separated)" />
            <input name="collaboration_goal" className={input} placeholder="Collaboration goal" />
          </div>
          <div className="flex gap-2">
            <button disabled={create.isPending} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {create.isPending ? "Posting…" : "Publish post"}
            </button>
            <button type="button" onClick={() => setComposing(false)} className="rounded-full border border-border px-5 py-2 text-sm hover:bg-accent">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {posts.isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
        : posts.isError ? <p className="text-sm text-destructive">Couldn't load posts. Please refresh.</p>
        : (posts.data ?? []).length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No posts yet. Be the first to look for teammates.
          </p>
        ) : (
          <ul className="space-y-4">
            {(posts.data ?? []).map((p) => (
              <li key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar path={p.author?.avatar_path ?? null} name={p.author?.display_name ?? "Student"} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{p.author?.display_name ?? "Student"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {p.status === "closed" && <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">Closed</span>}
                </div>
                <h3 className="mt-3 font-display text-lg font-medium">{p.title}</h3>
                <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">{p.body}</p>
                {(p.topics.length > 0 || p.desired_skills.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.topics.map((t) => <span key={t} className={chip}>{t}</span>)}
                    {p.desired_skills.map((s) => <span key={s} className="rounded-full bg-teal-soft px-2.5 py-0.5 text-xs text-teal">{s}</span>)}
                  </div>
                )}
                {p.collaboration_goal && <p className="mt-3 text-sm"><span className="font-medium">Goal:</span> {p.collaboration_goal}</p>}
                <div className="mt-4 flex items-center gap-2">
                  {p.author_id === userId ? (
                    <>
                      <button onClick={() => update.mutate({ id: p.id, action: p.status === "open" ? "close" : "reopen" })}
                        className="rounded-full border border-border px-3.5 py-1.5 text-xs hover:bg-accent">
                        {p.status === "open" ? "Mark as filled" : "Reopen"}
                      </button>
                      <button onClick={() => update.mutate({ id: p.id, action: "delete" })}
                        className="rounded-full border border-border px-3.5 py-1.5 text-xs text-destructive hover:bg-accent">
                        Delete
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      To respond, send {p.author?.display_name ?? "the author"} a connection request from Discover Groups → Find Students.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
