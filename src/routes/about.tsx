import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Opportunity Finder" },
      { name: "description", content: "About the Global Student Opportunity Finder, a student Capstone project." },
      { property: "og:title", content: "About — Opportunity Finder" },
      { property: "og:description", content: "Why this platform exists and who it's for." },
    ],
  }),
  component: () => (
    <SimplePage eyebrow="About the Platform" title="Built by a student, for students.">
      <p>Global Student Opportunity Finder is a Capstone project that gathers volunteer work, competitions, research programs, and awards into one organized place for students aged roughly 15–20.</p>
      <p>Listings are labeled clearly. Sample data is marked as sample data, and we never invent deadlines, eligibility rules, or application links. Always confirm details with the official organizer.</p>
    </SimplePage>
  ),
});
