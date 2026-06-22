import "server-only";
import type { Idea, IdeaScores, IdeaSection, Signal } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { SEED_IDEAS } from "./seed";

// Data access for ideas. Reads from Supabase when configured (RLS limits to
// published ideas for normal users); otherwise serves bundled seed ideas so the
// app is fully functional out of the box.

type IdeaRow = {
  slug: string;
  title: string;
  one_liner: string;
  category: string;
  status: "draft" | "published";
  featured_date: string | null;
  created_by_ai: boolean;
  created_at: string;
  idea_sections: (Omit<IdeaSection, "content"> & { content: string; position: number })[];
  idea_scores: IdeaScores | IdeaScores[] | null;
  signals: Signal[];
};

function rowToIdea(row: IdeaRow): Idea {
  const scores = Array.isArray(row.idea_scores) ? row.idea_scores[0] : row.idea_scores;
  return {
    slug: row.slug,
    title: row.title,
    one_liner: row.one_liner,
    category: row.category,
    status: row.status,
    featured_date: row.featured_date,
    created_by_ai: row.created_by_ai,
    created_at: row.created_at,
    scores:
      scores ?? {
        opportunity: 0,
        problem_severity: 0,
        feasibility: 0,
        timing: 0,
        revenue_potential: 0,
        overall: 0,
      },
    sections: (row.idea_sections ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => ({ type: s.type, title: s.title, content: s.content })),
    signals: row.signals ?? [],
  };
}

const SELECT = "*, idea_sections(*), idea_scores(*), signals(*)";

export async function listIdeas(): Promise<Idea[]> {
  if (!isSupabaseConfigured) return SEED_IDEAS.filter((i) => i.status === "published");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ideas")
    .select(SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error || !data || data.length === 0) {
    return SEED_IDEAS.filter((i) => i.status === "published");
  }
  return (data as IdeaRow[]).map(rowToIdea);
}

export async function getIdeaBySlug(slug: string): Promise<Idea | null> {
  if (!isSupabaseConfigured) {
    return SEED_IDEAS.find((i) => i.slug === slug) ?? null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("ideas").select(SELECT).eq("slug", slug).maybeSingle();
  if (error || !data) return SEED_IDEAS.find((i) => i.slug === slug) ?? null;
  return rowToIdea(data as IdeaRow);
}

export async function getIdeaOfTheDay(): Promise<Idea | null> {
  const ideas = await listIdeas();
  if (ideas.length === 0) return null;
  // Prefer the one featured for today, else the most recently featured, else newest.
  const today = new Date().toISOString().slice(0, 10);
  return (
    ideas.find((i) => i.featured_date === today) ??
    ideas
      .filter((i) => i.featured_date)
      .sort((a, b) => (a.featured_date! < b.featured_date! ? 1 : -1))[0] ??
    ideas[0]
  );
}
