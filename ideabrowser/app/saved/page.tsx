import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { IdeaCard } from "@/components/idea-card";
import { listSavedIdeas } from "@/lib/data/ideas";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const user = await getUser();
  const ideas = user ? await listSavedIdeas() : [];

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Saved ideas</h1>
        {!isSupabaseConfigured ? (
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Saving requires Supabase — the app is running in seed-data mode.
          </p>
        ) : !user ? (
          <p className="mt-4 text-zinc-600">
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>{" "}
            to bookmark ideas and find them here.
          </p>
        ) : ideas.length === 0 ? (
          <p className="mt-4 text-zinc-600">
            Nothing saved yet. Browse the{" "}
            <Link href="/database" className="text-blue-600 hover:underline">
              database
            </Link>{" "}
            and hit “Save idea” on anything worth keeping.
          </p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ideas.map((idea) => (
              <IdeaCard key={idea.slug} idea={idea} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
