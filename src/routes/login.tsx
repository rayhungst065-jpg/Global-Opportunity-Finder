import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard, Field, submitBtn } from "@/components/site/AuthCard";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log In — Opportunity Finder" },
      { name: "description", content: "Log in to your student account." },
      { property: "og:title", content: "Log In — Opportunity Finder" },
      { property: "og:description", content: "Sign in to see your saved opportunities and deadlines." },
    ],
  }),
  component: Login,
});

function Login() {
  const [error, setError] = useState("");
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (!f.get("email") || !f.get("password")) return setError("Enter your email and password.");
    setError("Sign-in isn't switched on yet. It will be connected in the next step.");
  }
  return (
    <AuthCard title="Welcome back" subtitle="Log in to continue." footer={<>New here? <Link to="/signup" className="text-primary hover:underline">Create an account</Link></>}>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email address" name="email" type="email" autoComplete="email" />
        <Field label="Password" name="password" type="password" autoComplete="current-password" />
        <div className="text-right text-sm"><span className="text-muted-foreground">Forgot password? (coming soon)</span></div>
        <button className={submitBtn}>Sign in</button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </AuthCard>
  );
}
