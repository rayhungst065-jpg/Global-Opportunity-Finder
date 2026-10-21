import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Tell Us About You 🎯",
    body: "First things first—let's get to know you! Create your student account and build your profile by sharing your interests, education level, country, and intended major. You don't need to have your whole future planned out. Whether you're passionate about science, business, art, technology, or still figuring things out, there's a place for you here!",
    tip: "Still exploring your interests? No worries! This is where the adventure begins.",
  },
  {
    title: "Explore What's Possible 🔎",
    body: "Now comes the exciting part! Explore opportunities in competitions, research, internships, scholarships, volunteering, and more. Use search and filters to find options that match your interests and goals. You might discover a competition you want to enter, a research program that sparks your curiosity, or a volunteer opportunity where you can make a real difference.",
    tip: "Be curious, try something new, and don't be afraid to explore outside your comfort zone!",
  },
  {
    title: "Make Your Move 🚀",
    body: "Found something interesting? Save it to your list, keep an eye on upcoming deadlines, and organize the opportunities you want to pursue. When you're ready, visit the organizer's official website to check the requirements and apply. You can also connect with students who share your interests and explore ideas together!",
    tip: "One small step today could lead to an amazing opportunity tomorrow!",
  },
];

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Global Opportunity Finder" },
      { name: "description", content: "Tell us about you, explore what's possible, and make your move — three steps to your next opportunity." },
      { property: "og:title", content: "How It Works — Global Opportunity Finder" },
      { property: "og:description", content: "Your next big opportunity might be closer than you think. Here's how to find it!" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl px-5 py-24">
        <p className="text-sm font-medium text-primary">How It Works</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-6xl">How It Works</h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Your next big opportunity might be closer than you think. Here's how to find it!
        </p>

        <ol className="mt-14 space-y-6">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
              <div className="flex flex-col gap-4 md:flex-row md:gap-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary font-display text-lg font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-primary">Step {i + 1}</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold">{s.title}</h2>
                  <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{s.body}</p>
                  <p className="mt-4 rounded-xl bg-primary-soft p-4 text-accent-foreground">
                    <strong>Fun tip:</strong> {s.tip}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-16 rounded-2xl bg-primary-soft p-8 text-center md:p-12">
          <h2 className="font-display text-3xl font-semibold">Ready to Find Your Next Opportunity?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Your journey doesn't have to be figured out all at once. Start exploring, follow your curiosity, and discover what you're capable of. Your next opportunity could be the beginning of something amazing!
          </p>
          {/* Opportunities are sign-in only; the existing gate sends visitors to sign in. */}
          <Button asChild className="mt-8 h-auto rounded-full px-8 py-3">
            <Link to="/opportunities">Get Started</Link>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
