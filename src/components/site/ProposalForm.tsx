import { useState } from "react";
import { communityCategories } from "@/lib/communities.functions";
import type { Database } from "@/integrations/supabase/types";

export type ProposalValues = {
  name: string; category: string; topic: string; purpose: string; problem: string;
  short_term_goals: string; long_term_goals: string; activities: string; participants: string;
  format: "online" | "in_person" | "hybrid"; meeting_frequency: string; description: string; rules: string;
};

type ProposalRow = Database["public"]["Tables"]["community_proposals"]["Row"];

export function proposalToValues(p: ProposalRow): ProposalValues {
  return {
    name: p.name, category: p.category, topic: p.topic, purpose: p.purpose, problem: p.problem ?? "",
    short_term_goals: p.short_term_goals ?? "", long_term_goals: p.long_term_goals ?? "",
    activities: p.activities ?? "", participants: p.participants ?? "",
    format: (p.format as ProposalValues["format"]) ?? "online",
    meeting_frequency: p.meeting_frequency ?? "", description: p.description, rules: p.rules ?? "",
  };
}

export const emptyProposal: ProposalValues = {
  name: "", category: communityCategories[0], topic: "", purpose: "", problem: "",
  short_term_goals: "", long_term_goals: "", activities: "", participants: "",
  format: "online", meeting_frequency: "", description: "", rules: "",
};

const input = "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const label = "mb-1 block text-sm font-medium";
const hint = "mt-1 text-xs text-muted-foreground";

export function ProposalForm({
  initial, submitting, submitLabel, onSubmit,
}: {
  initial: ProposalValues;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (v: ProposalValues) => void;
}) {
  const [v, setV] = useState(initial);
  const set = <K extends keyof ProposalValues>(k: K, val: ProposalValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const field = (key: keyof ProposalValues, text: string, help: string, rows = 3) => (
    <div>
      <label className={label} htmlFor={key}>{text}</label>
      <textarea id={key} className={input} rows={rows} value={v[key] as string} onChange={(e) => set(key, e.target.value)} />
      <p className={hint}>{help}</p>
    </div>
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className={label} htmlFor="name">Group name</label>
          <input id="name" className={input} required maxLength={120} value={v.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className={label} htmlFor="category">Category</label>
          <select id="category" className={input} value={v.category} onChange={(e) => set("category", e.target.value)}>
            {communityCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={label} htmlFor="topic">Main topic</label>
        <input id="topic" className={input} required maxLength={200} value={v.topic} onChange={(e) => set("topic", e.target.value)} />
        <p className={hint}>One sentence, e.g. "Students building autonomous robots for competitions".</p>
      </div>

      {field("purpose", "Purpose", "Why should this group exist? What is it for?")}
      {field("problem", "Problem or goal", "What problem or goal does the group want to address?")}
      <div className="grid gap-6 md:grid-cols-2">
        {field("short_term_goals", "Short-term goals", "What should happen in the first few months?")}
        {field("long_term_goals", "Long-term goals", "Where should the group be in a year or more?")}
      </div>
      {field("activities", "Planned activities", "Projects, workshops, discussions, competitions…")}
      {field("participants", "Intended participants & useful skills", "Who is this group for? What skills help?", 2)}

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className={label} htmlFor="format">Format</label>
          <select id="format" className={input} value={v.format} onChange={(e) => set("format", e.target.value as ProposalValues["format"])}>
            <option value="online">Online</option>
            <option value="in_person">In person</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div>
          <label className={label} htmlFor="meeting_frequency">Meeting frequency (optional)</label>
          <input id="meeting_frequency" className={input} maxLength={200} placeholder="e.g. Weekly, Sundays 17:00 UTC" value={v.meeting_frequency} onChange={(e) => set("meeting_frequency", e.target.value)} />
        </div>
      </div>

      {field("description", "Description", "What prospective members will see in the directory.", 4)}
      {field("rules", "Proposed community rules", "Respect, academic honesty, no spam — your group's ground rules.", 4)}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
