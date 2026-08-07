import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { AdminClient } from "./admin-client";
import { hasAnthropic } from "@/lib/ai/anthropic";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // Admin-only once Supabase is configured; open in local seed-data mode.
  if (isSupabaseConfigured) {
    const profile = await getProfile();
    if (profile?.role !== "admin") {
      return (
        <>
          <SiteNav />
          <main className="mx-auto max-w-3xl px-5 py-12">
            <h1 className="text-2xl font-bold text-zinc-900">Admin</h1>
            <p className="mt-2 text-zinc-600">
              This area is for the site admin.{" "}
              {!profile && (
                <>
                  <Link href="/login" className="text-blue-600 hover:underline">
                    Sign in
                  </Link>{" "}
                  to continue.
                </>
              )}
            </p>
          </main>
        </>
      );
    }
  }

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Admin · Generate ideas</h1>
        <p className="mt-1 mb-4 text-zinc-600">
          Generate a fully-researched idea from a seed topic. Claude writes the deep-dive and the
          pipeline enriches it with live demand signals.
        </p>

        <div className="mb-6 flex flex-wrap gap-2 text-xs">
          <span
            className={`rounded-full px-2.5 py-1 font-medium ${
              hasAnthropic() ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
            }`}
          >
            Claude: {hasAnthropic() ? "configured" : "missing ANTHROPIC_API_KEY"}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 font-medium ${
              isSupabaseConfigured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            Supabase: {isSupabaseConfigured ? "configured" : "seed-data mode"}
          </span>
        </div>

        <AdminClient />
      </main>
    </>
  );
}
