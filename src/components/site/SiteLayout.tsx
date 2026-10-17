import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useUser } from "@/lib/auth";
import { useSignOut } from "./WorkspaceShell";
import logoSymbol from "@/assets/original-logo-symbol.png.asset.json";

/** Full logo (symbol + wordmark + tagline) for public/auth pages and footer. */
export function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <Link to="/" aria-label="Global Opportunity Finder — home" className="inline-flex min-w-0 items-center gap-2">
      <img src={logoSymbol.url} alt="" className={`w-auto shrink-0 object-contain ${className}`} />
      <span className="max-w-44 font-display text-sm font-semibold leading-tight text-foreground">Global Opportunity Finder</span>
    </Link>
  );
}

/** Symbol-only mark for the compact dashboard sidebar. */
export function LogoSymbol({ className = "h-9" }: { className?: string }) {
  return <Logo className={className} />;
}

const nav = [
  { to: "/how-it-works", label: "How It Works" },
  { to: "/opportunities", label: "Browse" },
  { to: "/categories", label: "Explore Categories" },
  { to: "/about", label: "About" },
] as const;

export function SiteHeader() {
  const { user } = useUser();
  const signOut = useSignOut();
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-2">
        <Logo />
        <nav className="hidden items-center gap-5 text-sm text-muted-foreground xl:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>
              {n.label}
            </Link>
          ))}
        </nav>
        {user ? (
        <div className="flex items-center gap-2 text-sm">
          <Link to="/profile" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground">Profile</Link>
          <Link to="/dashboard" className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition hover:opacity-90">Dashboard</Link>
          <button onClick={signOut} className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground">Log Out</button>
        </div>
        ) : (
        <div className="flex items-center gap-2 text-sm">
          <Link to="/login" className="rounded-full px-3 py-1.5 text-muted-foreground hover:text-foreground">
            Log In
          </Link>
          <Link to="/signup" className="rounded-full bg-primary px-4 py-1.5 font-medium text-primary-foreground transition hover:opacity-90">
            Sign Up
          </Link>
        </div>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  const links = [
    { to: "/about", label: "About" },
    { to: "/support", label: "Support" },
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/terms", label: "Terms of Use" },
  ] as const;
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo className="h-12" />
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {links.map((l) => (
            <Link key={l.to + l.label} to={l.to} className="hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

/** Simple honest page used for About/Contact/Privacy/Terms. */
export function SimplePage({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-5 py-24">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold md:text-6xl">{title}</h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-muted-foreground">{children}</div>
      </section>
    </SiteShell>
  );
}
