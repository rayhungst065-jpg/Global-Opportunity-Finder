import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Sends the one-time welcome email to the signed-in user after their email is confirmed.
 * A server-only `welcome_emails` row claims the send so retries/refreshes/logins never duplicate it.
 */
export const sendWelcomeEmailOnce = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: userData, error: userError } = await context.supabase.auth.getUser();
    const user = userData.user;
    if (userError || !user || user.id !== context.userId) return { status: "skipped" as const };
    if (!user.email || !user.email_confirmed_at) return { status: "not_confirmed" as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from("welcome_emails")
      .upsert({ user_id: user.id }, { onConflict: "user_id", ignoreDuplicates: true })
      .select("user_id");
    if (claimError) throw new Error("Could not prepare the welcome email.");
    if (!claimed?.length) return { status: "already_sent" as const };

    try {
      const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
      const result = await sendTemplateEmail("welcome", user.email, { idempotencyKey: `welcome-${user.id}` });
      return { status: result.sent ? ("sent" as const) : ("suppressed" as const) };
    } catch (error) {
      // Release the claim so a later sign-in can retry; the idempotency key still prevents duplicates.
      await supabaseAdmin.from("welcome_emails").delete().eq("user_id", user.id);
      console.error("Welcome email failed", error instanceof Error ? error.message : error);
      return { status: "failed" as const };
    }
  });
