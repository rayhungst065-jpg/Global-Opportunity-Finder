import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { useUser } from "@/lib/auth";
import { useProfile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/meet-students")({
  head: () => ({
    meta: [
      { title: "Meet Students — Opportunity Finder" },
      { name: "description", content: "Discover students in other countries who share your interests and goals." },
    ],
  }),
  component: MeetStudents,
});

function MeetStudents() {
  const { user } = useUser();
  const p = useProfile(user?.id).data;
  return (
    <WorkspaceShell title="Meet Students" subtitle="Find teammates and study partners in other countries — for projects, competitions, and cultural exchange.">
      <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
        <p className="font-display text-xl font-medium">In development</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Student discovery and connection requests are being built next, with privacy controls, reporting, and blocking before any messaging. Nothing here is live yet — this page is a placeholder so you always know where it will appear.
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          {p?.discoverable
            ? "You've opted in to discovery in your profile, so you'll appear in search once this launches."
            : "Discovery is currently off for your account. You can turn it on in your profile's privacy settings."}
        </p>
        <Link to="/profile" search={{ edit: false }} className="mt-6 inline-block rounded-full border border-border bg-background px-5 py-2 text-sm hover:bg-accent">
          Review privacy settings
        </Link>
      </div>
    </WorkspaceShell>
  );
}
