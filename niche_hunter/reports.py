"""
Report generation for Niche Hunter.

Four output formats:
  1. print_table   — Rich terminal table (sorted by gap_score desc)
  2. save_csv      — CSV file with all score fields
  3. save_json     — JSON file with all score fields
  4. save_markdown — Markdown summary with "## Priority Niches" section
                     (includes book-idea suggestions for priority niches)
                     followed by a full results table.
"""

import csv
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Book idea suggestion helper
# ---------------------------------------------------------------------------

_IDEA_TEMPLATES = [
    "A beginner's comprehensive guide to {keyword}",
    "Advanced strategies for {keyword} practitioners",
    "{keyword}: A step-by-step workbook for self-starters",
    "The ultimate journal for {keyword} enthusiasts",
    "30-day challenge planner: master {keyword} fast",
    "{keyword} simplified: plain-English explanations for newcomers",
    "The illustrated reference guide to {keyword}",
    "Case studies in {keyword}: real-world lessons learned",
]


def _book_ideas(keyword: str, n: int = 3) -> List[str]:
    ideas = []
    for i in range(min(n, len(_IDEA_TEMPLATES))):
        ideas.append(_IDEA_TEMPLATES[i].format(keyword=keyword.title()))
    return ideas


# ---------------------------------------------------------------------------
# Sorting helper
# ---------------------------------------------------------------------------

def _sorted_results(results: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    return sorted(results, key=lambda r: r.get("gap_score", 0.0), reverse=True)


# ---------------------------------------------------------------------------
# 1. Rich terminal table
# ---------------------------------------------------------------------------

def print_table(results: List[Dict[str, Any]]) -> None:
    """
    Print a Rich-formatted table of results to stdout.

    Priority rows are highlighted in green.  Sorted by gap_score descending.
    """
    try:
        from rich.console import Console
        from rich.table import Table
        from rich import box
    except ImportError:
        logger.warning("rich not installed — falling back to plain text output.")
        _print_plain(results)
        return

    console = Console()
    table = Table(
        title="[bold cyan]Niche Hunter — Gap Score Report[/bold cyan]",
        box=box.ROUNDED,
        show_header=True,
        header_style="bold magenta",
        show_lines=False,
    )

    table.add_column("Keyword", style="bold", no_wrap=True, min_width=20)
    table.add_column("Gap Score", justify="right", style="yellow")
    table.add_column("Priority", justify="center")
    table.add_column("Demand", justify="right")
    table.add_column("Supply", justify="right")
    table.add_column("Competition", justify="right")
    table.add_column("Amz Results", justify="right")
    table.add_column("Trend", justify="right")
    table.add_column("Top3 Reviews", justify="right")

    for row in _sorted_results(results):
        is_priority = row.get("is_priority", False)
        priority_marker = "[green]YES[/green]" if is_priority else "[dim]no[/dim]"
        style = "green" if is_priority else ""

        table.add_row(
            str(row.get("keyword", "")),
            f"{row.get('gap_score', 0.0):.1f}",
            priority_marker,
            f"{row.get('demand_score', 0.0):.1f}",
            f"{row.get('supply_score', 0.0):.1f}",
            f"{row.get('competition_score', 0.0):.1f}",
            str(row.get("amazon_results", 0)),
            f"{row.get('trend_score', 0.0):.1f}",
            f"{row.get('top3_avg_reviews', 0.0):.1f}",
            style=style,
        )

    console.print()
    console.print(table)
    console.print()

    # Summary line
    priority_count = sum(1 for r in results if r.get("is_priority"))
    console.print(
        f"[bold]Total keywords analysed:[/bold] {len(results)}  "
        f"[bold green]Priority niches found:[/bold green] {priority_count}"
    )
    console.print()


def _print_plain(results: List[Dict[str, Any]]) -> None:
    """Fallback plain-text table when rich is not available."""
    headers = [
        "Keyword", "GapScore", "Priority", "Demand",
        "Supply", "Comp", "AmzResults", "Trend", "Top3Rev",
    ]
    print("\t".join(headers))
    for row in _sorted_results(results):
        print(
            "\t".join([
                str(row.get("keyword", "")),
                f"{row.get('gap_score', 0.0):.1f}",
                "YES" if row.get("is_priority") else "no",
                f"{row.get('demand_score', 0.0):.1f}",
                f"{row.get('supply_score', 0.0):.1f}",
                f"{row.get('competition_score', 0.0):.1f}",
                str(row.get("amazon_results", 0)),
                f"{row.get('trend_score', 0.0):.1f}",
                f"{row.get('top3_avg_reviews', 0.0):.1f}",
            ])
        )


# ---------------------------------------------------------------------------
# 2. CSV
# ---------------------------------------------------------------------------

_CSV_FIELDS = [
    "keyword",
    "gap_score",
    "is_priority",
    "demand_score",
    "supply_score",
    "competition_score",
    "amazon_results",
    "trend_score",
    "top3_avg_reviews",
    "avg_bsr",
    "avg_reviews",
    "reddit_engagement",
    "total_books",
]


def save_csv(results: List[Dict[str, Any]], filepath: str) -> None:
    """Write results as CSV to *filepath*."""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=_CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        for row in _sorted_results(results):
            writer.writerow(row)

    logger.info("CSV saved to %s", filepath)


# ---------------------------------------------------------------------------
# 3. JSON
# ---------------------------------------------------------------------------

def save_json(results: List[Dict[str, Any]], filepath: str) -> None:
    """Write results as JSON array to *filepath*."""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)

    with path.open("w", encoding="utf-8") as fh:
        json.dump(_sorted_results(results), fh, indent=2, ensure_ascii=False)

    logger.info("JSON saved to %s", filepath)


