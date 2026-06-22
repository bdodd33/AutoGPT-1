// Shared domain types for IdeaBrowser. These mirror the Postgres schema in
// supabase/migrations/0001_init.sql and the AI generation output in lib/ai/schema.ts.

export type SectionType =
  | "summary"
  | "value_ladder"
  | "why_now"
  | "proof_signals"
  | "market_gap"
  | "execution_plan"
  | "value_equation"
  | "value_matrix"
  | "acp"
  | "community_signals"
  | "keywords";

// Display order + human labels for the deep-dive sections.
export const SECTION_ORDER: { type: SectionType; label: string }[] = [
  { type: "summary", label: "Summary" },
  { type: "why_now", label: "Why Now" },
  { type: "proof_signals", label: "Proof Signals" },
  { type: "market_gap", label: "Market Gap" },
  { type: "value_ladder", label: "Value Ladder" },
  { type: "value_equation", label: "Value Equation" },
  { type: "value_matrix", label: "Value Matrix" },
  { type: "acp", label: "Audience · Community · Product" },
  { type: "execution_plan", label: "Execution Plan" },
  { type: "community_signals", label: "Community Signals" },
  { type: "keywords", label: "Keywords" },
];

export interface IdeaScores {
  opportunity: number; // 1-10
  problem_severity: number; // 1-10
  feasibility: number; // 1-10
  timing: number; // 1-10
  revenue_potential: number; // 1-10
  overall: number; // 1-10
}

export interface IdeaSection {
  type: SectionType;
  title: string;
  content: string; // lightweight markdown (headings, bullets, **bold**, tables)
}

export interface Signal {
  source: "reddit" | "trends" | "youtube" | "other";
  metric: string;
  value: string;
  detail?: string;
}

export interface Idea {
  slug: string;
  title: string;
  one_liner: string;
  category: string;
  status: "draft" | "published";
  featured_date: string | null; // YYYY-MM-DD when it was Idea of the Day
  created_by_ai: boolean;
  scores: IdeaScores;
  sections: IdeaSection[];
  signals: Signal[];
  created_at: string;
}

export const SCORE_LABELS: Record<keyof IdeaScores, string> = {
  opportunity: "Opportunity",
  problem_severity: "Problem",
  feasibility: "Feasibility",
  timing: "Timing",
  revenue_potential: "Revenue",
  overall: "Overall",
};
