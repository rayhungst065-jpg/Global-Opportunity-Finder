import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/lib/auth";
import { sendWelcomeEmailOnce } from "@/lib/welcome-email.functions";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const sendWelcome = useServerFn(sendWelcomeEmailOnce);
  const qc = useQueryClient();
  const { user } = useUser();
  // If the signed-in account changes without using the app's sign-out button
  // (expired session, token refresh, another tab), drop every cached query so
  // no previous account's personal data can show through.
  const seenUser = useRef<string | null>(null);
  useEffect(() => {
    if (!user) return;
    if (seenUser.current && seenUser.current !== user.id) qc.clear();
    seenUser.current = user.id;
  }, [user, qc]);
  useEffect(() => {
    // One check per browser session; the server guarantees the email is sent at most once per account.
    const key = "gof-welcome-checked";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    sendWelcome().catch(() => sessionStorage.removeItem(key));
  }, [sendWelcome]);
  return <Outlet />;
}
