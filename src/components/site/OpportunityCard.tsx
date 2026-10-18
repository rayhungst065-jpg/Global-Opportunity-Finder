import { Link } from "@tanstack/react-router";
import { categories } from "@/lib/categories";
import { statusLabel, type Opportunity } from "@/lib/saved";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { safeOfficialUrl, verificationState } from "@/lib/opportunity-source";

export function categoryName(key: string) {
  return categories.find((c) => c.key === key)?.name ?? key;
}

export function formatDeadline(d: string | null) {
  if (!d) return "Deadline not listed";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function SaveButton({ saved, onClick, disabled }: { saved: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={saved}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition disabled:opacity-50 ${saved ? "bg-primary text-primary-foreground" : "border border-border hover:bg-accent"}`}
    >
      {saved ? "Saved" : "Save"}
    </Button>
  );
}

export function OpportunityCard({ o, action }: { o: Opportunity; action?: React.ReactNode }) {
  return (
    <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-lift">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-primary-soft px-2.5 py-1 font-medium text-accent-foreground">{categoryName(o.category)}</span>
        <span className="rounded-full border border-border px-2.5 py-1 text-muted-foreground">{o.description.includes("Application status unverified") ? "Availability unverified" : statusLabel[o.application_status]}</span>
        {o.is_demo && <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive">Demo data</span>}
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        <Link to="/opportunities/$id" params={{ id: o.id }} className="hover:underline">{o.title}</Link>
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{o.organizer} · {o.location}</p>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{o.description}</p>
      {!o.is_demo && <p className="mt-3 text-sm"><span className="font-medium">Eligibility: </span>{o.eligibility}</p>}
      {!o.is_demo && <p className="mt-2 text-xs text-muted-foreground">{verificationState(o.last_verified_at, o.deadline)}</p>}
      {safeOfficialUrl(o.official_url) && <Button asChild variant="link" className="mt-3 h-auto justify-start whitespace-normal p-0 text-left"><a href={safeOfficialUrl(o.official_url) ?? undefined} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4 shrink-0" />View Official Opportunity</a></Button>}
      <div className="mt-auto flex items-center justify-between pt-5 text-sm">
        <span className="text-muted-foreground">{formatDeadline(o.deadline)}</span>
        {action}
      </div>
    </article>
  );
}
