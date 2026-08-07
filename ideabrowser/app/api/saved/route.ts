import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Toggle a bookmark on an idea for the signed-in user. RLS scopes writes to the
// caller, so the user-session client is all we need.
export async function POST(request: Request) {
  if (!isSupabaseConfigured) {
    return Response.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Sign in to save ideas." }, { status: 401 });
  }

  const { slug, save } = (await request.json()) as { slug?: string; save?: boolean };
  if (!slug) return Response.json({ error: "Missing slug." }, { status: 400 });

  const { data: idea } = await supabase.from("ideas").select("id").eq("slug", slug).maybeSingle();
  if (!idea) return Response.json({ error: "Idea not found." }, { status: 404 });

  if (save) {
    const { error } = await supabase
      .from("saved_ideas")
      .upsert({ user_id: user.id, idea_id: idea.id });
    if (error) return Response.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("saved_ideas")
      .delete()
      .eq("user_id", user.id)
      .eq("idea_id", idea.id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ saved: Boolean(save) });
}
