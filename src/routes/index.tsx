import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { SiteShell } from "@/components/site/SiteLayout";
import { Reveal } from "@/components/site/Reveal";
import { categories } from "@/lib/categories";
import hero from "@/assets/hero.jpg";
import globalStudents from "@/assets/global-students.jpg";
import collegeCampus from "@/assets/college-campus.jpg";
import nextChapter from "@/assets/next-chapter.jpg";
import teammates from "@/assets/teammates.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Global Opportunity Finder — Your Future Starts Here." },
      { name: "description", content: "Big Dreams. Real Opportunities. Find opportunities. Meet your people. Build your future." },
      { property: "og:title", content: "Global Opportunity Finder" },
      { property: "og:description", content: "Discover opportunities, connect with like-minded students, and explore pathways toward your future." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const btnPrimary = "inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift";
const btnGhost = "inline-flex items-center justify-center rounded-full border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition hover:-translate-y-0.5 hover:bg-surface";
const btnLight = "inline-flex items-center justify-center rounded-full bg-ink-foreground px-6 py-3 text-sm font-medium text-ink transition hover:-translate-y-0.5";

/**
 * Parallax — the image inside drifts gently against the scroll direction.
 * One passive scroll listener sets --py from the section's viewport position.
 */
function Parallax({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const progress = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      el.style.setProperty("--py", Math.max(-0.6, Math.min(0.6, progress)).toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div ref={ref} className={`absolute inset-0 overflow-hidden ${className}`}>
      <img src={src} alt={alt} loading="lazy" width={1920} height={1088} className="parallax-layer h-full w-full object-cover" />
    </div>
  );
}

function Eyebrow({ children, dark, tone = "primary" }: { children: ReactNode; dark?: boolean; tone?: "primary" | "teal" | "coral" }) {
  const color = dark ? "text-teal" : tone === "teal" ? "text-teal" : tone === "coral" ? "text-coral" : "text-primary";
  return <p className={`text-sm font-medium ${color}`}>{children}</p>;
}

/** Per-category accent: violet, coral, teal, lavender. */
const categoryAccent: Record<string, string> = {
  volunteer: "border-t-teal",
  competitions: "border-t-coral",
  research: "border-t-primary",
  awards: "border-t-accent-foreground",
};

function Landing() {
  return (
    <SiteShell>
      {/* 1 — Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-lavender blur-3xl" />
          <div className="absolute -left-32 top-40 h-72 w-72 rounded-full bg-teal-soft blur-3xl" />
          <div className="absolute -right-32 top-64 h-72 w-72 rounded-full bg-coral-soft blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pt-20 text-center md:pt-28">
          <Reveal>
            <p className="font-display text-lg font-semibold text-primary md:text-xl">Big Dreams. Real Opportunities.</p>
            <h1 className="mx-auto mt-4 max-w-4xl text-5xl font-semibold leading-[1.02] md:text-7xl lg:text-8xl">
              Your Future Starts Here.
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Find opportunities. Meet your people. Build your future.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/opportunities" className={btnPrimary}>Explore Opportunities</Link>
              <Link to="/signup" className={btnGhost}>Find Your Next Step</Link>
            </div>
          </Reveal>
        </div>
        <Reveal delay={300} className="mx-auto mt-16 max-w-6xl px-5">
          <div className="overflow-hidden rounded-3xl shadow-lift">
            <img src={hero} alt="Students from different countries collaborating around a laptop in a library" width={1920} height={1088} className="reveal-zoom aspect-[16/9] w-full object-cover" />
          </div>
        </Reveal>
        <div className="scroll-cue mt-10 pb-6 text-center text-xs uppercase tracking-[0.2em] text-muted-foreground" aria-hidden>Scroll ↓</div>
      </section>

      {/* 2 — The problem */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-32 md:grid-cols-2">
        <Reveal>
          <Eyebrow tone="coral">The problem</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold leading-tight md:text-5xl">Finding the Right Opportunity Shouldn't Be So Difficult.</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Competitions, research programs, volunteering, internships, and awards are scattered across hundreds of websites, countries, organizations, and application portals. Many students never hear about the ones that fit them best.
          </p>
          <p className="mt-4 text-lg text-muted-foreground">
            Opportunity Finder brings that discovery into one calm, organized place.
          </p>
        </Reveal>
        <Reveal delay={150}>
          <div className="grid grid-cols-3 gap-3">
            {["University sites", "Nonprofits", "Government portals", "Foundations", "Social posts", "Newsletters"].map((s, i) => (
              <div key={s} className={`rounded-2xl border border-border p-4 text-sm shadow-soft ${["bg-lavender", "bg-cream", "bg-teal-soft", "bg-coral-soft", "bg-primary-soft", "bg-card"][i % 6]}`} style={{ transform: `rotate(${(i % 2 ? 1 : -1) * 2}deg)` }}>
                {s}
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* 3 — Opportunity discovery (dark, sticky-feel grid) */}
      <section className="bg-ink py-32 text-ink-foreground">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <Eyebrow dark>Opportunity discovery</Eyebrow>
            <h2 className="mt-3 text-4xl font-semibold md:text-6xl">Everything You're Looking For, in One Place.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg opacity-70">
              Four kinds of opportunities — searchable, filterable, and easy to keep track of.
            </p>
          </Reveal>
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c, i) => (
              <Reveal key={c.key} delay={i * 100}>
                <Link to="/categories" hash={c.key} className={`group block overflow-hidden rounded-3xl border border-ink-foreground/15 border-t-4 ${categoryAccent[c.key] ?? "border-t-primary"}`}>
                  <div className="overflow-hidden">
                    <img src={c.image} alt={c.name} loading="lazy" width={1280} height={960} className="aspect-[4/3] w-full object-cover transition duration-700 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <div className="font-display font-medium">{c.name}</div>
                    <p className="mt-1 text-sm opacity-60">{c.tagline}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <p className="mt-8 text-center text-sm opacity-60">Internships are planned as a fifth category as the catalog grows.</p>
          </Reveal>
        </div>
      </section>

      {/* 4 — Personalized matching */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-32 md:grid-cols-2">
        <Reveal>
          <Eyebrow tone="teal">Personalized matching</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Made Around Your Goals.</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            Tell us your education level, interests, intended major, and preferences. Simple, transparent matching suggests opportunities that may fit — no black box, and you always confirm eligibility with the organizer.
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

      {/* 5 — Find your team (parallax) */}
      <section className="relative">
        <Parallax src={teammates} alt="Two students building a small robot together at a desk" />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="relative mx-auto max-w-4xl px-5 py-40 text-center text-ink-foreground">
          <Reveal>
            <Eyebrow dark>Find your team</Eyebrow>
            <h2 className="mt-3 text-4xl font-semibold md:text-6xl">Great Projects Need Great Teammates.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg opacity-80">
              Soon you'll be able to discover students in other countries who share your interests and intended major — for competitions, research, and projects. Connection requests, privacy controls, and blocking are being built first, so it stays safe.
            </p>
            <p className="mt-6 inline-block rounded-full border border-ink-foreground/30 px-4 py-1.5 text-xs font-medium uppercase tracking-wider opacity-80">In development</p>
          </Reveal>
        </div>
      </section>

      {/* 6 — Global communities (parallax, live feature) */}
      <section className="relative">
        <Parallax src={globalStudents} alt="Students from different countries collaborating in a library with a world map on screen" />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="relative mx-auto max-w-4xl px-5 py-40 text-center text-ink-foreground">
          <Reveal>
            <Eyebrow dark>Global student communities</Eyebrow>
            <h2 className="mt-3 text-4xl font-semibold md:text-6xl">Join Students Who Share Your Interests.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg opacity-80">
              Browse approved communities — from robotics to cultural exchange — or propose your own. Every group is reviewed by an administrator before it goes live.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/communities" className={btnLight}>Explore Communities</Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 7 — College discovery */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-32 md:grid-cols-2">
        <Reveal className="md:order-2">
          <div className="overflow-hidden rounded-3xl shadow-soft">
            <img src={collegeCampus} alt="Students walking across a historic university campus at golden hour" loading="lazy" width={1920} height={1088} className="reveal-zoom aspect-[4/3] w-full object-cover" />
          </div>
        </Reveal>
        <Reveal delay={150}>
          <Eyebrow tone="coral">College discovery</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold md:text-5xl">Find Colleges That Fit Your Goals.</h2>
          <p className="mt-6 text-lg text-muted-foreground">
            College Match will compare colleges by your intended major, preferred regions, campus size, and budget — with honest explanations of why each might fit. No prestige rankings, no invented statistics, and never a promise of admission.
          </p>
          <p className="mt-4 inline-block rounded-full border border-border px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">In development</p>
        </Reveal>
      </section>

      {/* 8 — How it works */}
      <section className="bg-lavender py-32">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal><h2 className="text-center text-4xl font-semibold md:text-5xl">How It Works</h2></Reveal>
          <div className="mt-14 grid gap-5 md:grid-cols-4">
            {[
              "Create your student profile.",
              "Discover opportunities that match your interests.",
              "Save opportunities and track deadlines.",
              "Explore teams, communities, and colleges.",
            ].map((s, i) => (
              <Reveal key={s} delay={i * 120}>
                <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-soft transition hover:-translate-y-1">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-primary font-display text-primary-foreground">{i + 1}</div>
                  <p className="mt-6 font-display text-xl font-medium">{s}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200} className="mt-10 text-center">
            <Link to="/how-it-works" className="text-sm font-medium text-primary hover:underline">Read the full guide →</Link>
          </Reveal>
        </div>
      </section>

      {/* 9 — Final CTA */}
      <section className="relative">
        <Parallax src={nextChapter} alt="A student standing on a hilltop at sunrise, looking toward the horizon" />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="relative mx-auto max-w-4xl px-5 py-44 text-center text-ink-foreground">
          <Reveal>
            <h2 className="text-5xl font-semibold md:text-7xl">Your Next Opportunity Starts Here.</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg opacity-80">Start discovering possibilities that fit your interests and goals.</p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/signup" className={btnLight}>Get Started</Link>
              <Link to="/opportunities" className="inline-flex items-center justify-center rounded-full border border-ink-foreground/40 px-6 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-ink-foreground/10">Browse Opportunities</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </SiteShell>
  );
}
