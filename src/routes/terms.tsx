import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Global Opportunity Finder" },
      { name: "description", content: "Draft terms of use for the Opportunity Finder." },
      { property: "og:title", content: "Terms of Use — Global Opportunity Finder" },
      { property: "og:description", content: "Draft terms of use." },
    ],
  }),
  component: () => (
    <SimplePage eyebrow="Terms of Use" title="Draft — not yet reviewed.">
      <p>This is a placeholder. Terms of use have not been written or legally reviewed.</p>
      <p>Opportunity information is provided for discovery only. Always confirm deadlines, eligibility, and requirements on the organizer's official website.</p>
    </SimplePage>
  ),
});
