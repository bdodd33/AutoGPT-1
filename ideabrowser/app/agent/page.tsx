import { SiteNav } from "@/components/site-nav";
import { AgentClient } from "./agent-client";

export default function AgentPage() {
  return (
    <>
      <SiteNav />
      <main className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="text-2xl font-bold text-zinc-900">Idea Agent</h1>
        <p className="mt-1 mb-6 text-zinc-600">
          Describe any startup idea and get a full AI research report, enriched with live demand
          signals.
        </p>
        <AgentClient />
      </main>
    </>
  );
}
