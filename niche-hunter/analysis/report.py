"""
analysis/report.py
Renders analysis results as a Rich terminal table and exports to
CSV, JSON, and Markdown formats.
"""

import json
import os
from datetime import date

import pandas as pd
from rich.console import Console
from rich.table import Table
from rich.text import Text

console = Console(width=160)

_DATE = date.today().isoformat()


def _row_style(gap_score: float) -> str:
    if gap_score >= 70:
        return "bold green"
    if gap_score >= 50:
        return "yellow"
    return "dim red"


def build_rich_table(results: list[dict]) -> None:
    """
    Print a Rich-formatted table sorted by gap_score descending.
    Rows are colour-coded: green ≥70, yellow 50–69, red/dim <50.
    Priority niches are marked with ⭐.
    """
    sorted_results = sorted(results, key=lambda r: r.get("gap_score", 0), reverse=True)

    table = Table(
        title=f"Niche Hunter Results — {_DATE}",
        show_lines=True,
        header_style="bold cyan",
    )
    table.add_column("#",            style="dim",        width=3,  justify="right")
    table.add_column("Keyword",      min_width=28)
    table.add_column("Gap Score",    justify="right",    width=10)
    table.add_column("Priority",     justify="center",   width=10)
    table.add_column("Demand",       justify="right",    width=8)
    table.add_column("Supply",       justify="right",    width=8)
    table.add_column("Competition",  justify="right",    width=12)
    table.add_column("Amazon #",     justify="right",    width=9)
    table.add_column("Trend",        justify="right",    width=7)
    table.add_column("Avg Reviews",  justify="right",    width=12)

    for i, r in enumerate(sorted_results, 1):
        gap   = r.get("gap_score", 0.0)
        style = _row_style(gap)
        pri   = "⭐ YES" if r.get("is_priority") else "no"

        table.add_row(
            str(i),
            r.get("keyword", ""),
            f"{gap:.1f}",
            pri,
            f"{r.get('demand_score', 0):.1f}",
            f"{r.get('supply_score', 0):.1f}",
            f"{r.get('competition_score', 0):.1f}",
            str(r.get("amazon_result_count", 0)),
            f"{r.get('trend_score', 0):.1f}",
            str(r.get("avg_reviews") or "—"),
            style=style,
        )

    console.print(table)


def export_csv(results: list[dict], path: str) -> None:
    """Write all result dicts to CSV using pandas. Creates parent dirs."""
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    # Flatten list fields for CSV
    rows = []
    for r in results:
        row = dict(r)
        row["top_book_titles"] = " | ".join(row.get("top_book_titles") or [])
        row["book_ideas"]      = " | ".join(row.get("book_ideas") or [])
        rows.append(row)
    pd.DataFrame(rows).to_csv(path, index=False)


def export_json(results: list[dict], path: str) -> None:
    """Write results as a pretty-printed JSON array. Creates parent dirs."""
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    sorted_results = sorted(results, key=lambda r: r.get("gap_score", 0), reverse=True)
    with open(path, "w") as f:
        json.dump(sorted_results, f, indent=2, default=str)


def write_summary_md(results: list[dict], path: str) -> None:
    """
    Write a Markdown report with a Priority Niches section followed
    by a full results table. Creates parent dirs.
    """
    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    sorted_results = sorted(results, key=lambda r: r.get("gap_score", 0), reverse=True)
    priority = [r for r in sorted_results if r.get("is_priority")]

    lines = [f"# Niche Hunter Report — {_DATE}", ""]

    # ── Priority section ──────────────────────────────────────────────────────
    lines.append("## ⭐ PRIORITY NICHES")
    lines.append("")
    if not priority:
        lines.append("_No priority niches found in this run._")
        lines.append("")
    else:
        for rank, r in enumerate(priority, 1):
            kw           = r.get("keyword", "")
            gap          = r.get("gap_score", 0)
            demand       = r.get("demand_score", 0)
            supply       = r.get("supply_score", 0)
            competition  = r.get("competition_score", 0)
            amazon_count = r.get("amazon_result_count", 0)
            avg_rev      = r.get("avg_reviews")
            book_ideas   = r.get("book_ideas") or []
            top_titles   = r.get("top_book_titles") or []

            lines.append(f"### {rank}. {kw} — Gap Score: {gap}")
            lines.append("")
            lines.append("**Why this is an opportunity:**")
            lines.append(f"- Search demand score: {demand}/100")
            lines.append(f"- Supply score: {supply}/100 ({amazon_count} books on Amazon)")
            avg_rev_str = f"{avg_rev:.0f}" if avg_rev is not None else "unknown"
            lines.append(f"- Competition score: {competition}/100 (avg {avg_rev_str} reviews on top books)")
            lines.append("")
            lines.append("**Suggested book angles:**")
            for idx, idea in enumerate(book_ideas, 1):
                lines.append(f"{idx}. {idea}")
            lines.append("")
            if top_titles:
                lines.append("**Top existing books:**")
                for title in top_titles:
                    lines.append(f"- {title}")
                lines.append("")
            lines.append("---")
            lines.append("")

    # ── Full results table ────────────────────────────────────────────────────
    lines.append("## ALL NICHES ANALYSED")
    lines.append("")
    lines.append("| Keyword | Gap Score | Priority | Amazon # | Trend |")
    lines.append("| --- | --- | --- | --- | --- |")
    for r in sorted_results:
        kw   = r.get("keyword", "")
        gap  = r.get("gap_score", 0)
        pri  = "⭐" if r.get("is_priority") else ""
        amz  = r.get("amazon_result_count", 0)
        trnd = r.get("trend_score", 0)
        lines.append(f"| {kw} | {gap} | {pri} | {amz} | {trnd} |")
    lines.append("")

    with open(path, "w") as f:
        f.write("\n".join(lines))
