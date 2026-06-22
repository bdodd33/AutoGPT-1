import Link from "next/link";
import { SiteNav } from "@/components/site-nav";

const TIERS = [
  { name: "Free", price: "$0", blurb: "Idea of the Day + limited database", featured: false },
  { name: "Starter", price: "$29/mo", blurb: "Full database, scores, signals", featured: true },
  { name: "Pro", price: "$99/mo", blurb: "Idea Agent + founder-fit + exports", featured: false },
];

const FEATURES = [
  ["Idea of the Day", "One deeply-researched startup idea, every day."],
  ["The Idea Database", "Hundreds of researched ideas, searchable and scored."],
  ["Deep-dive analysis", "Value ladder, why-now, proof signals, execution plan, and more."],
  ["Idea Agent", "Type any idea and get a full AI research report."],
  ["Real-data signals", "Reddit, search trends, and YouTube demand signals."],
  ["Founder fit", "Ideas matched to your skills, capital, and time."],
];

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-6xl px-5">
        <section className="py-20 text-center">
          <p className="mb-3 text-sm font-medium text-blue-600">Find your next startup</p>
          <h1 className="mx-auto max-w-3xl text-balance text-5xl font-bold tracking-tight text-zinc-900">
            Startup ideas worth building — researched for you
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-600">
            A daily database of deeply-researched startup ideas, each with scores, real-data demand
            signals, and a full execution plan. Plus an AI agent that researches any idea you type.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white transition hover:bg-zinc-700"
            >
              See today&apos;s idea
            </Link>
            <Link
              href="/database"
              className="rounded-lg border border-zinc-300 bg-white px-5 py-3 font-medium text-zinc-800 transition hover:border-zinc-400"
            >
              Browse the database
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(([title, body]) => (
            <div key={title} className="rounded-xl border border-zinc-200 bg-white p-5">
              <h3 className="font-semibold text-zinc-900">{title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{body}</p>
            </div>
          ))}
        </section>

        <section className="py-20">
          <h2 className="mb-2 text-center text-3xl font-bold text-zinc-900">Pricing</h2>
          <p className="mb-8 text-center text-zinc-600">
            Free while you build it for yourself. Turn on paid plans when you go public.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className={`rounded-xl border bg-white p-6 ${
                  t.featured ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
                }`}
              >
                <h3 className="font-semibold text-zinc-900">{t.name}</h3>
                <p className="mt-2 text-3xl font-bold text-zinc-900">{t.price}</p>
                <p className="mt-2 text-sm text-zinc-600">{t.blurb}</p>
                <button
                  disabled
                  className="mt-4 w-full cursor-not-allowed rounded-lg bg-zinc-100 py-2 text-sm font-medium text-zinc-400"
                >
                  Coming soon
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-zinc-200 py-8 text-center text-sm text-zinc-500">
        Built with Next.js, Supabase, and Claude.
      </footer>
    </>
  );
}
