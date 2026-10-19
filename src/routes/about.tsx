import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Global Opportunity Finder" },
      { name: "description", content: "Why Global Opportunity Finder exists and who it's for." },
      { property: "og:title", content: "About — Global Opportunity Finder" },
      { property: "og:description", content: "More access. More possibilities." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SimplePage eyebrow="About the Platform" title="More Access. More Possibilities.">
      <p>
        Global Opportunity Finder is a student-focused platform designed to make meaningful opportunities easier to
        discover. Students can explore volunteering, competitions, research programs, internships, and awards in one
        organized place.
      </p>
      <p>
        The platform also aims to help students connect with peers who share their interests, discover collaboration
        opportunities, and explore potential college pathways.
      </p>
      <p>
        The project was created in response to a common challenge: opportunities are often scattered across different
        websites, making them difficult for students to discover and compare. Global Opportunity Finder aims to make
        that process more accessible, organized, and connected.
      </p>
      <p>
        Our goal is to help students take the next step toward their interests, goals, and future ambitions.
      </p>
      <blockquote className="rounded-2xl border-l-4 border-primary bg-primary-soft p-5 font-display text-xl text-accent-foreground">
        “To make opportunities more accessible and help students turn curiosity into meaningful action.”
      </blockquote>
    </SimplePage>
  ),
});
