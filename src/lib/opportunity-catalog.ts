import type { Json } from "@/integrations/supabase/types";

/** Catalog-only options; leave the existing four homepage image sections intact. */
export const catalogCategories = [
  { key: "volunteer", name: "Volunteer" },
  { key: "competitions", name: "Competition" },
  { key: "cultural_exchange", name: "Cultural Exchange" },
  { key: "research", name: "Research" },
  { key: "leadership", name: "Leadership" },
  { key: "education", name: "Education" },
] as const;

export const catalogCategoryKeys = ["volunteer", "competitions", "cultural_exchange", "research", "leadership", "education", "awards"] as const;

export function sourceField(record: Json | null | undefined, field: string): string | undefined {
  if (!record || typeof record !== "object" || Array.isArray(record)) return undefined;
  const value = record[field];
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function opportunitySummary(o: { description: string; source_record?: Json | null }) {
  return sourceField(o.source_record, "Short Description") ?? o.description;
}

export function opportunityAvailability(o: { description: string; source_record?: Json | null }) {
  return o.source_record || o.description.includes("Application status unverified") ? "Not confirmed" : undefined;
}