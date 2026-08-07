import { hasAnthropic } from "@/lib/ai/anthropic";
import { generateIdea } from "@/lib/ai/generate-idea";
import { saveIdea } from "@/lib/data/save-idea";
import { isAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Generate an idea from a seed topic and (optionally) save it. Admin-only once
// Supabase is configured; open in local seed-data mode (nothing to protect).
export async function POST(request: Request) {
  if (isSupabaseConfigured && !(await isAdmin())) {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }
  if (!hasAnthropic()) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 503 });
  }

  const { seed, publish } = (await request.json()) as { seed?: string; publish?: boolean };
  if (!seed || seed.trim().length < 3) {
    return Response.json({ error: "Provide a seed topic." }, { status: 400 });
  }

  try {
    const idea = await generateIdea(seed.trim());
    const saved = await saveIdea(idea, { publish: publish ?? true, featureToday: false });
    return Response.json({ idea, saved });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}
