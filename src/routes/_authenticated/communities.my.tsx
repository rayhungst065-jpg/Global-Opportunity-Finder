import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { ProposalForm, proposalToValues, type ProposalValues } from "@/components/site/ProposalForm";
import { myProposals, updateProposal } from "@/lib/communities.functions";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/communities/my")({
  head: () => ({
    meta: [
      { title: "My Community Proposals — Opportunity Finder" },
      { name: "description", content: "Track, edit, or withdraw your community proposals." },
    ],
  }),
  component: MyProposals,
});

type ProposalRow = Database["public"]["Tables"]["community_proposals"]["Row"];

const statusChip: Record<string, string> = {
  pending: "bg-secondary text-muted-foreground",
  approved: "bg-teal-soft text-teal",
  rejected: "bg-destructive/10 text-destructive",
  withdrawn: "bg-secondary text-muted-foreground",
};

function MyProposals() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["my-proposals"], queryFn: () => myProposals() });
  const [editing, setEditing] = useState<ProposalRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["my-proposals"] });

  const withdraw = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      await updateProposal({ data: { id, action: "withdraw" } });
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't withdraw the proposal.");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (v: ProposalValues) => {
    if (!editing) return;
    setBusy(true);
    setError(null);
    try {
      await updateProposal({ data: { id: editing.id, action: "edit", fields: v } });
      setEditing(null);
      refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save your changes.");
    } finally {
      setBusy(false);
    }
  };

  if (editing) {
    return (
      <WorkspaceShell title={`Edit “${editing.name}”`} subtitle="Your proposal is still pending, so you can change it.">
        <div className="max-w-3xl rounded-3xl border border-border bg-card p-6 md:p-8">
          {error && <p className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
          <ProposalForm initial={proposalToValues(editing)} submitting={busy} submitLabel="Save changes" onSubmit={saveEdit} />
          <button onClick={() => setEditing(null)} className="mt-4 text-sm text-muted-foreground hover:underline">Cancel editing</button>
        </div>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell title="My proposals" subtitle="The status of every community you've proposed.">
      <div className="mb-6">
        <Link to="/communities/new" className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Propose another community</Link>
      </div>
      {error && <p className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : list.isError ? (
        <p className="text-sm text-destructive">Couldn't load your proposals. Please refresh.</p>
      ) : list.data!.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-medium">No proposals yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">Have an idea for a group? <Link to="/communities/new" className="text-primary hover:underline">Start a community</Link>.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.data!.map((p) => (
            <li key={p.id} className="rounded-3xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-lg font-medium">{p.name}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusChip[p.status] ?? statusChip["pending"]}`}>
                  {p.status === "pending" ? "Pending review" : p.status}
                </span>
                <span className="text-xs text-muted-foreground">{p.category} · submitted {new Date(p.created_at).toLocaleDateString()}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              {p.status === "rejected" && p.review_note && (
                <p className="mt-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">Reviewer note: {p.review_note}</p>
              )}
              {p.status === "approved" && (
                <p className="mt-3 text-sm text-teal">Approved — your group is now live in the <Link to="/communities" className="underline">directory</Link>.</p>
              )}
              {p.status === "pending" && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setEditing(p)} className="rounded-full border border-border px-4 py-1.5 text-sm hover:bg-accent">Edit</button>
                  <button onClick={() => withdraw(p.id)} disabled={busy} className="rounded-full border border-border px-4 py-1.5 text-sm text-destructive hover:bg-accent disabled:opacity-50">Withdraw</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </WorkspaceShell>
  );
}
