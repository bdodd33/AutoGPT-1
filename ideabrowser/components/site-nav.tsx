import Link from "next/link";
import { getUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const LINKS = [
  { href: "/dashboard", label: "Today" },
  { href: "/database", label: "Database" },
  { href: "/agent", label: "Idea Agent" },
  { href: "/saved", label: "Saved" },
  { href: "/admin", label: "Admin" },
];

export async function SiteNav() {
  const user = await getUser();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-zinc-900">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-zinc-900 text-sm text-white">
            ib
          </span>
          IdeaBrowser
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <form action="/auth/signout" method="post" className="ml-2 flex items-center gap-2">
              <span className="hidden max-w-40 truncate text-xs text-zinc-400 sm:inline">
                {user.email}
              </span>
              <button
                type="submit"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-zinc-700 transition hover:border-zinc-400"
              >
                Sign out
              </button>
            </form>
          ) : (
            isSupabaseConfigured && (
              <Link
                href="/login"
                className="ml-2 rounded-md bg-zinc-900 px-3 py-1.5 text-white transition hover:bg-zinc-700"
              >
                Sign in
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
