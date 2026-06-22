import { hasAnthropic } from "@/lib/ai/anthropic";
import { generateIdea } from "@/lib/ai/generate-idea";
import { saveIdea } from "@/lib/data/save-idea";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// A rotating pool of seed themes for the daily Idea of the Day. In production,
// pull from a topic queue or a Claude brainstorm step instead.
const SEED_THEMES = [
  "AI tools for home-services businesses",
  "compliance automation for small clinics",
  "creator monetization for niche communities",
  "vertical SaaS for independent professionals",
  "AI agents for back-office operations",
  "tools that turn expertise into productized services",
  "data infrastructure for small e-commerce brands",
];

function pickSeed(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
  );
  return SEED_THEMES[dayOfYear % SEED_THEMES.length];
}

// Daily generation: protected by CRON_SECRET. Wire to a scheduler (Vercel Cron
// or Supabase scheduled function) hitting GET/POST with the bearer token.
async function handle(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  if (!hasAnthropic()) {
    return Response.json({ error: "ANTHROPIC_API_KEY is not configured." }, { status: 503 });
  }

  try {
    const idea = await generateIdea(pickSeed());
    const saved = await saveIdea(idea, { publish: true, featureToday: true });
    return Response.json({ ok: true, slug: idea.slug, saved });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
