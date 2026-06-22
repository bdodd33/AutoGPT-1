import { GENERATION_MODEL, getAnthropic, hasAnthropic } from "@/lib/ai/anthropic";
import { gatherSignals } from "@/lib/signals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Streams a markdown research report for any idea the user types.
export async function POST(request: Request) {
  if (!hasAnthropic()) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 503 },
    );
  }

  const { prompt } = (await request.json()) as { prompt?: string };
  if (!prompt || prompt.trim().length < 3) {
    return Response.json({ error: "Please describe an idea." }, { status: 400 });
  }

  const signals = await gatherSignals(prompt);
  const signalText =
    signals.length > 0
      ? signals.map((s) => `- [${s.source}] ${s.metric}: ${s.value}${s.detail ? ` (${s.detail})` : ""}`).join("\n")
      : "(no live signals available)";

  const client = getAnthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const messageStream = client.messages.stream({
          model: GENERATION_MODEL,
          max_tokens: 8000,
          messages: [
            {
              role: "user",
              content: `You are a startup research analyst. Write a concise but rigorous research
report (markdown) for this idea: "${prompt}".

Live demand signals:
${signalText}

Cover, with ## headings: Summary, Why Now, Market Gap, Proof Signals (tie to the signals above),
Monetization & Value Ladder, 0-90 Day Execution Plan, Risks, and a 1-10 Verdict with scores for
opportunity, feasibility, timing, and revenue potential. Be specific and numeric.`,
            },
          ],
        });

        messageStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });
        await messageStream.finalMessage();
      } catch (err) {
        controller.enqueue(
          encoder.encode(`\n\n_Error generating report: ${(err as Error).message}_`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
