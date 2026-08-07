"use client";

import { useState } from "react";

export function SaveButton({ slug, initialSaved }: { slug: string; initialSaved: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, save: !saved }),
      });
      const data = (await res.json()) as { saved?: boolean; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to save.");
        return;
      }
      setSaved(Boolean(data.saved));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={busy}
        className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
          saved
            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
        }`}
      >
        {saved ? "★ Saved" : "☆ Save idea"}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </span>
  );
}
