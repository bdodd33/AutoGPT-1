import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { IdeaCard } from "@/components/idea-card";
import { ScoreGrid } from "@/components/score-badge";
import { getIdeaOfTheDay, listIdeas } from "@/lib/data/ideas";

// Reads Supabase/cookies at request time.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [today, ideas] = await Promise.all([getIdeaOfTheDay(), listIdeas()]);
  const recent = ideas.filter((i) => i.slug !== today?.slug).slice(0, 6);

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <p className="text-sm font-medium text-blue-600">Idea of the Day</p>
        {today ? (
          <Link
            href={`/idea/${today.slug}`}
            className="mt-2 block rounded-2xl border border-zinc-200 bg-white p-7 transition hover:border-zinc-400"
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                {today.category}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-zinc-900">{today.title}</h1>
            <p className="mt-2 max-w-2xl text-zinc-600">{today.one_liner}</p>
            <div className="mt-4">
              <ScoreGrid scores={today.scores} />
            </div>
          </Link>
        ) : (
          <p className="mt-4 text-zinc-500">No ideas yet. Generate one from the Admin page.</p>
        )}

        <div className="mt-10 mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">Recent ideas</h2>
          <Link href="/database" className="text-sm text-blue-600 hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((idea) => (
            <IdeaCard key={idea.slug} idea={idea} />
          ))}
        </div>
      </main>
    </>
  );
}
