import type { IdeaScores } from "@/lib/types";
import { SCORE_LABELS } from "@/lib/types";

function color(score: number): string {
  if (score >= 8) return "bg-emerald-100 text-emerald-800 ring-emerald-600/20";
  if (score >= 6) return "bg-amber-100 text-amber-800 ring-amber-600/20";
  return "bg-rose-100 text-rose-800 ring-rose-600/20";
}

export function ScorePill({ label, score }: { label: string; score: number }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${color(
        score,
      )}`}
    >
      {label}
      <span className="font-bold tabular-nums">{score}</span>
    </span>
  );
}

export function ScoreGrid({ scores }: { scores: IdeaScores }) {
  const keys = Object.keys(SCORE_LABELS) as (keyof IdeaScores)[];
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((k) => (
        <ScorePill key={k} label={SCORE_LABELS[k]} score={scores[k]} />
      ))}
    </div>
  );
}
