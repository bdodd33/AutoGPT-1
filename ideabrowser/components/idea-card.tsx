import Link from "next/link";
import type { Idea } from "@/lib/types";
import { ScorePill } from "./score-badge";

export function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <Link
      href={`/idea/${idea.slug}`}
      className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-400 hover:shadow-sm"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
          {idea.category}
        </span>
        <ScorePill label="Overall" score={idea.scores.overall} />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 group-hover:underline">{idea.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">{idea.one_liner}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {idea.signals.slice(0, 2).map((s, i) => (
          <span key={i} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
            {s.metric}: {s.value}
          </span>
        ))}
      </div>
    </Link>
  );
}
