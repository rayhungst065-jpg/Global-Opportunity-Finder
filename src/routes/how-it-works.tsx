import { createFileRoute } from "@tanstack/react-router";
import { SimplePage } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Global Opportunity Finder" },
      { name: "description", content: "Create a profile, discover matching opportunities, and track deadlines." },
      { property: "og:title", content: "How It Works — Global Opportunity Finder" },
      { property: "og:description", content: "Three simple steps to find student opportunities." },
    ],
  }),
  component: () => (
    <SimplePage eyebrow="How It Works" title="Three simple steps.">
      <p><strong className="text-foreground">1. Create your student profile.</strong> Share your education level, interests, and intended major — nothing more sensitive than that.</p>
      <p><strong className="text-foreground">2. Discover opportunities.</strong> Search and filter across volunteer work, competitions, research, and awards. Suggestions are based on your preferences.</p>
      <p><strong className="text-foreground">3. Save and track.</strong> Keep a shortlist and see upcoming deadlines in one place. Always confirm details on the organizer's official website.</p>
    </SimplePage>
  ),
});
