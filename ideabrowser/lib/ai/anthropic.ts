import Anthropic from "@anthropic-ai/sdk";

// Default model for deep idea generation and the research agent.
export const GENERATION_MODEL = "claude-opus-4-8";
// Cheaper model for light enrichment/classification work.
export const ENRICHMENT_MODEL = "claude-haiku-4-5";

export function hasAnthropic(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Lazily construct the client so importing this module never throws when the
// key is absent (the app still runs in seed-data mode).
export function getAnthropic(): Anthropic {
  if (!hasAnthropic()) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  return new Anthropic();
}
