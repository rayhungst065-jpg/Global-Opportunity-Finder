import { z } from "zod";
import { safeOfficialUrl } from "@/lib/opportunity-source";

export const COLLEGE_DAILY_LIMIT = 2;
export const COLLEGE_RESULT_LIMIT = 3;
export const collegeCriteriaSchema = z.object({
  intended_major: z.string().trim().max(120),
  preferred_regions: z.array(z.string().trim().max(80)).max(7),
  institution_types: z.array(z.string().trim().max(80)).max(5),
  campus_size: z.string().trim().max(80),
  budget_range: z.string().trim().max(80),
  financial_aid_interest: z.boolean(),
}).refine(p => Boolean(p.intended_major || p.preferred_regions.length || p.institution_types.length || p.campus_size || p.budget_range || p.financial_aid_interest), "Select at least one college research criterion.");
export type CollegeCriteria = z.infer<typeof collegeCriteriaSchema>;
export function criteriaKey(p: CollegeCriteria) {
  return JSON.stringify({ ...p, preferred_regions: [...p.preferred_regions].sort(), institution_types: [...p.institution_types].sort() });
}
export const collegeSourceSchema = z.object({ url: z.string(), title: z.string(), excerpts: z.array(z.string()) });
export type CollegeSource = z.infer<typeof collegeSourceSchema>;
export const collegeResultSchema = z.object({
  institution: z.string(), institution_evidence: z.string(), source_url: z.string(), official_source: z.boolean(),
  facts: z.array(z.object({ label: z.string(), value: z.string(), evidence: z.string() })).max(6),
  fit: z.string(), missing_information: z.array(z.string()).max(8), checked_at: z.string(),
});
export type CollegeResult = z.infer<typeof collegeResultSchema>;
export function validateCollegeEvidence(rows: CollegeResult[], sources: CollegeSource[], checkedAt: string) {
  const seen = new Set<string>();
  return rows.flatMap(r => {
    const url = safeOfficialUrl(r.source_url);
    const source = sources.find(s => safeOfficialUrl(s.url) === url);
    const text = source?.excerpts.join("\n") ?? "";
    if (!url || !source || !r.official_source || !r.institution || !r.institution_evidence || !text.includes(r.institution_evidence) || !r.institution_evidence.includes(r.institution) || seen.has(r.institution.toLowerCase())) return [];
    seen.add(r.institution.toLowerCase());
    return [{ ...r, source_url: url, checked_at: checkedAt, facts: r.facts.filter(f => f.value && f.evidence && text.includes(f.evidence) && f.evidence.includes(f.value)) }];
  }).slice(0, COLLEGE_RESULT_LIMIT);
}

export const generalLiveSearchUnavailable = () => ({ available: false as const, results: [], message: "Live opportunity search is disabled. Use saved catalog records and confirm their official sources. College Search uses the imported spreadsheet database only." });
