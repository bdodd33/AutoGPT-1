"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup" | "magic";

export function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "ok"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setNotice(null);
    const supabase = createClient();
    try {
      if (mode === "magic") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setNotice({ kind: "ok", text: "Check your email for a sign-in link." });
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) throw error;
        setNotice({
          kind: "ok",
          text: "Account created. Check your email to confirm, then sign in.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
        router.refresh();
        return;
      }
    } catch (err) {
      setNotice({ kind: "error", text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  const tabs: { id: Mode; label: string }[] = [
    { id: "signin", label: "Sign in" },
    { id: "signup", label: "Sign up" },
    { id: "magic", label: "Magic link" },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-5 flex gap-1 rounded-lg bg-zinc-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setMode(t.id);
              setNotice(null);
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              mode === t.id ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 outline-none focus:border-zinc-500"
        />
        {mode !== "magic" && (
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            className="rounded-lg border border-zinc-300 px-4 py-2.5 outline-none focus:border-zinc-500"
          />
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50"
        >
          {busy
            ? "Working…"
            : mode === "signin"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Email me a link"}
        </button>
      </form>

      {notice && (
        <p
          className={`mt-4 rounded-lg px-4 py-3 text-sm ${
            notice.kind === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
