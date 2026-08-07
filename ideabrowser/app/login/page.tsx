import { redirect } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getUser } from "@/lib/auth";
import { LoginClient } from "./login-client";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getUser()) redirect("/dashboard");

  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-md px-5 py-12">
        <h1 className="text-2xl font-bold text-zinc-900">Welcome</h1>
        <p className="mt-1 mb-6 text-zinc-600">
          Sign in to save ideas and use the research tools.
        </p>
        {isSupabaseConfigured ? (
          <LoginClient />
        ) : (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Supabase isn&apos;t configured, so accounts are disabled. The app is running in
            seed-data mode — add the Supabase keys in <code>.env.local</code> to enable sign-in.
          </p>
        )}
      </main>
    </>
  );
}
