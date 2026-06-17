"""
main.py
Entry point for niche-hunter CLI.
Parses arguments, prints a startup banner, and orchestrates the pipeline.
"""

import argparse
import sys

from rich.console import Console
from rich.panel import Panel
from rich.text import Text

import config
from scrapers.amazon import search_amazon
from scrapers.google_trends import get_trend_score, get_rising_queries
from scrapers.google_books import count_books
from scrapers.open_library import count_works
from scrapers.reddit import search_reddit, score_demand_from_reddit
from analysis.gap_score import calculate_gap_score, is_priority, normalize
from analysis.report import build_rich_table, export_csv, export_json, write_summary_md

console = Console()


def print_banner() -> None:
    """Print the niche-hunter startup banner using rich."""
    title = Text("Niche Hunter", style="bold green")
    subtitle = Text("Amazon KDP Gap Finder", style="dim")
    content = Text.assemble(title, "\n", subtitle)
    console.print(Panel(content, expand=False, border_style="green"))
    console.print(f"[dim]Config loaded — cache TTL: {config.CACHE_TTL_HOURS}h | "
                  f"weights D:{config.WEIGHT_DEMAND} S:{config.WEIGHT_SUPPLY} "
                  f"C:{config.WEIGHT_COMPETITION}[/dim]\n")


def load_keywords_from_file(path: str) -> list[str]:
    """Read one keyword per line from a CSV or plain-text file."""
    keywords = []
    with open(path) as f:
        for line in f:
            kw = line.strip().strip('"').strip("'")
            if kw:
                keywords.append(kw)
    return keywords


def run_pipeline(keywords: list[str], output_dir: str) -> None:
    """Run the full analysis pipeline for a list of keywords (stub)."""
    console.print(f"[bold]Analysing {len(keywords)} keyword(s):[/bold] {', '.join(keywords)}\n")

    results = []
    for kw in keywords:
        console.print(f"  [cyan]→[/cyan] {kw}")

        # Scraper stubs — will return real data in Part 2
        amazon_data   = search_amazon(kw) or {}
        trend_score   = get_trend_score(kw) or 0.0
        books_count   = count_books(kw) or 0
        works_count   = count_works(kw) or 0
        reddit_posts  = search_reddit(kw) or []
        reddit_demand = score_demand_from_reddit(reddit_posts) or 0.0

        # Scoring stubs — will be wired in Part 3
        demand_score      = normalize(trend_score + reddit_demand, 0, 200) or 0.0
        supply_score      = normalize(books_count + works_count, 0, 10000) or 0.0
        competition_score = 0.0
        gap_score         = calculate_gap_score(demand_score, supply_score, competition_score) or 0.0
        priority          = is_priority(gap_score, {}) or False

        results.append({
            "keyword":      kw,
            "gap_score":    gap_score,
            "is_priority":  priority,
            "demand":       demand_score,
            "supply":       supply_score,
            "competition":  competition_score,
        })

    build_rich_table(results)


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
    run_pipeline(keywords, args.output)
    console.print("\n[bold green]Done.[/bold green]")


if __name__ == "__main__":
    main()
