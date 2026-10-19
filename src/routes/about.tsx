import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteLayout";
import { CreatorIntroduction } from "@/components/site/CreatorIntroduction";
import { Button } from "@/components/ui/button";

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
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 pt-24">
        <p className="text-sm font-medium text-primary">About the Platform</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-6xl">More Access. More Possibilities.</h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">
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
        </div>
      </section>
      <CreatorIntroduction full />
      <div className="mx-auto max-w-3xl px-5 pb-24">
      <blockquote className="rounded-2xl border-l-4 border-primary bg-primary-soft p-5 font-display text-xl text-accent-foreground">
        “To make opportunities more accessible and help students turn curiosity into meaningful action.”
      </blockquote>
        <section aria-labelledby="learn-about-creator-heading" className="mt-10">
          <h2 id="learn-about-creator-heading" className="font-display text-2xl font-semibold">Learn About the Creator</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">Curious about why I created Global Opportunity Finder? Learn more about the story behind this project and my goal of helping students discover more opportunities.</p>
          <Button asChild className="mt-6 h-auto whitespace-normal rounded-full px-6 py-3"><Link to="/about" hash="creator">Meet the Creator</Link></Button>
        </section>
      </div>
    </SiteShell>
  ),
});
