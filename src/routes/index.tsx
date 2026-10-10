import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { categories } from "@/lib/categories";
import hero from "@/assets/hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Global Student Opportunity Finder — Discover What's Next" },
      { name: "description", content: "Discover volunteer opportunities, competitions, research programs, and awards from around the world — all in one place." },
      { property: "og:title", content: "Global Student Opportunity Finder" },
      { property: "og:description", content: "Volunteer, competitions, research, and awards for students worldwide — in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const btnPrimary = "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift";
const btnGhost = "inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:bg-surface";

function Landing() {
  return (
    <SiteShell>
      {/* 1 — Hero */}
      <section className="relative mx-auto max-w-6xl px-5 pt-20 text-center md:pt-28">
        <Reveal>
          <p className="text-sm font-medium text-teal">For students aged 15–20, everywhere</p>
          <h1 className="mx-auto mt-4 max-w-4xl text-5xl font-semibold leading-[1.02] md:text-7xl lg:text-8xl">
            Your Future Has More Possibilities.
          </h1>
        </Reveal>
        <Reveal delay={150}>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Discover volunteer opportunities, competitions, research programs, and awards from around the world—all in one place.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/categories" className={btnPrimary}>Discover Opportunities</Link>
            <Link to="/how-it-works" className={btnGhost}>How It Works</Link>
          </div>
        </Reveal>
        <Reveal delay={300} className="mt-16">
          <div className="overflow-hidden rounded-3xl shadow-lift">
            <img src={hero} alt="Students from different countries collaborating around a laptop in a library" width={1920} height={1088} className="reveal-zoom aspect-[16/9] w-full object-cover" />
          </div>
        </Reveal>
        <div className="scroll-cue mt-10 text-xs uppercase tracking-[0.2em] text-muted-foreground" aria-hidden>Scroll ↓</div>
      </section>

      {/* 2 — Problem */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-32 md:grid-cols-2">
        <Reveal>
          <h2 className="text-4xl font-semibold leading-tight md:text-5xl">Finding the Right Opportunity Shouldn't Be So Difficult.</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Programs are scattered across hundreds of websites, countries, organizations, and application portals. Many students never hear about the ones that fit them best.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className="grid grid-cols-3 gap-3">
            {["University sites", "Nonprofits", "Government portals", "Foundations", "Social posts", "Newsletters"].map((s, i) => (
              <div key={s} className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-soft" style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 2}deg)` }}>
                {s}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 3 — One platform */}
      <section className="bg-ink py-32 text-ink-foreground">
        <div className="mx-auto max-w-5xl px-5 text-center">
          <Reveal>
            <h2 className="text-4xl font-semibold md:text-6xl">Everything You're Looking For, in One Place.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg opacity-70">
              One calm, organized home for four kinds of opportunities — searchable, filterable, and easy to keep track of.
            </p>
          </Reveal>
          <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((c, i) => (
              <Reveal key={c.key} delay={i * 100}>
                <div className="rounded-2xl border border-ink-foreground/15 p-6 text-left">
                  <div className="text-3xl font-semibold text-teal">0{i + 1}</div>
                  <div className="mt-3 font-display font-medium">{c.name}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Explore interests */}
      <section className="mx-auto max-w-6xl space-y-28 px-5 py-32">
        {categories.map((c, i) => (
          <div key={c.key} className="grid items-center gap-10 md:grid-cols-2">
            <Reveal className={i % 2 ? "md:order-2" : ""}>
              <div className="overflow-hidden rounded-3xl shadow-soft">
                <img src={c.image} alt={c.name} loading="lazy" width={1280} height={960} className="reveal-zoom aspect-[4/3] w-full object-cover" />
              </div>
            </Reveal>
            <Reveal delay={150}>
              <p className="text-sm font-medium text-primary">{c.name}</p>
              <h3 className="mt-3 text-3xl font-semibold md:text-5xl">{c.tagline}</h3>
              <p className="mt-5 text-lg text-muted-foreground">{c.text}</p>
              <Link to="/categories" hash={c.key} className="mt-6 inline-block font-medium text-primary hover:underline">
                Explore {c.name} →
              </Link>
            </Reveal>
          </div>
        ))}
      </section>

      {/* 5 — Personalized */}
      <section className="bg-surface py-32">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 md:grid-cols-2">
          <Reveal>
            <h2 className="text-4xl font-semibold md:text-5xl">Made Around Your Goals.</h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Tell us your education level, interests, intended major, and preferences. We'll suggest opportunities that may be a good fit — you always confirm eligibility with the organizer.
            </p>
          </Reveal>
          <div className="space-y-3">
            {[
              { t: "Sample: Marine Biology Summer Program", m: "Matches: Biology · High school · Online" },
              { t: "Sample: Youth Coding Challenge", m: "Matches: Computer Science · Competitions" },
              { t: "Sample: Community Climate Volunteers", m: "Matches: Environment · In-person" },
            ].map((r, i) => (
              <Reveal key={r.t} delay={i * 120}>
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-soft">
                  <div>
                    <div className="font-display font-medium">{r.t}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{r.m}</div>
                  </div>
                  <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-medium text-teal">Preview</span>
                </div>
              </Reveal>
            ))}
            <p className="text-xs text-muted-foreground">Illustrative preview — not real listings.</p>
          </div>
        </div>
      </section>

      {/* 6 — Stay organized */}
      <section className="mx-auto max-w-6xl px-5 py-32">
        <Reveal className="text-center">
          <h2 className="text-4xl font-semibold md:text-6xl">Keep Your Next Steps in Sight.</h2>
        </Reveal>
        <Reveal delay={150} className="mt-14">
          <div className="grid gap-4 rounded-3xl border border-border bg-card p-4 shadow-lift md:grid-cols-[180px_1fr]">
            <aside className="hidden space-y-1 rounded-2xl bg-surface p-3 text-sm md:block">
              {["Dashboard", "Explore", "Recommendations", "Saved", "Deadlines", "Profile"].map((n, i) => (
                <div key={n} className={`rounded-lg px-3 py-2 ${i === 0 ? "bg-primary-soft font-medium text-primary" : "text-muted-foreground"}`}>{n}</div>
              ))}
            </aside>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { h: "Saved", v: "Your shortlist", c: "bg-primary-soft text-primary" },
                { h: "Deadlines", v: "What's coming up", c: "bg-teal-soft text-teal" },
                { h: "Profile", v: "Your interests", c: "bg-secondary text-foreground" },
              ].map((b) => (
                <div key={b.h} className="rounded-2xl border border-border p-5">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${b.c}`}>{b.h}</span>
                  <div className="mt-6 font-display text-xl font-medium">{b.v}</div>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 w-full rounded-full bg-muted" />
                    <div className="h-2 w-2/3 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 7 — How it works */}
      <section className="bg-surface py-32">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal><h2 className="text-center text-4xl font-semibold md:text-5xl">How It Works</h2></Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {["Create your student profile.", "Discover opportunities that match your interests.", "Save opportunities and track deadlines."].map((s, i) => (
              <Reveal key={s} delay={i * 120}>
                <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-soft transition hover:-translate-y-1">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary font-display text-primary-foreground">{i + 1}</div>
                  <p className="mt-6 font-display text-xl font-medium">{s}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 8 — CTA */}
      <section className="mx-auto max-w-4xl px-5 py-36 text-center">
        <Reveal>
          <h2 className="text-5xl font-semibold md:text-7xl">Your Next Opportunity Starts Here.</h2>
          <p className="mt-6 text-lg text-muted-foreground">Start discovering possibilities that fit your interests and goals.</p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/signup" className={btnPrimary}>Get Started</Link>
            <Link to="/login" className={btnGhost}>Sign In</Link>
          </div>
        </Reveal>
      </section>
    </SiteShell>
  );
}
