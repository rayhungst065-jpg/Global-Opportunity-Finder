import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthCard, Field } from "@/components/site/AuthCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { validateNewPassword } from "@/lib/password-rules";

export const Route = createFileRoute("/reset-password")({ head: () => ({ meta: [
  { title: "Reset Password — Global Opportunity Finder" },
  { name: "description", content: "Set a new password after verifying your secure recovery link." },
  { property: "og:title", content: "Reset Password — Global Opportunity Finder" },
  { property: "og:description", content: "Securely reset your student account password." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: ResetPassword });
function ResetPassword() {
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const { data } = supabase.auth.onAuthStateChange(event => { if (active && event === "PASSWORD_RECOVERY") { setReady(true); setChecked(true); } });
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    async function verify() {
      try {
        if (query.get("token_hash") && query.get("type") === "recovery") {
          const tokenHash = query.get("token_hash");
          if (tokenHash) { const r = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" }); if (active && !r.error) setReady(true); }
        } else if (query.get("code")) {
          const code = query.get("code");
          if (code) { const r = await supabase.auth.exchangeCodeForSession(code); if (active && !r.error) setReady(true); }
        } else if (hash.get("type") === "recovery") {
          const r = await supabase.auth.getUser(); if (active && !r.error && r.data.user) setReady(true);
        }
      } finally { if (active) setChecked(true); }
    }
    void verify();
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  return <AuthCard title={done ? "Password updated" : "Set a new password"} subtitle={done ? "You can now sign in with your new password." : "Verify your recovery link, then choose a new password."} footer={<Link to="/login" className="text-primary hover:underline">Back to sign in</Link>}>
    {done ? <p role="status">Your password has been reset.</p> : !checked ? <p>Verifying your link…</p> : !ready ? <p role="alert">This recovery link is invalid or expired. <Link to="/forgot-password" className="text-primary hover:underline">Request a new link</Link>.</p> : <form className="space-y-4" onSubmit={async e => {
      e.preventDefault(); const f = new FormData(e.currentTarget); const password = String(f.get("password") ?? "");
      const validation = validateNewPassword(password, String(f.get("confirmation") ?? ""));
      if (validation) { setError(validation); return; }
      setBusy(true); setError("");
      try { const r = await supabase.auth.updateUser({ password }); if (r.error) setError(r.error.message); else { await supabase.auth.signOut(); setDone(true); } }
      catch { setError("Your password could not be updated. Please request a new recovery link."); }
      finally { setBusy(false); }
    }}><Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} required /><Field label="Confirm new password" name="confirmation" type="password" autoComplete="new-password" minLength={8} required /><Button className="w-full" type="submit" disabled={busy}>{busy ? "Updating…" : "Reset password"}</Button>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</form>}
  </AuthCard>;
}