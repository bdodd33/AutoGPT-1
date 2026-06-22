import Link from "next/link";

const LINKS = [
  { href: "/dashboard", label: "Today" },
  { href: "/database", label: "Database" },
  { href: "/agent", label: "Idea Agent" },
  { href: "/admin", label: "Admin" },
];

export function SiteNav() {
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
        </nav>
      </div>
    </header>
  );
}
