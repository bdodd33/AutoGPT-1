"""
main.py
Entry point for niche-hunter CLI.
Parses arguments, prints a startup banner, and orchestrates the pipeline.
"""

import argparse
import os
import sys
from datetime import date

from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn
from rich.text import Text

import config
from scrapers.amazon import search_amazon
from scrapers.google_trends import get_trend_score, get_rising_queries
from scrapers.google_books import count_books
from scrapers.open_library import count_works
from scrapers.reddit import search_reddit, score_demand_from_reddit
from analysis.gap_score import calculate_gap_score
from analysis.report import build_rich_table, export_csv, export_json, write_summary_md

console = Console()


def print_banner() -> None:
    """Print the niche-hunter startup banner using rich."""
    title = Text("Niche Hunter", style="bold green")
    subtitle = Text("Amazon KDP Gap Finder", style="dim")
    content = Text.assemble(title, "\n", subtitle)
    console.print(Panel(content, expand=False, border_style="green"))
    console.print(
        f"[dim]Config loaded — cache TTL: {config.CACHE_TTL_HOURS}h | "
        f"weights D:{config.WEIGHT_DEMAND} S:{config.WEIGHT_SUPPLY} "
        f"C:{config.WEIGHT_COMPETITION}[/dim]\n"
    )


def load_keywords_from_file(path: str) -> list[str]:
    """Read one keyword per line from a CSV or plain-text file."""
    keywords = []
    with open(path) as f:
        for line in f:
            kw = line.strip().strip('"').strip("'")
            if kw:
                keywords.append(kw)
    return keywords


def run_pipeline(keywords: list[str]) -> list[dict]:
    """
    For each keyword: fetch all scraper data, compute gap score, return
    results sorted by gap_score descending.
    Shows a live progress bar with per-scraper status lines.
    """
    console.print(f"[bold]Analysing {len(keywords)} keyword(s)…[/bold]\n")
    results = []

    for idx, kw in enumerate(keywords, 1):
        console.print(f"[bold cyan][{idx}/{len(keywords)}][/bold cyan] {kw}")

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
        amazon_data  = search_amazon(kw) or {}
        top_books    = amazon_data.get("top_books") or []
        amz_count    = amazon_data.get("total_results", 0)
        amz_blocked  = amazon_data.get("blocked", False)
        top_bsr_vals = [b["bsr"] for b in top_books if b.get("bsr")]
        top_bsr_str  = f"{min(top_bsr_vals):,}" if top_bsr_vals else "n/a"
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
            "amazon_blocked":      amz_blocked,
            "google_books_count":  gbooks_count,
            "open_library_count":  oplib_count,
        }
        scored = calculate_gap_score(metrics)
        results.append(scored)

        pri_tag = " [bold green]⭐ PRIORITY[/bold green]" if scored["is_priority"] else ""
        console.print(f"      [bold]→ Gap Score: {scored['gap_score']}{pri_tag}[/bold]\n")

    return sorted(results, key=lambda r: r["gap_score"], reverse=True)


def main() -> None:
    """Parse CLI arguments and dispatch to the pipeline."""
    parser = argparse.ArgumentParser(
        prog="niche-hunter",
        description="Identify underserved book niches on Amazon KDP.",
    )
    parser.add_argument(
        "--keywords",
        type=str,
        default="",
        help='Comma-separated seed keywords, e.g. --keywords "stoicism, journaling"',
    )
    parser.add_argument(
        "--file",
        type=str,
        default="",
        metavar="keywords.csv",
        help="Path to a CSV/text file with one keyword per row.",
    )
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Pull rising queries from Google Trends automatically.",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=config.RESULTS_DIR,
        metavar="results/",
        help="Output directory for reports (default: results/).",
    )

    args = parser.parse_args()
    print_banner()

    keywords: list[str] = []

    if args.keywords:
        keywords += [kw.strip() for kw in args.keywords.split(",") if kw.strip()]

    if args.file:
        keywords += load_keywords_from_file(args.file)

    if args.auto:
        console.print("[yellow]Auto mode:[/yellow] fetching rising queries from Google Trends…")
        keywords += get_rising_queries(config.TRENDS_CATEGORY)

    if not keywords:
        console.print("[red]Error:[/red] supply at least one keyword via --keywords, --file, or --auto.")
        sys.exit(1)

    keywords = list(dict.fromkeys(keywords))  # deduplicate, preserve order

    results = run_pipeline(keywords)

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
    write_summary_md(results, md_path)

    console.print(f"\n[bold green]Done.[/bold green] Reports saved to [cyan]{args.output}/[/cyan]")
    console.print(f"  [dim]{csv_path}[/dim]")
    console.print(f"  [dim]{json_path}[/dim]")
    console.print(f"  [dim]{md_path}[/dim]")


if __name__ == "__main__":
    main()
