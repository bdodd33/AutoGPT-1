import type Anthropic from "@anthropic-ai/sdk";
import type { Idea, IdeaScores, IdeaSection, Signal } from "@/lib/types";
import { SECTION_ORDER } from "@/lib/types";
import { gatherSignals } from "@/lib/signals";
import { GENERATION_MODEL, getAnthropic } from "./anthropic";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

// Pull the first balanced JSON object out of a model response.
function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return JSON.parse(text.slice(start, end + 1));
}

function buildPrompt(seed: string, signals: Signal[]): string {
  const signalText =
    signals.length > 0
      ? signals
          .map((s) => `- [${s.source}] ${s.metric}: ${s.value}${s.detail ? ` (${s.detail})` : ""}`)
          .join("\n")
      : "(no live signals available — reason from your own knowledge)";

  const sectionList = SECTION_ORDER.map((s) => `"${s.type}"`).join(", ");

  return `You are a world-class startup analyst. Produce a deeply-researched business idea
based on the seed topic below, condensing what would be 50+ hours of research into a
focused brief. Ground your analysis in the real-data signals provided where relevant.

SEED TOPIC: ${seed}

LIVE SIGNALS:
${signalText}

Return ONLY a JSON object (no markdown fences, no prose) with exactly this shape:
{
  "title": "punchy product name / idea title",
  "one_liner": "one sentence describing the business",
  "category": "a short category label (e.g. 'B2B SaaS', 'Creator Tools', 'Healthcare')",
  "scores": {
    "opportunity": 1-10 integer,
    "problem_severity": 1-10 integer,
    "feasibility": 1-10 integer,
    "timing": 1-10 integer,
    "revenue_potential": 1-10 integer,
    "overall": 1-10 integer
  },
  "sections": [
    { "type": one of [${sectionList}], "title": "human label", "content": "markdown body" }
  ]
}

Requirements:
- Provide one section object for EACH of these types: ${sectionList}.
- "summary": 2-3 paragraph overview of the opportunity.
- "why_now": the timing/tailwinds that make this viable today.
- "proof_signals": concrete evidence of demand (tie to the live signals above).
- "market_gap": who is underserved and why incumbents miss them.
- "value_ladder": monetization tiers from free → premium with price points (use a markdown list or table).
- "value_equation": dream outcome, perceived likelihood, time delay, effort/sacrifice (Hormozi framing).
- "value_matrix": a markdown table comparing this idea vs 2-3 alternatives across key dimensions.
- "acp": the Audience, the Community to reach them, and the Product wedge.
- "execution_plan": a numbered 0-90 day plan with budget and first hires/tools.
- "community_signals": where the audience already congregates (subreddits, forums, Discords).
- "keywords": a markdown table of 5-8 search keywords with rough intent/competition notes.
- Content fields use lightweight markdown: ### headings, - bullets, **bold**, and | tables |.
- Be specific and numeric. Avoid generic filler.`;
}

// Generate one fully-formed idea (as a draft). Enriches with real signals first.
export async function generateIdea(seed: string): Promise<Idea> {
  const signals = await gatherSignals(seed);
  const client = getAnthropic();

  // Stream so a large response doesn't hit HTTP timeouts; collect the final text.
  const stream = client.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: 16000,
    messages: [{ role: "user", content: buildPrompt(seed, signals) }],
  });
  const message = await stream.finalMessage();
  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const parsed = extractJson(text) as {
    title: string;
    one_liner: string;
    category?: string;
    scores: IdeaScores;
    sections: IdeaSection[];
  };

  const title = parsed.title?.trim() || seed;
  const now = new Date().toISOString();

  return {
    slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    one_liner: parsed.one_liner?.trim() || "",
    category: parsed.category?.trim() || "General",
    status: "draft",
    featured_date: null,
    created_by_ai: true,
    scores: parsed.scores,
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    signals,
    created_at: now,
  };
}
