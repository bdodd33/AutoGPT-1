"""
main.py
Entry point for niche-hunter CLI.
Parses arguments, prints a startup banner, and orchestrates the pipeline.
"""

import argparse
import logging
import os
import sys
from datetime import date

from rich.console import Console
from rich.panel import Panel
from rich.text import Text

import config
from scrapers.amazon import search_amazon
from scrapers.google_trends import get_trend_score, get_rising_queries, get_related_queries
from scrapers.google_books import count_books
from scrapers.open_library import count_works
from scrapers.reddit import search_reddit, score_demand_from_reddit
from analysis.gap_score import calculate_gap_score
from analysis.expander import expand_keywords
from analysis.clustering import cluster_niches
from analysis.report import build_rich_table, export_csv, export_json, write_summary_md
from utils.cache import disable_cache

logging.basicConfig(
    filename="logs/errors.log",
    level=logging.WARNING,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

console = Console(width=160)

# Keywords whose presence marks a query as irrelevant for KDP niche-finding
_AUTO_BLACKLIST = {"amazon", "kindle app", "audible", "free", "download", "pdf", "ebook free"}

# Fallback seeds when Google Trends is unavailable (no network)
_FALLBACK_SEEDS = [
    "gratitude journal", "anxiety workbook", "stoicism for beginners",
    "mindfulness journal", "budget planner", "habit tracker",
    "intermittent fasting guide", "menopause diet", "dog training guide",
    "watercolor painting for beginners",
]


# ── Banner ────────────────────────────────────────────────────────────────────

def print_banner() -> None:
    """Print the niche-hunter v1.0 startup banner."""
    content = Text.assemble(
        Text("NICHE HUNTER v1.0\n", style="bold green"),
        Text("Amazon KDP Gap Finder for Self-Publishers", style="dim"),
    )
    console.print(Panel(content, expand=False, border_style="green", padding=(0, 2)))
    console.print(
        f"[dim]weights D:{config.WEIGHT_DEMAND} S:{config.WEIGHT_SUPPLY} "
        f"C:{config.WEIGHT_COMPETITION} | cache TTL:{config.CACHE_TTL_HOURS}h[/dim]\n"
    )


# ── Keyword loading ───────────────────────────────────────────────────────────

def load_keywords_from_csv(filepath: str) -> list[str]:
    """
    Read keywords from a CSV file in either of two formats:
      Format A: single column, no header
      Format B: single column with 'keyword' header
    Strips whitespace, skips blank lines and comment lines (# prefix).
    Raises FileNotFoundError with a clear message if the file doesn't exist.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(
            f"Keyword file not found: '{filepath}'. "
            "Create the file or check the path and try again."
        )
    keywords = []
    with open(filepath, newline="", encoding="utf-8") as f:
        for line in f:
            kw = line.strip().strip('"').strip("'")
            if not kw or kw.startswith("#") or kw.lower() == "keyword":
                continue
            keywords.append(kw)
    return keywords


# ── Auto mode ─────────────────────────────────────────────────────────────────

def _is_relevant(query: str) -> bool:
    """Return False if the query contains any blacklist term or is < 3 words."""
    if len(query.split()) < 3:
        return False
    ql = query.lower()
    return not any(bad in ql for bad in _AUTO_BLACKLIST)


def discover_keywords_auto(limit: int = 30) -> list[str]:
    """
    Step 1: Pull rising Google Trends queries in Books category (cat=22).
    Step 2: Expand each seed with related queries.
    Step 3: Filter irrelevant results.
    Step 4: Score and rank by trend score, keep top `limit`.
    Falls back to a hardcoded seed list if Trends is unavailable.
    """
    console.print("[yellow]Auto mode:[/yellow] fetching rising queries from Google Trends…")
    seeds = get_rising_queries(config.TRENDS_CATEGORY)

    if not seeds:
        console.print(
            "[yellow]  Google Trends unavailable — using fallback seed list.[/yellow]"
        )
        seeds = _FALLBACK_SEEDS

    # Expand each seed with related queries
    expanded: list[str] = list(seeds)
    for seed in seeds[:10]:   # limit related-query calls to first 10 seeds
        related = get_related_queries(seed)
        expanded.extend(related)

    # Filter and deduplicate
    seen: set[str] = set()
    filtered: list[str] = []
    for q in expanded:
        norm = q.lower().strip()
        if norm not in seen and _is_relevant(q):
            seen.add(norm)
            filtered.append(q)

    if not filtered:
        console.print("[yellow]  No trend queries passed filters — using fallback seeds.[/yellow]")
        filtered = [s for s in _FALLBACK_SEEDS if _is_relevant(s)]

    # Score and rank
    scored: list[tuple[float, str]] = []
    for kw in filtered:
        score = get_trend_score(kw)
        scored.append((score, kw))
    scored.sort(reverse=True)

    top = [kw for _, kw in scored[:limit]]
    preview = ", ".join(f'"{k}"' for k in top[:3])
    console.print(f"[green]  Discovered {len(top)} keywords.[/green] Top seeds: {preview}…\n")
    return top


# ── Pipeline ──────────────────────────────────────────────────────────────────

def _head_term_note(keyword: str) -> str | None:
    """Return a warning string for single-word (head) keywords."""
    if len(keyword.split()) == 1:
        return "Head term — supply data may be unreliable"
    return None


def run_pipeline(
    keywords: list[str],
    no_amazon: bool = False,
) -> list[dict]:
    """
    For each keyword: fetch all scraper data, compute gap score, return
    results sorted by gap_score descending.
    Shows per-keyword, per-scraper status output.
    """
    console.print(f"[bold]Analysing {len(keywords)} keyword(s)…[/bold]\n")
    results = []

    for idx, kw in enumerate(keywords, 1):
        note = _head_term_note(kw)
        note_tag = f" [dim]({note})[/dim]" if note else ""
        console.print(f"[bold cyan][{idx}/{len(keywords)}][/bold cyan] {kw}{note_tag}")

        # ── Google Trends ──────────────────────────────────────────────────
        trend_score = get_trend_score(kw) or 0.0
        console.print(f"      [green]✓[/green] Google Trends (score: {trend_score:.0f})")

        # ── Google Books ───────────────────────────────────────────────────
        gbooks_count = count_books(kw) or 0
        console.print(f"      [green]✓[/green] Google Books ({gbooks_count:,} books)")

        # ── Open Library ───────────────────────────────────────────────────
        oplib_count = count_works(kw) or 0
        console.print(f"      [green]✓[/green] Open Library ({oplib_count:,} works)")

        # ── Reddit ─────────────────────────────────────────────────────────
        reddit_posts  = search_reddit(kw) or []
        reddit_demand = score_demand_from_reddit(reddit_posts)
        console.print(
            f"      [green]✓[/green] Reddit ({len(reddit_posts)} posts, "
            f"demand: {reddit_demand:.0f})"
        )

        # ── Amazon ─────────────────────────────────────────────────────────
        if no_amazon:
            amazon_data = {}
            console.print("      [dim]–[/dim] Amazon (skipped)")
        else:
            amazon_data  = search_amazon(kw) or {}
        top_books    = amazon_data.get("top_books") or []
        amz_count    = amazon_data.get("total_results", 0)
        amz_blocked  = amazon_data.get("blocked", False)
        top_bsr_vals = [b["bsr"] for b in top_books if b.get("bsr")]
        top_bsr_str  = f"{min(top_bsr_vals):,}" if top_bsr_vals else "n/a"
        if not no_amazon:
            console.print(
                f"      [green]✓[/green] Amazon ({amz_count:,} results, "
                f"top BSR: {top_bsr_str})"
            )

        # ── Scoring ────────────────────────────────────────────────────────
        metrics = {
            "keyword":             kw,
            "trend_score":         trend_score,
            "reddit_demand_score": reddit_demand,
            "amazon_result_count": amz_count,
            "top_books":           top_books,
            "amazon_blocked":      amz_blocked or no_amazon,
            "google_books_count":  gbooks_count,
            "open_library_count":  oplib_count,
        }
        scored = calculate_gap_score(metrics)

        # Flag insufficient data
        all_zero = (
            trend_score == 0 and reddit_demand == 0 and
            gbooks_count == 0 and oplib_count == 0 and amz_count == 0
        )
        if all_zero:
            scored["insufficient_data"] = True

        results.append(scored)

        pri_tag = " [bold green]⭐ PRIORITY[/bold green]" if scored["is_priority"] else ""
        insuf   = " [dim](Insufficient Data)[/dim]" if scored.get("insufficient_data") else ""
        console.print(f"      [bold]→ Gap Score: {scored['gap_score']}{pri_tag}{insuf}[/bold]\n")

    return sorted(results, key=lambda r: r["gap_score"], reverse=True)


# ── Summary panel ─────────────────────────────────────────────────────────────

def print_summary_panel(results: list[dict], clusters: list[dict], output_dir: str) -> None:
    """Print the final SCAN COMPLETE summary panel."""
    total     = len(results)
    priority  = sum(1 for r in results if r.get("is_priority"))
    series    = sum(1 for c in clusters if c.get("is_series_opportunity"))
    top       = results[0] if results else None

    lines = ["[bold]SCAN COMPLETE[/bold]\n"]
    lines.append(f"  Keywords analysed:    {total}")
    lines.append(f"  Priority niches:       {priority}")
    lines.append(f"  Series opportunities:  {series}")
    if top:
        kw_short = top["keyword"][:40]
        lines.append(f'\n  Top opportunity:  "{kw_short}"')
        star = " ⭐" if top.get("is_priority") else ""
        lines.append(f"                    Gap Score: {top['gap_score']}{star}")
    lines.append(f"\n  Reports saved to: [cyan]{output_dir}/[/cyan]")

    console.print(Panel("\n".join(lines), border_style="green", padding=(0, 2)))


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    """Parse CLI arguments and dispatch to the pipeline."""
    parser = argparse.ArgumentParser(
        prog="niche-hunter",
        description="Find underserved book niches on Amazon KDP.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument(
        "--keywords",
        type=str,
        default="",
        metavar="TEXT",
        help='Comma-separated seed keywords, e.g. "stoicism, journaling"',
    )
    parser.add_argument(
        "--file",
        type=str,
        default="",
        metavar="PATH",
        help="CSV file with one keyword per row.",
    )
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Discover keywords from Google Trends automatically.",
    )
    parser.add_argument(
        "--expand",
        action="store_true",
        help="Expand each keyword with audience/format variations.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=config.RESULTS_DIR,
        metavar="DIR",
        help="Output directory (default: results/).",
    )
    parser.add_argument(
        "--no-amazon",
        dest="no_amazon",
        action="store_true",
        help="Skip Amazon scraping (faster, less accurate).",
    )
    parser.add_argument(
        "--no-cache",
        dest="no_cache",
        action="store_true",
        help="Bypass cache and fetch fresh data.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=50,
        metavar="INT",
        help="Max keywords to analyse (default: 50).",
    )

    args = parser.parse_args()

    if args.no_cache:
        disable_cache()

    print_banner()

    keywords: list[str] = []

    if args.keywords:
        keywords += [kw.strip() for kw in args.keywords.split(",") if kw.strip()]

    if args.file:
        try:
            keywords += load_keywords_from_csv(args.file)
        except FileNotFoundError as e:
            console.print(f"[red]Error:[/red] {e}")
            sys.exit(1)

    if args.auto:
        keywords += discover_keywords_auto(limit=args.limit)

    if not keywords:
        console.print("[red]Error:[/red] supply at least one keyword via --keywords, --file, or --auto.")
        sys.exit(1)

    # Deduplicate, preserve order
    seen: set[str] = set()
    unique_kws: list[str] = []
    for kw in keywords:
        norm = kw.lower().strip()
        if norm not in seen:
            seen.add(norm)
            unique_kws.append(kw)
    keywords = unique_kws

    # Enforce limit with warning
    if len(keywords) > args.limit:
        console.print(
            f"[yellow]Warning:[/yellow] {len(keywords)} keywords provided — "
            f"processing first {args.limit} (use --limit to change)."
        )
        keywords = keywords[: args.limit]

    # Optional expansion
    if args.expand:
        before = len(keywords)
        keywords = expand_keywords(keywords)
        keywords = keywords[: args.limit]
        console.print(
            f"[bold blue]Expanding[/bold blue] {before} seed(s) → "
            f"[bold]{len(keywords)}[/bold] keywords\n"
        )

    results  = run_pipeline(keywords, no_amazon=args.no_amazon)
    clusters = cluster_niches(results)

    # ── Terminal table ─────────────────────────────────────────────────────
    build_rich_table(results)

    # ── Export files ───────────────────────────────────────────────────────
    today = date.today().isoformat()
    os.makedirs(args.output, exist_ok=True)

    csv_path  = os.path.join(args.output, f"{today}_niche_report.csv")
    json_path = os.path.join(args.output, f"{today}_niche_report.json")
    md_path   = os.path.join(args.output, f"{today}_summary.md")

    export_csv(results, csv_path)
    export_json(results, json_path)
    write_summary_md(results, md_path, clusters=clusters)

    print_summary_panel(results, clusters, args.output)


if __name__ == "__main__":
    main()
