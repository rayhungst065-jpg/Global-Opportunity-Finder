import { createFileRoute, Link } from "@tanstack/react-router";
import { SimplePage } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Global Opportunity Finder" },
      { name: "description", content: "Help with profiles, opportunities, connections, and account settings." },
      { property: "og:title", content: "Support — Global Opportunity Finder" },
      { property: "og:description", content: "How can we help?" },
          { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
        Have a question, an idea, or feedback about Global Opportunity Finder? I'd love to hear from you!
      </p>
      <p>
        If you have suggestions, notice something that isn't working, or think of a feature that could make the website more useful, please fill out the feedback form below. Your thoughts help me understand what students need and how I can make the platform better.
      </p>
      <p>
        Have a question? You can also email me directly at <a href="mailto:rayhung.st065@gmail.com" className="text-primary hover:underline">rayhung.st065@gmail.com</a>.
      </p>
      <p>Thanks for taking the time to help Global Opportunity Finder grow!</p>
      <Button asChild className="h-auto whitespace-normal rounded-full px-6 py-3">
        <a href="https://docs.google.com/forms/d/e/1FAIpQLSfy3uApWLq08xozFrzsD8XIsAoGr5t-4s9p5UZgAGV279iV9w/viewform" target="_blank" rel="noopener noreferrer">Share Your Feedback</a>
      </Button>
    </SimplePage>
  ),
});
