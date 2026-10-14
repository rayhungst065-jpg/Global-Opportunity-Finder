import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WorkspaceShell, Panel, useSignOut } from "@/components/site/WorkspaceShell";
import { Field, submitBtn } from "@/components/site/AuthCard";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Opportunity Finder" },
      { name: "description", content: "Manage your account settings." },
      { property: "og:title", content: "Settings — Opportunity Finder" },
      { property: "og:description", content: "Account settings." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const { user } = useUser();
  const signOut = useSignOut();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const current = String(f.get("current") ?? "");
    const pw = String(f.get("password") ?? "");
    if (pw.length < 8) return setMsg({ ok: false, text: "Use at least 8 characters." });
    const { error } = await supabase.auth.updateUser({ password: pw, current_password: current } as never);
    if (error) return setMsg({ ok: false, text: error.message });
    form.reset();
    setMsg({ ok: true, text: "Password updated." });
  }
  return (
    <WorkspaceShell title="Settings">
      <div className="grid max-w-2xl gap-6">
        <Panel title="Account"><p className="text-sm text-muted-foreground">Signed in as <span className="text-foreground">{user?.email}</span></p></Panel>
        <Panel title="Change password">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Current password" name="current" type="password" autoComplete="current-password" />
            <Field label="New password" name="password" type="password" autoComplete="new-password" />
            <button className={submitBtn}>Update password</button>
            {msg && <p className={`text-sm ${msg.ok ? "text-primary" : "text-destructive"}`}>{msg.text}</p>}
          </form>
        </Panel>
        <Panel title="Log out"><button onClick={signOut} className="rounded-full border border-border px-5 py-2 text-sm hover:bg-accent">Log out of this device</button></Panel>
      </div>
    </WorkspaceShell>
  );
}
