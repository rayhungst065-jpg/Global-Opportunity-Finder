import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { categories } from "@/lib/categories";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Explore Categories — Global Opportunity Finder" },
      { name: "description", content: "Volunteer, competitions, research, and awards & scholarships for students." },
      { property: "og:title", content: "Explore Categories — Global Opportunity Finder" },
      { property: "og:description", content: "Four kinds of student opportunities, all in one place." },
    ],
  }),
  component: Categories,
});

function Categories() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-6xl px-5 py-24">
        <h1 className="text-5xl font-semibold md:text-6xl">Explore Categories</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Pick a starting point. Full search and filters open once you create an account.</p>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {categories.map((c, i) => (
            <Reveal key={c.key} delay={i * 80}>
              <article id={c.key} className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft transition hover:-translate-y-1 hover:shadow-lift">
                <img src={c.image} alt={c.name} loading="lazy" width={1280} height={960} className="aspect-[16/10] w-full object-cover" />
                <div className="p-7">
                  <h2 className="text-2xl font-semibold">{c.name}</h2>
                  <p className="mt-2 text-muted-foreground">{c.text}</p>
                  <Link to="/signup" className="mt-4 inline-block font-medium text-primary hover:underline">Start exploring →</Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
