import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Opportunity Finder" },
      { name: "description", content: "How to get in touch with the Opportunity Finder project." },
      { property: "og:title", content: "Contact — Opportunity Finder" },
      { property: "og:description", content: "Contact details for the project." },
    ],
  }),
  component: () => (
    <SimplePage eyebrow="Contact" title="Get in touch.">
      <p>Contact details for this project haven't been published yet. This page will be updated with an official contact method.</p>
    </SimplePage>
  ),
});
