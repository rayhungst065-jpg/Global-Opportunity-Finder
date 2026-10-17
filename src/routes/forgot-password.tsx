import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AuthCard, Field } from "@/components/site/AuthCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({ head: () => ({ meta: [
  { title: "Password Recovery — Global Opportunity Finder" },
  { name: "description", content: "Request a secure password recovery email for your student account." },
  { property: "og:title", content: "Password Recovery — Global Opportunity Finder" },
  { property: "og:description", content: "Recover access to your Global Opportunity Finder account." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: ForgotPassword });
function ForgotPassword() {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  return <AuthCard title="Forgot your password?" subtitle="Enter your email to request a secure reset link." footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}>
    {sent ? <p role="status">If an account is eligible for recovery, you’ll receive a password-reset email. Check your inbox and spam folder.</p> : <form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); setBusy(true); setError("");
      const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
      try {
        const result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (result.error) setError("We couldn’t process this request right now. Please try again later.");
        else setSent(true);
      } catch { setError("We couldn’t process this request right now. Please try again later."); }
      finally { setBusy(false); }
    }}><Field label="Email address" name="email" type="email" autoComplete="email" required /><Button type="submit" className="w-full" disabled={busy}>{busy ? "Requesting…" : "Send reset link"}</Button>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</form>}
  </AuthCard>;
}