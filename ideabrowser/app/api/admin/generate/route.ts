import { hasAnthropic } from "@/lib/ai/anthropic";
import { generateIdea } from "@/lib/ai/generate-idea";
import { saveIdea } from "@/lib/data/save-idea";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Generate an idea from a seed topic and (optionally) save it.
// NOTE: This is the personal-admin endpoint. Before public launch, gate it
// behind an authenticated admin check (profiles.role = 'admin').
export async function POST(request: Request) {
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
