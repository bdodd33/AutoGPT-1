"""
analysis/report.py
Renders analysis results as a Rich terminal table and exports to
CSV, JSON, and Markdown formats.
"""


def build_rich_table(results: list[dict]) -> None:
    """
    Print a Rich-formatted table to stdout with columns:
      Keyword | Gap Score | Priority | Demand | Supply | Competition
    Rows are sorted by Gap Score descending.
    Priority rows are highlighted in green.
    """
    pass


def export_csv(results: list[dict], path: str) -> None:
    """
    Write all result dicts to a CSV file at `path`.
    Columns match the keys of the result dicts.
    Creates parent directories if they don't exist.
    """
    pass


def export_json(results: list[dict], path: str) -> None:
    """
    Write all result dicts to a pretty-printed JSON file at `path`.
    Creates parent directories if they don't exist.
    """
    pass


def write_summary_md(results: list[dict], path: str) -> None:
    """
    Write a Markdown report to `path` containing:
      - A '## Priority Niches' section listing each PRIORITY keyword with
        a suggested book title and why it's a good opportunity.
      - A full results table for all keywords.
    Creates parent directories if they don't exist.
    """
    pass
