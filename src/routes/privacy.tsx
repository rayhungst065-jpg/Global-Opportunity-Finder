import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Global Opportunity Finder" },
      { name: "description", content: "Draft privacy information for the Opportunity Finder." },
      { property: "og:title", content: "Privacy Policy — Global Opportunity Finder" },
      { property: "og:description", content: "Draft privacy information." },
    ],
  }),
  component: () => (
    <SimplePage eyebrow="Privacy Policy" title="Draft — not yet reviewed.">
      <p>This is a placeholder. A full privacy policy has not been written or legally reviewed.</p>
      <p>Our intent: collect only what's needed to personalize suggestions (education level, interests, general region), never exact addresses or school ID numbers, and never show your profile publicly.</p>
    </SimplePage>
  ),
});
