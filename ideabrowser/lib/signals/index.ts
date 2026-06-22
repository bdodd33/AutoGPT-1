import type { Signal } from "@/lib/types";

// Real-data signal connectors. Each is best-effort and degrades gracefully:
// if a source is unreachable or unconfigured, it simply contributes no signals
// so the generation pipeline still runs.

// Google Trends has no official API; this hits the public daily-trends-style
// interest endpoint shape. We keep it defensive and return nothing on failure.
async function fetchTrendSignals(topic: string): Promise<Signal[]> {
  try {
    const url = `https://www.google.com/complete/search?client=chrome&q=${encodeURIComponent(
      topic,
    )}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    // Chrome suggest returns [query, [suggestions], ...]; surface related queries
    // as a lightweight "related searches" signal.
    const suggestions = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
    const top = suggestions.slice(0, 5).filter((s): s is string => typeof s === "string");
    if (top.length === 0) return [];
    return [
      {
        source: "trends",
        metric: "Related searches",
        value: `${top.length} active variants`,
        detail: top.join(", "),
      },
    ];
  } catch {
    return [];
  }
}

// Reddit public JSON search — counts recent discussion as a demand signal.
async function fetchRedditSignals(topic: string): Promise<Signal[]> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(
      topic,
    )}&sort=relevance&limit=10&t=year`;
    const res = await fetch(url, {
      headers: { "User-Agent": "ideabrowser/0.1 (signals)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { children?: { data?: { title?: string; num_comments?: number; subreddit?: string } }[] };
    };
    const posts = json.data?.children ?? [];
    if (posts.length === 0) return [];
    const totalComments = posts.reduce(
      (sum, p) => sum + (p.data?.num_comments ?? 0),
      0,
    );
    const subs = [...new Set(posts.map((p) => p.data?.subreddit).filter(Boolean))].slice(0, 5);
    const topTitle = posts[0]?.data?.title;
    return [
      {
        source: "reddit",
        metric: "Reddit discussion",
        value: `${posts.length} threads · ${totalComments} comments`,
        detail: [subs.length ? `r/${subs.join(", r/")}` : "", topTitle].filter(Boolean).join(" — "),
      },
    ];
  } catch {
    return [];
  }
}

// Optional YouTube signal (only when YOUTUBE_API_KEY is set).
async function fetchYouTubeSignals(topic: string): Promise<Signal[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
      topic,
    )}&key=${key}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const json = (await res.json()) as { items?: { snippet?: { channelTitle?: string; title?: string } }[] };
    const items = json.items ?? [];
    if (items.length === 0) return [];
    return [
      {
        source: "youtube",
        metric: "YouTube coverage",
        value: `${items.length} recent videos`,
        detail: items[0]?.snippet?.title,
      },
    ];
  } catch {
    return [];
  }
}

// Gather all available real-data signals for a topic, in parallel.
export async function gatherSignals(topic: string): Promise<Signal[]> {
  const results = await Promise.all([
    fetchTrendSignals(topic),
    fetchRedditSignals(topic),
    fetchYouTubeSignals(topic),
  ]);
  return results.flat();
}
