import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthCard, Field, submitBtn } from "@/components/site/AuthCard";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — Opportunity Finder" },
      { name: "description", content: "Create your student account." },
      { property: "og:title", content: "Sign Up — Opportunity Finder" },
      { property: "og:description", content: "Create your free student account." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "");
    const pw = String(f.get("password") ?? "");
    const next: { email?: string; password?: string; confirm?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (pw.length < 8) next.password = "Use at least 8 characters.";
    if (pw !== f.get("confirm")) next.confirm = "Passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin + "/onboarding" } });
    setBusy(false);
    if (error) return setErrors({ email: error.message });
    if (data.session) return navigate({ to: "/onboarding" });
    setNotice("Check your email and click the confirmation link. It will bring you straight to profile setup.");
  }

  return (
    <AuthCard title="Create your account" subtitle="Start discovering opportunities that fit you." footer={<>Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email address" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" error={errors.password} />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" error={errors.confirm} />
        <button className={submitBtn} disabled={busy}>{busy ? "Creating account…" : "Create account"}</button>
        {notice && <p className="rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">{notice}</p>}
      </form>
    </AuthCard>
  );
}
