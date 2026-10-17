import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspaceShell } from "@/components/site/WorkspaceShell";
import { ProposalForm, emptyProposal, type ProposalValues } from "@/components/site/ProposalForm";
import { submitProposal } from "@/lib/communities.functions";

export const Route = createFileRoute("/_authenticated/communities/new")({
  head: () => ({
    meta: [
      { title: "Start a Community — Global Opportunity Finder" },
      { name: "description", content: "Propose a new student community. An administrator reviews every proposal before it goes live." },
    ],
  }),
  component: NewCommunity,
});

function NewCommunity() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (v: ProposalValues) => {
    setSubmitting(true);
    setError(null);
    try {
      await submitProposal({ data: v });
      navigate({ to: "/communities/my" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit your proposal. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <WorkspaceShell title="Start a community" subtitle="Tell us about the group you want to create. An administrator reviews every proposal before it appears in the directory.">
      <div className="max-w-3xl rounded-3xl border border-border bg-card p-6 md:p-8">
        {error && <p className="mb-6 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>}
        <ProposalForm initial={emptyProposal} submitting={submitting} submitLabel="Submit for review" onSubmit={onSubmit} />
      </div>
    </WorkspaceShell>
  );
}
