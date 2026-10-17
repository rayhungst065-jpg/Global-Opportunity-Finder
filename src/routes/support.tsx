import { createFileRoute, Link } from "@tanstack/react-router";
import { SimplePage } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Global Opportunity Finder" },
      { name: "description", content: "Help with profiles, opportunities, connections, and account settings." },
      { property: "og:title", content: "Support — Global Opportunity Finder" },
      { property: "og:description", content: "How can we help?" },
    ],
  }),
  component: () => (
    <SimplePage eyebrow="Support" title="How Can We Help?">
      <p>
        Have a question about discovering opportunities, managing your profile, saving listings, or using student
        collaboration features? Start with the resources below.
      </p>

      <h2 className="font-display text-2xl font-semibold text-foreground">Using the Platform</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Create and update your profile from <Link to="/profile" className="text-primary hover:underline">your profile page</Link> —
          add your education level, interests, intended major, and goals.
        </li>
        <li>
          Explore opportunities on the <Link to="/opportunities" className="text-primary hover:underline">Browse page</Link> and
          save the ones you care about with the bookmark button.
        </li>
        <li>
          Track upcoming deadlines from your <Link to="/deadlines" className="text-primary hover:underline">Deadlines page</Link> and
          adjust your preferences in <Link to="/settings" className="text-primary hover:underline">Settings</Link>.
        </li>
      </ul>

      <h2 className="font-display text-2xl font-semibold text-foreground">Student Connections and Communities</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Discover approved communities on the <Link to="/communities" className="text-primary hover:underline">Communities page</Link> —
          every new community is reviewed by an administrator before it goes public.
        </li>
        <li>
          Create a post from the Posts tab on the Communities page to find teammates for competitions, research, and projects.
        </li>
        <li>
          Manage connection requests from <Link to="/meet-students" className="text-primary hover:underline">Meet Students</Link> —
          accept, decline, cancel, or remove connections there.
        </li>
      </ul>

      <h2 className="font-display text-2xl font-semibold text-foreground">Account and Privacy</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          Control whether other students can discover your profile, and choose field-by-field what they see, in{" "}
          <Link to="/settings" className="text-primary hover:underline">Settings → Privacy</Link>.
        </li>
        <li>Update your password and account details in Settings → Account.</li>
        <li>
          Reporting a concern: a dedicated reporting tool is not yet available. Until it is, you can remove a connection
          or leave a group at any time.
        </li>
      </ul>

      <h2 className="font-display text-2xl font-semibold text-foreground">Contact Support</h2>
      <p>
        A support email and contact form are not configured yet, so there is no direct contact channel at this time.
        This section will be updated when one is available.
      </p>
    </SimplePage>
  ),
});
