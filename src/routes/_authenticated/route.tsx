import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  useEffect(() => {
    // One check per browser session; the server guarantees the email is sent at most once per account.
    const key = "gof-welcome-checked";
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    sendWelcome().catch(() => sessionStorage.removeItem(key));
  }, [sendWelcome]);
  return <Outlet />;
}
