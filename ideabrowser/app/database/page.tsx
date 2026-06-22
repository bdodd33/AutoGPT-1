import { SiteNav } from "@/components/site-nav";
import { IdeaCard } from "@/components/idea-card";
import { listIdeas } from "@/lib/data/ideas";

export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  const ideas = await listIdeas();
  const sorted = ideas.slice().sort((a, b) => b.scores.overall - a.scores.overall);
  const categories = [...new Set(ideas.map((i) => i.category))];

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">The Idea Database</h1>
        <p className="mt-1 text-zinc-600">
          {ideas.length} researched {ideas.length === 1 ? "idea" : "ideas"}
          {categories.length > 0 && ` across ${categories.length} categories`}, sorted by score.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((idea) => (
            <IdeaCard key={idea.slug} idea={idea} />
          ))}
        </div>
      </main>
    </>
  );
}
