import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "");
    const pw = String(f.get("password") ?? "");
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (pw.length < 8) next.password = "Use at least 8 characters.";
    if (pw !== f.get("confirm")) next.confirm = "Passwords don't match.";
    setErrors(next);
    // Real account creation is connected in the next build step — no fake success.
    if (!Object.keys(next).length) setNotice("Accounts aren't switched on yet. This form will create real accounts in the next step.");
  }

  return (
    <AuthCard title="Create your account" subtitle="Start discovering opportunities that fit you." footer={<>Already have an account? <Link to="/login" className="text-primary hover:underline">Log in</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email address" name="email" type="email" autoComplete="email" error={errors.email} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" error={errors.password} />
        <Field label="Confirm password" name="confirm" type="password" autoComplete="new-password" error={errors.confirm} />
        <button className={submitBtn}>Create account</button>
        {notice && <p className="rounded-xl bg-primary-soft p-3 text-sm text-accent-foreground">{notice}</p>}
      </form>
    </AuthCard>
  );
}
