import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "@/components/site/SiteLayout";
import { ProfileForm } from "@/components/site/ProfileForm";
import { useUser } from "@/lib/auth";
import { useProfile } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set Up Your Profile — Global Opportunity Finder" },
      { name: "description", content: "Tell us about your studies and interests to get matched with opportunities." },
      { property: "og:title", content: "Set Up Your Profile — Global Opportunity Finder" },
      { property: "og:description", content: "A few quick, optional questions to personalize your matches." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = useUser();
  const profile = useProfile(user?.id);
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Logo />
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Homepage</Link>
      </div>
      <div className="mx-auto max-w-2xl px-5 pb-20 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Let's personalize your matches</h1>
        <p className="mt-2 text-muted-foreground">We never ask for your home address or school ID.</p>
        <div className="mt-8">
          {!user || profile.isLoading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <ProfileForm stepped userId={user.id} profile={profile.data ?? null} onDone={() => navigate({ to: "/dashboard" })} />
          )}
        </div>
      </div>
    </div>
  );
}
