import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { ScoreGrid } from "@/components/score-badge";
import { Markdownish } from "@/components/markdownish";
import { getIdeaBySlug } from "@/lib/data/ideas";
import { SECTION_ORDER } from "@/lib/types";

export const dynamic = "force-dynamic";

// Next.js 16: params is a Promise and must be awaited.
export default async function IdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug);
  if (!idea) notFound();

  // Order sections by our canonical order, then render whatever exists.
  const sectionsByType = new Map(idea.sections.map((s) => [s.type, s]));
  const ordered = SECTION_ORDER.map((o) => sectionsByType.get(o.type)).filter(
    (s): s is NonNullable<typeof s> => Boolean(s),
  );

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <Link href="/database" className="text-sm text-blue-600 hover:underline">
          ← Database
        </Link>
        <div className="mt-3 mb-2 flex items-center gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
            {idea.category}
          </span>
          {idea.created_by_ai && (
            <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              AI-researched
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">{idea.title}</h1>
        <p className="mt-2 text-lg text-zinc-600">{idea.one_liner}</p>

        <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Idea scores
          </h2>
          <ScoreGrid scores={idea.scores} />
        </div>

        {idea.signals.length > 0 && (
          <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Signals
            </h2>
            <ul className="space-y-2">
              {idea.signals.map((s, i) => (
                <li key={i} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {s.source}
                  </span>
                  <span className="font-medium text-zinc-800">{s.metric}:</span>
                  <span className="text-zinc-600">{s.value}</span>
                  {s.detail && <span className="text-zinc-400">— {s.detail}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {ordered.map((section) => (
            <section key={section.type} className="rounded-xl border border-zinc-200 bg-white p-6">
              <h2 className="text-xl font-semibold text-zinc-900">{section.title}</h2>
              <div className="mt-2">
                <Markdownish content={section.content} />
              </div>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