# ---------------------------------------------------------------------------
# 4. Markdown
# ---------------------------------------------------------------------------

def save_markdown(results: List[Dict[str, Any]], filepath: str) -> None:
    """Write a Markdown summary to *filepath*."""
    path = Path(filepath)
    path.parent.mkdir(parents=True, exist_ok=True)

    sorted_all = _sorted_results(results)
    priority = [r for r in sorted_all if r.get("is_priority")]

    lines: List[str] = []

    # Header
    lines += [
        "# Niche Hunter — KDP Gap Analysis Report",
        "",
        f"**Total keywords analysed:** {len(results)}  ",
        f"**Priority niches found:** {len(priority)}",
        "",
    ]

    # Priority niches section
    lines += [
        "## Priority Niches",
        "",
        "> These niches meet all priority criteria:  ",
        "> Gap Score ≥ 70 · Amazon results < 100 · Trend ≥ 40 · Top-3 avg reviews < 50",
        "",
    ]

    if priority:
        for rank, row in enumerate(priority, start=1):
            kw = row.get("keyword", "")
            lines += [
                f"### {rank}. {kw.title()}",
                "",
                f"| Metric | Value |",
                f"|--------|-------|",
                f"| Gap Score | **{row.get('gap_score', 0.0):.1f}** |",
                f"| Demand | {row.get('demand_score', 0.0):.1f} |",
                f"| Supply | {row.get('supply_score', 0.0):.1f} |",
                f"| Competition | {row.get('competition_score', 0.0):.1f} |",
                f"| Amazon Results | {row.get('amazon_results', 0)} |",
                f"| Trend Score | {row.get('trend_score', 0.0):.1f} |",
                f"| Top-3 Avg Reviews | {row.get('top3_avg_reviews', 0.0):.1f} |",
                f"| Avg BSR | {row.get('avg_bsr', 0.0):,.0f} |",
                "",
                "**Book idea suggestions:**",
                "",
            ]
            for idea in _book_ideas(kw):
                lines.append(f"- {idea}")
            lines.append("")
    else:
        lines += [
            "*No priority niches found in this batch.  "
            "Consider expanding your keyword list or adjusting thresholds.*",
            "",
        ]

    # Full results table
    lines += [
        "## All Results",
        "",
        "| # | Keyword | Gap Score | Priority | Demand | Supply | Competition "
        "| Amz Results | Trend | Top3 Reviews |",
        "|---|---------|-----------|----------|--------|--------|-------------|"
        "-------------|-------|--------------|",
    ]
    for i, row in enumerate(sorted_all, start=1):
        priority_cell = "YES" if row.get("is_priority") else "no"
        lines.append(
            f"| {i} "
            f"| {row.get('keyword', '')} "
            f"| {row.get('gap_score', 0.0):.1f} "
            f"| {priority_cell} "
            f"| {row.get('demand_score', 0.0):.1f} "
            f"| {row.get('supply_score', 0.0):.1f} "
            f"| {row.get('competition_score', 0.0):.1f} "
            f"| {row.get('amazon_results', 0)} "
            f"| {row.get('trend_score', 0.0):.1f} "
            f"| {row.get('top3_avg_reviews', 0.0):.1f} |"
        )

    lines += [
        "",
        "---",
        "*Generated by [Niche Hunter](https://github.com/nichhunter)*",
        "",
    ]

    path.write_text("\n".join(lines), encoding="utf-8")
    logger.info("Markdown saved to %s", filepath)
