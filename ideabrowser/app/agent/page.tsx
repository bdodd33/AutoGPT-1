import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { AgentClient } from "./agent-client";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function AgentPage() {
  const user = await getUser();
  const needsSignIn = isSupabaseConfigured && !user;

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Idea Agent</h1>
        <p className="mt-1 mb-6 text-zinc-600">
          Describe any startup idea and get a full AI research report, enriched with live demand
          signals.
        </p>
        {needsSignIn ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <Link href="/login" className="font-medium text-blue-700 hover:underline">
              Sign in
            </Link>{" "}
            to use the Idea Agent — runs are saved to your account.
          </p>
        ) : (
          <AgentClient />
        )}
      </main>
    </>
  );
}
