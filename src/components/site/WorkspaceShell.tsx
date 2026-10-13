import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Logo } from "./SiteLayout";
import { supabase } from "@/integrations/supabase/client";

const items = [
  { to: "/dashboard", label: "My Dashboard" },
  { to: "/profile", label: "My Profile" },
  { to: "/opportunities", label: "Explore Opportunities" },
  { to: "/recommended", label: "Recommended for Me" },
  { to: "/saved", label: "Saved Opportunities" },
  { to: "/deadlines", label: "Deadlines" },
  { to: "/settings", label: "Settings" },
] as const;

export function useSignOut() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
}

/** Logged-in student workspace: left sidebar on desktop, scrollable tab bar on mobile. */
export function WorkspaceShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const signOut = useSignOut();
  const link = "block rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground";
  const active = { className: "bg-primary-soft font-medium text-accent-foreground" };
  return (
    <div className="min-h-screen bg-surface md:flex">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background px-4 py-6 md:sticky md:top-0 md:flex md:h-screen">
        <div className="px-2"><Logo /></div>
        <nav className="mt-8 space-y-1" aria-label="Student workspace">
          {items.map((i) => (
            <Link key={i.to} to={i.to} className={link} activeProps={active}>{i.label}</Link>
          ))}
        </nav>
        <div className="mt-auto space-y-1 border-t border-border pt-4">
          <Link to="/" className={link}>← Back to homepage</Link>
          <button onClick={signOut} className={`${link} w-full text-left`}>Log out</button>
        </div>
      </aside>

      <div className="flex-1">
        <div className="border-b border-border bg-background md:hidden">
          <div className="flex items-center justify-between px-5 py-4">
            <Logo />
            <div className="flex gap-3 text-sm">
              <Link to="/" className="text-muted-foreground">Home</Link>
              <button onClick={signOut} className="text-muted-foreground">Log out</button>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3" aria-label="Student workspace">
            {items.map((i) => (
              <Link key={i.to} to={i.to} className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-muted-foreground" activeProps={active}>{i.label}</Link>
            ))}
          </nav>
        </div>
        <main className="mx-auto max-w-5xl px-5 py-10 md:px-10 md:py-14">
          <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-10">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
