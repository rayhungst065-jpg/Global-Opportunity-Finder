import { createFileRoute, Link } from "@tanstack/react-router";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";

export const Route = createFileRoute("/_authenticated/college-match")({
  head: () => ({
    meta: [
      { title: "College Match — Opportunity Finder" },
      { name: "description", content: "Explore colleges that fit your intended major, preferences, and goals." },
    ],
  }),
  component: CollegeMatch,
});

function CollegeMatch() {
  return (
    <WorkspaceShell title="College Match" subtitle="Find colleges that fit your intended major, budget, and preferences.">
      <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
        <p className="font-display text-xl font-medium">In development</p>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          College Match will let you compare colleges by major, region, campus size, and budget, with explanations of why each one may fit. Real college data is not connected yet — when it launches, every program detail and cost will need verification with the university, and nothing here will ever guarantee admission.
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          For now, make sure your intended major and interests are up to date — they'll power your matches.
        </p>
        <Link to="/profile" search={{ edit: undefined }} className="mt-6 inline-block rounded-full border border-border bg-background px-5 py-2 text-sm hover:bg-accent">
          Update my profile
        </Link>
      </div>
    </WorkspaceShell>
  );
}
