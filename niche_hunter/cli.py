"""
Niche Hunter CLI entry point.

Usage
-----
    python -m niche_hunter.cli analyze "low content books" "kdp journals"
    python -m niche_hunter.cli auto --seed "self help" --expand 10
    python -m niche_hunter.cli analyze "yoga for seniors" --no-cache --format json

Sub-commands
------------
  analyze [keywords...]     Analyse one or more explicit keywords
  auto --seed SEED          Auto-expand a seed keyword and analyse results

Global flags
------------
  --no-cache                Skip reading from / writing to the disk cache
  --output-dir DIR          Directory to write report files (default: results/)
  --format {table,csv,json,md,all}
                            Output format(s) — default: all
  --verbose                 Enable DEBUG logging
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from . import config
from .scoring import compute_gap_score

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Keyword expansion helpers (for "auto" mode)
# ---------------------------------------------------------------------------

def _extract_noun_phrases(text: str) -> List[str]:
    """
    Naive noun-phrase extractor using regex.

    Extracts sequences of 2–4 title-like or lower-case words that look like
    topic labels.  Not NLP — but requires no extra dependencies.
    """
    # Lowercase, strip punctuation
    clean = re.sub(r"[^\w\s]", " ", text.lower())
    words = clean.split()

    phrases = set()
    # 2-word and 3-word n-grams that contain at least one "content" word
    stop = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
        "for", "of", "with", "how", "what", "why", "when", "where",
        "is", "are", "was", "were", "be", "been", "has", "have", "had",
        "do", "does", "did", "will", "would", "can", "could", "should",
        "may", "might", "i", "you", "he", "she", "we", "they", "it",
        "this", "that", "these", "those", "my", "your", "our", "their",
        "its", "me", "him", "her", "us", "them",
    }

    for n in (2, 3):
        for i in range(len(words) - n + 1):
            chunk = words[i: i + n]
            if chunk[0] in stop or chunk[-1] in stop:
                continue
            if all(len(w) >= 3 for w in chunk):
                phrases.add(" ".join(chunk))

    return list(phrases)


def _expand_keywords_from_reddit(
    seed: str, max_keywords: int, use_cache: bool
) -> List[str]:
    """
    Fetch the top Reddit posts mentioning *seed* and extract noun phrases
    to use as candidate keywords.  Returns up to *max_keywords* candidates.
    """
    from .scrapers import reddit as reddit_scraper

    try:
        import requests

        headers = {
            "User-Agent": config.REDDIT_USER_AGENT or "NicheHunter/1.0",
            "Accept": "application/json",
        }
        params = {
            "q": seed,
            "sort": "relevance",
            "t": "year",
            "limit": 25,
            "type": "link",
        }
        resp = requests.get(
            "https://www.reddit.com/search.json",
            headers=headers,
            params=params,
            timeout=15,
        )
        resp.raise_for_status()
        children = resp.json().get("data", {}).get("children", [])

        all_text = " ".join(
            c.get("data", {}).get("title", "") for c in children
        )
        phrases = _extract_noun_phrases(all_text)

        # Filter out phrases that don't contain a word from the seed
        seed_words = set(seed.lower().split())
        relevant = [
            p for p in phrases
            if any(w in p for w in seed_words) or len(phrases) < max_keywords * 2
        ]

        # Deduplicate and take top N
        seen = set()
        result = []
        for phrase in relevant:
            if phrase not in seen and phrase != seed.lower():
                seen.add(phrase)
                result.append(phrase)
            if len(result) >= max_keywords:
                break

        # If we didn't get enough, fill up with all phrases
        if len(result) < max_keywords:
            for phrase in phrases:
                if phrase not in seen and phrase != seed.lower():
                    seen.add(phrase)
                    result.append(phrase)
                if len(result) >= max_keywords:
                    break

        return result[:max_keywords]

    except Exception as exc:
        logger.warning("Keyword expansion failed: %s", exc)
        return []


# ---------------------------------------------------------------------------
# Core analysis pipeline
# ---------------------------------------------------------------------------

async def _analyse_keyword(
    keyword: str,
    use_cache: bool,
    progress=None,
    task_id=None,
) -> Dict[str, Any]:
    """Run all scrapers for a single keyword and return the gap-score dict."""
    from .scrapers import amazon as amazon_scraper
    from .scrapers import google_trends as trends_scraper
    from .scrapers import reddit as reddit_scraper
    from .scrapers import google_books as gbooks_scraper
    from .scrapers import open_library as oplib_scraper

    def _update(msg: str) -> None:
        if progress is not None and task_id is not None:
            progress.update(task_id, description=f"[cyan]{keyword}[/cyan] — {msg}")

    # Run sync scrapers in thread executor to keep event loop free
    loop = asyncio.get_event_loop()

    _update("Google Trends")
    trends_data = await loop.run_in_executor(
        None, lambda: trends_scraper.fetch(keyword, use_cache=use_cache)
    )
    time.sleep(config.RATE_LIMIT_DELAY)

    _update("Reddit")
    reddit_data = await loop.run_in_executor(
        None, lambda: reddit_scraper.fetch(keyword, use_cache=use_cache)
    )
    time.sleep(config.RATE_LIMIT_DELAY)

    _update("Google Books")
    gbooks_data = await loop.run_in_executor(
        None, lambda: gbooks_scraper.fetch(keyword, use_cache=use_cache)
    )
    time.sleep(config.RATE_LIMIT_DELAY)

    _update("Open Library")
    oplib_data = await loop.run_in_executor(
        None, lambda: oplib_scraper.fetch(keyword, use_cache=use_cache)
    )
    time.sleep(config.RATE_LIMIT_DELAY)

    _update("Amazon")
    amazon_data = await amazon_scraper.fetch(keyword, use_cache=use_cache)
    time.sleep(config.RATE_LIMIT_DELAY)

    _update("Scoring")
    score = compute_gap_score(
        keyword=keyword,
        amazon_data=amazon_data,
        trends_data=trends_data,
        reddit_data=reddit_data,
        gbooks_data=gbooks_data,
        oplib_data=oplib_data,
    )

    return score


async def _analyse_all(
    keywords: List[str],
    use_cache: bool,
    output_dir: str,
    formats: List[str],
) -> List[Dict[str, Any]]:
    """Analyse all keywords with a Rich progress bar, then write reports."""
    from . import reports

    results: List[Dict[str, Any]] = []

    try:
        from rich.progress import (
            Progress,
            SpinnerColumn,
            TextColumn,
            BarColumn,
            TaskProgressColumn,
            TimeElapsedColumn,
        )
        use_rich = True
    except ImportError:
        use_rich = False

    if use_rich:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
        ) as progress:
            task_id = progress.add_task(
                "[cyan]Analysing keywords...[/cyan]", total=len(keywords)
            )
            for kw in keywords:
                score = await _analyse_keyword(
                    kw,
                    use_cache=use_cache,
                    progress=progress,
                    task_id=task_id,
                )
                results.append(score)
                progress.advance(task_id)
    else:
        for i, kw in enumerate(keywords, 1):
            print(f"[{i}/{len(keywords)}] Analysing: {kw}", file=sys.stderr)
            score = await _analyse_keyword(kw, use_cache=use_cache)
            results.append(score)

    # Write reports
    _write_reports(results, output_dir, formats)

    return results


def _write_reports(
    results: List[Dict[str, Any]],
    output_dir: str,
    formats: List[str],
) -> None:
    """Write result reports in the requested formats."""
    from . import reports

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base = out / f"niche_report_{timestamp}"

    do_all = "all" in formats

    if do_all or "table" in formats:
        reports.print_table(results)

    if do_all or "csv" in formats:
        reports.save_csv(results, str(base.with_suffix(".csv")))
        print(f"CSV  saved: {base.with_suffix('.csv')}")

    if do_all or "json" in formats:
        reports.save_json(results, str(base.with_suffix(".json")))
        print(f"JSON saved: {base.with_suffix('.json')}")

    if do_all or "md" in formats:
        reports.save_markdown(results, str(base.with_suffix(".md")))
        print(f"MD   saved: {base.with_suffix('.md')}")


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="niche-hunter",
        description="Amazon KDP Niche Gap Finder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  niche-hunter analyze 'low content books' 'kdp journals'\n"
            "  niche-hunter auto --seed 'self help' --expand 10\n"
            "  niche-hunter analyze 'yoga for seniors' --format json\n"
        ),
    )

    # Global flags
    parser.add_argument(
        "--no-cache",
        action="store_true",
        default=False,
        help="Disable disk cache (always fetch fresh data)",
    )
    parser.add_argument(
        "--output-dir",
        default=config.RESULTS_DIR,
        metavar="DIR",
        help=f"Directory for report files (default: {config.RESULTS_DIR})",
    )
    parser.add_argument(
        "--format",
        choices=["table", "csv", "json", "md", "all"],
        default="all",
        dest="fmt",
        help="Output format (default: all)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        default=False,
        help="Enable DEBUG logging",
    )

    sub = parser.add_subparsers(dest="command", required=True)

    # --- analyze sub-command ---
    analyze_p = sub.add_parser(
        "analyze",
        help="Analyse specific keywords",
        description="Analyse one or more explicit keywords.",
    )
    analyze_p.add_argument(
        "keywords",
        nargs="+",
        metavar="KEYWORD",
        help='Keywords to analyse (quote multi-word terms: "low content books")',
    )

    # --- auto sub-command ---
    auto_p = sub.add_parser(
        "auto",
        help="Auto-expand from a seed keyword",
        description="Start from a seed keyword, expand via Reddit, and analyse.",
    )
    auto_p.add_argument(
        "--seed",
        required=True,
        metavar="SEED",
        help="Seed keyword to expand from",
    )
    auto_p.add_argument(
        "--expand",
        type=int,
        default=10,
        metavar="N",
        help="Number of related keywords to expand to (default: 10)",
    )

    return parser


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def main(argv: Optional[List[str]] = None) -> int:
    """CLI entry point. Returns exit code."""
    parser = _build_parser()
    args = parser.parse_args(argv)

    # Configure logging
    log_level = logging.DEBUG if args.verbose else logging.WARNING
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
        datefmt="%H:%M:%S",
    )

    use_cache = not args.no_cache
    output_dir = args.output_dir
    formats = [args.fmt]

    if args.command == "analyze":
        keywords = args.keywords

    elif args.command == "auto":
        seed = args.seed
        n = args.expand
        print(f"Expanding '{seed}' → up to {n} related keywords via Reddit...")
        expanded = _expand_keywords_from_reddit(seed, n, use_cache)
        keywords = [seed] + expanded
        print(f"Keywords to analyse ({len(keywords)}): {', '.join(keywords)}")

    else:
        parser.print_help()
        return 1

    if not keywords:
        print("No keywords to analyse.", file=sys.stderr)
        return 1

    # Run the async pipeline
    try:
        results = asyncio.run(
            _analyse_all(keywords, use_cache, output_dir, formats)
        )
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        return 130
    except Exception as exc:
        logger.exception("Unexpected error: %s", exc)
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    priority_count = sum(1 for r in results if r.get("is_priority"))
    print(
        f"\nDone. {len(results)} keywords analysed, "
        f"{priority_count} priority niche(s) found."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
