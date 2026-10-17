import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { getMyRoles, listAllProposals, reviewProposal } from "@/lib/communities.functions";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin/proposals")({
  head: () => ({
    meta: [
      { title: "Review Community Proposals — Global Opportunity Finder" },
      { name: "description", content: "Administrator review of student community proposals." },
    ],
  }),
  component: AdminProposals,
});

type ProposalRow = Database["public"]["Tables"]["community_proposals"]["Row"];

const statusChip: Record<string, string> = {
  pending: "bg-secondary text-muted-foreground",
  approved: "bg-teal-soft text-teal",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-secondary text-muted-foreground",
};

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function ProposalCard({ p, onDone }: { p: ProposalRow; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decide = async (decision: "approved" | "rejected") => {
    setBusy(true);
    setError(null);
    try {
      await reviewProposal({ data: { id: p.id, decision, note: note || undefined } });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the review.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-medium">{p.name}</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusChip[p.status] ?? statusChip["pending"]}`}>
          {p.status === "pending" ? "Pending review" : p.status}
        </span>
        <span className="text-xs text-muted-foreground">{p.category} · {p.format} · submitted {new Date(p.created_at).toLocaleDateString()}</span>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <Row label="Topic" value={p.topic} />
        <Row label="Purpose" value={p.purpose} />
        <Row label="Problem or goal" value={p.problem} />
        <Row label="Description" value={p.description} />
        <Row label="Short-term goals" value={p.short_term_goals} />
        <Row label="Long-term goals" value={p.long_term_goals} />
        <Row label="Planned activities" value={p.activities} />
        <Row label="Participants & skills" value={p.participants} />
        <Row label="Meeting frequency" value={p.meeting_frequency} />
        <Row label="Proposed rules" value={p.rules} />
      </div>

      {p.status === "pending" && (
        <div className="mt-6 border-t border-border pt-5">
          <label className="mb-1 block text-sm font-medium" htmlFor={`note-${p.id}`}>Review note (optional, shown to the student)</label>
          <textarea id={`note-${p.id}`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={() => decide("approved")} disabled={busy} className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">Approve & publish</button>
            <button onClick={() => decide("rejected")} disabled={busy} className="rounded-full border border-border px-5 py-2 text-sm text-destructive hover:bg-accent disabled:opacity-50">Reject</button>
          </div>
        </div>
      )}
      {p.status !== "pending" && p.review_note && <p className="mt-4 text-sm text-muted-foreground">Review note: {p.review_note}</p>}
    </li>
  );
}

function AdminProposals() {
  const qc = useQueryClient();
  const roles = useQuery({ queryKey: ["my-roles"], queryFn: () => getMyRoles() });
  const isAdmin = roles.data?.includes("admin") ?? false;
  const list = useQuery({ queryKey: ["all-proposals"], queryFn: () => listAllProposals(), enabled: isAdmin });

  if (roles.isLoading) return <WorkspaceShell title="Review proposals"><p className="text-sm text-muted-foreground">Loading…</p></WorkspaceShell>;

  if (!isAdmin) {
    return (
      <WorkspaceShell title="Review proposals">
        <div className="rounded-3xl border border-border bg-card p-10 text-center">
          <p className="font-medium">This page is for administrators.</p>
          <p className="mt-2 text-sm text-muted-foreground">Only authorized reviewers can approve community proposals. <Link to="/communities" className="text-primary hover:underline">Back to communities</Link></p>
        </div>
      </WorkspaceShell>
    );
  }

  const pending = (list.data ?? []).filter((p) => p.status === "pending");
  const reviewed = (list.data ?? []).filter((p) => p.status !== "pending");

  return (
    <WorkspaceShell title="Review community proposals" subtitle="Approve a proposal to publish the group, or reject it with a note for the student.">
      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.isError ? (
        <p className="text-sm text-destructive">Couldn't load proposals. Please refresh.</p>
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Waiting for review ({pending.length})</h2>
            {pending.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">Nothing waiting. New proposals appear here.</p>
            ) : (
              <ul className="space-y-4">{pending.map((p) => <ProposalCard key={p.id} p={p} onDone={() => qc.invalidateQueries({ queryKey: ["all-proposals"] })} />)}</ul>
            )}
          </section>
          {reviewed.length > 0 && (
            <section>
              <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">Already reviewed ({reviewed.length})</h2>
              <ul className="space-y-4">{reviewed.map((p) => <ProposalCard key={p.id} p={p} onDone={() => qc.invalidateQueries({ queryKey: ["all-proposals"] })} />)}</ul>
            </section>
          )}
        </div>
      )}
    </WorkspaceShell>
  );
}
