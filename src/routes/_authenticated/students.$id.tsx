import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { Avatar } from "@/components/site/Avatar";
import { ConnectButton } from "@/components/site/StudentCard";
import { useUser } from "@/lib/auth";
import { getStudent, listMyConnections } from "@/lib/connections.functions";

export const Route = createFileRoute("/_authenticated/students/$id")({
  head: () => ({
    meta: [
      { title: "Student Profile — Global Opportunity Finder" },
      { name: "description", content: "A student's shared profile, interests and goals." },
      { property: "og:title", content: "Student Profile — Global Opportunity Finder" },
      { property: "og:description", content: "A student's shared profile, interests and goals." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudentPage,
});

const ns = <span className="text-muted-foreground">Not specified</span>;
const chips = (xs: string[]) => xs.length ? <span className="flex flex-wrap gap-2">{xs.map((x) => <span key={x} className="rounded-full bg-primary-soft px-3 py-1 text-sm text-accent-foreground">{x}</span>)}</span> : ns;

function StudentPage() {
  const { id } = Route.useParams();
  const { user } = useUser();
  const student = useQuery({ queryKey: ["student", id], queryFn: () => getStudent({ data: { id } }), enabled: !!user });
  const conns = useQuery({ queryKey: ["my-connections"], queryFn: () => listMyConnections({}), enabled: !!user });
  const s = student.data;
  return (
    <WorkspaceShell title="Student Profile" subtitle="Only information this student chose to share is shown.">
      {student.isLoading || !user ? <p className="text-muted-foreground">Loading…</p>
      : student.isError ? <p className="text-destructive">Couldn't load this profile. Please refresh.</p>
      : !s ? <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">This profile isn't available. <Link to="/meet-students" className="text-primary hover:underline">Back to Meet Students</Link></p>
      : (
        <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar path={s.avatar_path} name={s.display_name} size="lg" />
            <h2 className="min-w-0 flex-1 truncate text-xl font-semibold">{s.display_name}</h2>
            {s.id !== user.id && <ConnectButton studentId={s.id} rows={conns.data ?? []} />}
          </div>
          <dl className="mt-5 divide-y divide-border">
            {([
              ["Country", s.country_region || ns],
              ["Education level", [s.education_level, s.grade].filter(Boolean).join(" · ") || ns],
              ["Intended major", s.intended_major || ns],
              ["Interests", chips(s.interests)],
              ["Goals", chips(s.goals)],
              ["Languages", chips(s.languages)],
              ["Bio", s.bio ? <span className="whitespace-pre-line">{s.bio}</span> : <span className="text-muted-foreground">No bio yet.</span>],
            ] as const).map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="text-sm">{v}</dd></div>
            ))}
          </dl>
        </section>
      )}
    </WorkspaceShell>
  );
}
