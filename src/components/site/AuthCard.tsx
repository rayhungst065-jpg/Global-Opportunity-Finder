import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Logo } from "./SiteLayout";
import campus from "@/assets/college-campus.jpg";

/** Split-screen layout for the sign-up and log-in pages. */
export function AuthCard({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Visual side */}
      <div className="relative hidden w-1/2 lg:block">
        <img src={campus} alt="Students walking across a university campus at golden hour" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="relative flex h-full flex-col justify-between p-10 text-ink-foreground">
          <Link to="/" className="text-sm opacity-80 hover:opacity-100">← Back to home</Link>
          <div>
            <p className="font-display text-3xl font-semibold leading-snug md:text-4xl">Discover. Connect. Grow.</p>
            <p className="mt-3 max-w-md opacity-80">Opportunities, teammates, and pathways toward your future — in one place.</p>
          </div>
        </div>
      </div>

      {/* Form side */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-5 md:px-10">
          <Logo className="h-11" />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground lg:hidden">← Home</Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-20">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lift">
            <h1 className="text-3xl font-semibold">{title}</h1>
            <p className="mt-2 text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Field({ label, error, ...props }: { label: string; error?: string | undefined } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input {...props} className="mt-1.5 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none transition focus:border-ring focus:ring-4 focus:ring-primary-soft" />
      {error && <span className="mt-1 block text-sm text-destructive">{error}</span>}
    </label>
  );
}

export const submitBtn = "w-full rounded-full bg-primary py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50";
