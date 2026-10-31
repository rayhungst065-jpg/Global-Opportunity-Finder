import { createFileRoute, Link, notFound, useLocation, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { categoryName, formatDeadline, SaveButton } from "@/components/site/OpportunityCard";
import { getOpportunity } from "@/lib/opportunities.functions";
import { useUser } from "@/lib/auth";
import { statusLabel, useSavedIds, useToggleSave } from "@/lib/saved";
import { verificationState } from "@/lib/opportunity-source";
import { opportunityAvailability, sourceField } from "@/lib/opportunity-catalog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/opportunities/$id")({
  loader: async ({ params }) => {
    const o = await getOpportunity({ data: { id: params.id } }).catch(() => null);
    if (!o) throw notFound();
    return o;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Opportunity"} — Global Opportunity Finder` },
      { name: "description", content: loaderData?.description?.slice(0, 150) ?? "Student opportunity details." },
      { property: "og:title", content: loaderData?.title ?? "Opportunity" },
      { property: "og:description", content: loaderData?.description?.slice(0, 150) ?? "Student opportunity details." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  notFoundComponent: () => (
    <WorkspaceShell title="Opportunity not found"><p>This opportunity wasn't found. <Link to="/opportunities" className="text-primary hover:underline">Browse all</Link></p></WorkspaceShell>
  ),
  component: Detail,
});

function Detail() {
  const o = Route.useLoaderData();
  const { user } = useUser();
  const saved = useSavedIds(user?.id);
  const toggle = useToggleSave(user?.id);
  const [msg, setMsg] = useState("");
  const isSaved = saved.data?.has(o.id) ?? false;
  const router = useRouter();
  const location = useLocation();
  const hasPreviousList = !!location.state.opportunityListReturn;
  const field = (name: string) => sourceField(o.source_record, name) ?? "Not specified";
  const source = o.source_record;
  const sections = [
    { title: "Eligibility", rows: [["Age group", field("Age Group")], ["Minimum age", field("Minimum Age")], ["Maximum age", field("Maximum Age")], ["Education level", field("Education Level")], ["International eligibility", sourceField(source, "International Accessibility") ?? "Not confirmed"], ["Country or regional restrictions", field("Country or Regional Restrictions")], ["Age eligibility classification", field("Age Eligibility Classification")], ["Under-18 participation", field("Under-18 Participation Note")]] },
    { title: "Participation", rows: [["Location", o.location || "Not specified"], ["Participation format", field("Participation Format")], ["Participation requirements", field("Participation Requirements")], ["International reach", field("International Reach")]] },
    { title: "Financial information", rows: [["Cost", field("Cost")], ["Additional expenses", field("Additional Expenses")], ["Funding or scholarships", field("Funding or Scholarship Information")]] },
    { title: "Application information", rows: [["Application deadline", formatDeadline(o.deadline, o.deadline_estimate)], ["Typical application period", field("Typical Application Period")], ["Application status", opportunityAvailability(o) ?? statusLabel[o.application_status]], ["Direct application link", field("Direct Application Link")]] },
    { title: "Verification", rows: [["Verification status", sourceField(source, "Verification Status") ?? "Not confirmed"], ["Last verified date", o.last_verified_at?.slice(0, 10) ?? "Not confirmed"]] },
  ];

  return (
    <WorkspaceShell title={o.title} subtitle={`${o.organizer || "Not specified"} · ${o.location || "Not specified"}`}>
      <article className="max-w-3xl">
        {hasPreviousList ? <Button variant="link" className="h-auto p-0" onClick={() => router.history.back()}>← Back to opportunities</Button> : <Link to="/opportunities" className="text-sm text-muted-foreground hover:text-foreground">← All opportunities</Link>}
        {o.is_demo && (
          <p className="mt-6 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">Demo data — this is a sample listing for testing, not a real opportunity.</p>
        )}
        <p className="mt-6 text-sm font-medium text-primary">{categoryName(o.category)} · {opportunityAvailability(o) ?? statusLabel[o.application_status]}</p>
        {!o.is_demo && <p className="mt-3 text-sm text-muted-foreground">{verificationState(o.last_verified_at, o.deadline)}. Stored dates are not automatically refreshed.</p>}
        <dl className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div><dt className="font-medium">Deadline</dt><dd className="text-muted-foreground">{formatDeadline(o.deadline, o.deadline_estimate)}</dd></div>
          <div><dt className="font-medium">Eligibility</dt><dd className="text-muted-foreground">{o.eligibility || "Not specified"}</dd></div>
        </dl>
        <section className="mt-8 border-t border-border pt-6">
          <h2 className="text-lg font-semibold">Full description</h2>
          <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">{o.description || "Not specified"}</p>
          {source && <><h3 className="mt-5 font-medium">Program purpose</h3><p className="mt-2 leading-relaxed text-muted-foreground">{field("Purpose")}</p></>}
        </section>
        {source && sections.map(section => <section key={section.title} className="mt-8 border-t border-border pt-6">
          <h2 className="text-lg font-semibold">{section.title}</h2>
          <dl className="mt-4 grid gap-5 text-sm sm:grid-cols-2">
            {section.rows.map(([label, value]) => <div key={label} className="min-w-0"><dt className="font-medium">{label}</dt><dd className="mt-1 break-words leading-relaxed text-muted-foreground">{value}</dd></div>)}
          </dl>
          {section.title === "Verification" && <div className="mt-4 text-sm"><span className="font-medium">Verification source: </span>{sourceField(source, "Verification Source") ? <a className="break-all text-primary hover:underline" href={field("Verification Source")} target="_blank" rel="noopener noreferrer">{field("Verification Source")}</a> : <span className="text-muted-foreground">Not specified</span>}</div>}
        </section>)}
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <SaveButton
            saved={isSaved}
            disabled={toggle.isPending}
            onClick={() => {
              if (!user) return setMsg("Log in or create an account to save opportunities.");
              toggle.mutate({ id: o.id, saved: isSaved }, { onError: (e) => setMsg(e.message) });
            }}
          />
          {o.official_url ? (
            <Button asChild className="rounded-full"><a href={o.official_url} target="_blank" rel="noopener noreferrer">Official website ↗</a></Button>
          ) : (
            <span className="text-sm text-muted-foreground">No official link listed</span>
          )}
        </div>
        {msg && <p className="mt-4 text-sm text-destructive">{msg}</p>}
      </article>
    </WorkspaceShell>
  );
}
