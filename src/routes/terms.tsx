import { createFileRoute, Link } from "@tanstack/react-router";
import { SimplePage } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — Global Opportunity Finder" },
      { name: "description", content: "Terms covering accounts, opportunity information, student communities and AI assistance on Global Opportunity Finder." },
      { property: "og:title", content: "Terms of Use — Global Opportunity Finder" },
      { property: "og:description", content: "Responsible use, opportunity verification, community content and AI limitations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <SimplePage eyebrow="Last updated: 17 October 2026" title="Terms of Use">
      <p className="border-l-4 border-coral pl-4 text-base">Implementation-based draft, not legally reviewed. These terms are not a claim of legal compliance. The operator, contact details, age rules and governing jurisdiction must be confirmed before public launch.</p>
      <h2 className="text-2xl font-semibold text-foreground">1. The service</h2>
      <p>Global Opportunity Finder is a student Capstone project for discovering opportunities, saving items, exploring communities, connecting with students and preparing opportunity plans. It is not an organizer, university admissions office, application service or professional adviser. Features and catalog coverage may change or be incomplete.</p>
      <h2 className="text-2xl font-semibold text-foreground">2. Accounts and student eligibility</h2>
      <p>Provide accurate information relevant to your use of the service, protect your sign-in details and do not impersonate another person. Do not share passwords or use someone else's account. Email confirmation is part of the account flow. A minimum-age requirement, guardian-consent process and operator contact have not yet been established; this draft does not authorize launch to minors without those decisions and appropriate review.</p>
      <h2 className="text-2xl font-semibold text-foreground">3. Opportunity information</h2>
      <p>Listings are for discovery only. Always check eligibility, deadlines, fees, location, application status and requirements on the organizer's official website before applying. Labeled demo records are illustrative and must not be treated as real offers. A listing, recommendation, saved item or community approval is not an endorsement or guarantee of safety, admission, funding, selection or acceptance.</p>
      <h2 className="text-2xl font-semibold text-foreground">4. AI assistance</h2>
      <p>The Opportunity Assistant uses AI to discuss interests, catalog opportunities, eligibility questions and application plans. Parallel search retrieves official sources, but source checks do not guarantee current availability, eligibility or accuracy. Unknown or unverified details must be checked independently. AI does not replace legal, financial, medical or admissions advice and must not be relied on for high-stakes decisions.</p>
      <p>Your conversations and selected preferences are processed as described in the Privacy Policy. Do not paste credentials, identification records or sensitive information. Starting a new chat retains older history. Saving a catalog item requires approval; the assistant does not submit applications, edit the shared catalog or provide automatic deadline reminders.</p>
      <h2 className="text-2xl font-semibold text-foreground">5. Communities and acceptable conduct</h2>
      <p>Use profiles, posts, proposals, connection requests and collaboration groups respectfully. Do not harass, threaten, discriminate, spam, scam, share unlawful material, impersonate people, publish someone else's private information or infringe intellectual-property rights. Do not attempt to bypass access restrictions, scrape private student data or interfere with the service. Student discovery is optional. Review privacy limitations before sharing profile information or pictures.</p>
      <p>Community proposals require administrator review before publication. Approval does not independently verify an organizer or guarantee a community's quality. Private-group participation depends on membership and invitation rules. Direct messaging, user blocking/reporting, notifications and self-service account deletion are not implemented; no immediate response or safety-reporting mechanism is promised.</p>
      <h2 className="text-2xl font-semibold text-foreground">6. Your content and external services</h2>
      <p>Submit only material you have the right to share. Your posts and community content are displayed to the audiences described in the Privacy Policy; do not assume submitted content is private. We do not claim ownership of student work in this draft. A legally reviewed content-use license and removal process still need to be confirmed by the operator.</p>
      <p>External organizers and linked websites have their own terms and privacy practices. Check them before providing information, paying fees or applying. The service cannot control their content, availability or decisions. No purchase, refund or subscription terms are established here.</p>
      <h2 className="text-2xl font-semibold text-foreground">7. Availability, enforcement and legal limits</h2>
      <p>The website is under development and may have interruptions, errors or missing data. Administrator-only controls exist for reviewing community proposals and managing opportunity data. A formal moderation, appeals, account-suspension and deletion process has not been supplied. These terms do not waive mandatory rights or invent liability exclusions, indemnities, arbitration clauses or a governing law. Those provisions require an identified operator and qualified legal review.</p>
      <h2 className="text-2xl font-semibold text-foreground">8. Contact and changes</h2>
      <p>A working operator contact and dispute/request channel must be added before public launch. Current Support and Contact pages are informational, not a functioning submission service. Review the updated date when these terms change. Material changes should be communicated appropriately once the operator establishes that process.</p>
      <p className="text-base"><Link to="/privacy" className="text-primary underline">Read the Privacy Policy</Link></p>
    </SimplePage>
  ),
});
