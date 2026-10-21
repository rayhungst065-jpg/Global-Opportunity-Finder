import volunteer from "@/assets/volunteer-tree-planting.png.asset.json";
import competitions from "@/assets/competitions.jpg";
import research from "@/assets/research.jpg";
import awards from "@/assets/awards.jpg";

/** The four opportunity categories, shared by the landing and categories pages. */
export const categories = [
  {
    key: "volunteer",
    name: "Volunteer",
    tagline: "Make an impact that matters.",
    text: "Find community service, environmental projects, and nonprofit work — locally or online.",
    image: volunteer,
  },
  {
    key: "competitions",
    name: "Competitions",
    tagline: "Test what you can build.",
    text: "Discover olympiads, hackathons, robotics, writing, and design challenges around the world.",
    image: competitions,
  },
  {
    key: "research",
    name: "Research",
    tagline: "Ask bigger questions.",
    text: "Explore summer research programs, lab internships, and mentorships for curious students.",
    image: research,
  },
  {
    key: "awards",
    name: "Awards & Scholarships",
    tagline: "Get recognized for your work.",
    text: "Browse scholarships and awards that support your education and celebrate your achievements.",
    image: awards,
  },
] as const;
