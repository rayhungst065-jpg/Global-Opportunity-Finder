import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { AuthCard, Field, submitBtn } from "@/components/site/AuthCard";
import { readFeatureDestination, type FeatureDestination } from "@/lib/auth-destination";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { next?: FeatureDestination } => {
    const next = readFeatureDestination(search['next']);
    return next ? { next } : {};
  },
  head: () => ({
    meta: [
      { title: "Log In — Global Opportunity Finder" },
      { name: "description", content: "Log in to your student account." },
      { property: "og:title", content: "Log In — Global Opportunity Finder" },
      { property: "og:description", content: "Sign in to see your saved opportunities and deadlines." },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    if (!email || !password) return setError("Enter your email and password.");
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); return setError(error.message); }
    const { data: prof } = await supabase.from("profiles").select("onboarded").eq("id", data.user.id).maybeSingle();
    setBusy(false);
    navigate({ to: next ?? (prof?.onboarded ? "/dashboard" : "/onboarding") });
  }
  return (
    <AuthCard title="Welcome back" subtitle="Log in to continue." footer={<>New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email address" name="email" type="email" autoComplete="email" />
        <Field label="Password" name="password" type="password" autoComplete="current-password" />
        <div className="text-right text-sm"><Link to="/forgot-password" className="text-primary hover:underline">Forgot Password?</Link></div>
        <button className={submitBtn} disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </AuthCard>
  );
}
