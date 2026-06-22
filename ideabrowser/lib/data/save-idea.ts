import "server-only";
import type { Idea } from "@/lib/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/server";

// Persist a generated idea (sections, scores, signals) using the service-role
// client. Returns true if saved, false if Supabase isn't configured (preview-only).
export async function saveIdea(
  idea: Idea,
  opts: { publish?: boolean; featureToday?: boolean } = {},
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  const supabase = createServiceClient();
  const status = opts.publish ? "published" : "draft";
  const featured_date = opts.featureToday ? new Date().toISOString().slice(0, 10) : null;

  const { data: ideaRow, error } = await supabase
    .from("ideas")
    .insert({
      slug: idea.slug,
      title: idea.title,
      one_liner: idea.one_liner,
      category: idea.category,
      status,
      featured_date,
      created_by_ai: idea.created_by_ai,
    })
    .select("id")
    .single();

  if (error || !ideaRow) throw new Error(error?.message ?? "Failed to insert idea");
  const ideaId = ideaRow.id as string;

  await supabase.from("idea_scores").insert({ idea_id: ideaId, ...idea.scores });

  if (idea.sections.length > 0) {
    await supabase.from("idea_sections").insert(
      idea.sections.map((s, position) => ({
        idea_id: ideaId,
        type: s.type,
        title: s.title,
        content: s.content,
        position,
      })),
    );
  }

  if (idea.signals.length > 0) {
    await supabase.from("signals").insert(
      idea.signals.map((s) => ({
        idea_id: ideaId,
        source: s.source,
        metric: s.metric,
        value: s.value,
        detail: s.detail ?? null,
      })),
    );
  }

  return true;
}
