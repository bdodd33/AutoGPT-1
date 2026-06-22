"use client";

import { useState } from "react";
import Link from "next/link";
import type { Idea } from "@/lib/types";

export function AdminClient() {
  const [seed, setSeed] = useState("");
  const [publish, setPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ idea: Idea; saved: boolean } | null>(null);

  async function generate() {
    if (seed.trim().length < 3 || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed, publish }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? `Failed (${res.status})`);
        return;
      }
      setResult(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          placeholder="Seed topic, e.g. 'AI tools for dental offices'"
          className="rounded-lg border border-zinc-300 px-4 py-3 outline-none focus:border-zinc-500"
        />
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
          Publish immediately (otherwise save as draft)
        </label>
        <button
          onClick={generate}
          disabled={loading}
          className="self-start rounded-lg bg-zinc-900 px-5 py-3 font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {loading ? "Generating… (~30s)" : "Generate idea"}
        </button>
      </div>

      {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

      {result && (
        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">
            {result.saved ? "Saved to database." : "Preview only (Supabase not configured)."}
          </p>
          <h2 className="mt-1 text-xl font-bold text-zinc-900">{result.idea.title}</h2>
          <p className="text-zinc-600">{result.idea.one_liner}</p>
          <p className="mt-2 text-sm text-zinc-500">
            Overall score: <strong>{result.idea.scores.overall}/10</strong> ·{" "}
            {result.idea.sections.length} sections · {result.idea.signals.length} signals
          </p>
          {result.saved && (
            <Link
              href={`/idea/${result.idea.slug}`}
              className="mt-3 inline-block text-sm text-blue-600 hover:underline"
            >
              View idea →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
