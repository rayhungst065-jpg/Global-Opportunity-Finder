export const interestOptions = [
  "Engineering & robotics",
  "Computer science & AI",
  "Environmental science & sustainability",
  "Biomedical science",
  "Business & entrepreneurship",
  "Arts, design & media",
  "Community service & volunteering",
  "Research & innovation",
  "Leadership & international relations",
];

export const goalOptions = [
  "Find research programs",
  "Join competitions",
  "Find teammates for a project",
  "Discover volunteering opportunities",
  "Apply for awards & scholarships",
  "Join an academic community",
  "Find students with similar interests",
  "Take part in cultural exchange",
];

export type Visibility = {
  avatar: boolean; bio: boolean; country_region: boolean; education: boolean; major: boolean;
  languages: boolean; interests: boolean; skills: boolean; goals: boolean;
};

export const visibilityFields: { key: keyof Visibility; label: string }[] = [
  { key: "avatar", label: "Profile picture" },
  { key: "bio", label: "Short bio" },
  { key: "country_region", label: "Country" },
  { key: "education", label: "Education level & grade" },
  { key: "major", label: "Intended major" },
  { key: "languages", label: "Languages" },
  { key: "interests", label: "Interests" },
  { key: "skills", label: "Skills & topics" },
  { key: "goals", label: "Goals" },
];

export const defaultVisibility: Visibility = {
  avatar: true, bio: true, country_region: false, education: true, major: true,
  languages: true, interests: true, skills: true, goals: true,
};

export function readVisibility(v: unknown): Visibility {
  return { ...defaultVisibility, ...(v && typeof v === "object" ? (v as Partial<Visibility>) : {}) };
}
