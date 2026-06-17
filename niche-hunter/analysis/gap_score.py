"""
analysis/gap_score.py
Gap Score algorithm: combines demand, supply, and competition into a
single 0–100 opportunity score for a book niche keyword.
"""

import logging
import math
import statistics

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import (
    WEIGHT_DEMAND,
    WEIGHT_SUPPLY,
    WEIGHT_COMPETITION,
    PRIORITY_GAP_SCORE,
    PRIORITY_MAX_RESULTS,
    PRIORITY_MIN_TREND_SCORE,
    PRIORITY_MAX_REVIEWS,
)

logging.basicConfig(
    filename="logs/errors.log",
    level=logging.WARNING,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


def normalize(value: float, min_val: float, max_val: float) -> float:
    """
    Clamp and linearly scale `value` from [min_val, max_val] to [0, 100].
    Returns 0 if min_val == max_val to avoid division by zero.
    """
    if max_val == min_val:
        return 0.0
    return max(0.0, min(100.0, (value - min_val) / (max_val - min_val) * 100.0))


def _compute_demand(trend_score: float, reddit_demand_score: float) -> float:
    """Blend Trends (60%) + Reddit (40%), falling back if Trends is unavailable."""
    if trend_score == 0.0:
        logger.warning("trend_score is 0 — using Reddit demand alone for demand_score")
        return float(reddit_demand_score)
    return (trend_score * 0.60) + (reddit_demand_score * 0.40)


def _compute_supply(amazon_result_count: int, google_books_count: int, open_library_count: int) -> float:
    """
    Composite supply → logarithmic inversion so score 100 = 0 books, 0 = 1000+ books.
    """
    total = (
        (amazon_result_count * 0.50) +
        (google_books_count  * 0.30) +
        (open_library_count  * 0.20)
    )
    return max(0.0, 100.0 - (math.log10(total + 1) / math.log10(1001)) * 100.0)


def _compute_competition(top_books: list[dict], amazon_blocked: bool) -> tuple[float, float | None, float | None]:
    """
    Returns (competition_score, avg_bsr, avg_reviews).
    Returns (50.0, None, None) when Amazon data is unavailable.
    """
    if amazon_blocked or not top_books:
        return 50.0, None, None

    bsr_values     = [b["bsr"]          for b in top_books if b.get("bsr")]
    review_values  = [b["review_count"] for b in top_books if b.get("review_count") is not None]

    avg_bsr     = statistics.mean(bsr_values)     if bsr_values    else None
    avg_reviews = statistics.mean(review_values)  if review_values else None

    if avg_bsr is not None:
        bsr_score = min(100.0, (math.log10(avg_bsr + 1) / 6.0) * 100.0)
    else:
        bsr_score = 50.0

    if avg_reviews is not None:
        review_score = max(0.0, 100.0 - (math.log10(avg_reviews + 1) / math.log10(5001)) * 100.0)
    else:
        review_score = 50.0

    competition_score = (bsr_score * 0.60) + (review_score * 0.40)
    return competition_score, avg_bsr, avg_reviews


def _top3_avg_reviews(top_books: list[dict]) -> float:
    """Average review count of the top 3 books. Returns 999 if no data."""
    reviews = [b["review_count"] for b in top_books[:3] if b.get("review_count") is not None]
    return statistics.mean(reviews) if reviews else 999.0


def _avg_rating(top_books: list[dict]) -> float | None:
    ratings = [b["rating"] for b in top_books if b.get("rating") is not None]
    return statistics.mean(ratings) if ratings else None


def generate_book_ideas(keyword: str, metrics: dict) -> list[str]:
    """
    Return 5 book title ideas using template logic (no API call).
    """
    kw = keyword.title()
    return [
        f"The Complete Guide to {kw}",
        f"{kw}: A Beginner's Step-by-Step Handbook",
        f"The Hidden Truth About {kw} Nobody Tells You",
        f"30 Days to Mastering {kw}",
        f"{kw} for Busy People: Simple Strategies That Work",
    ]


def is_priority(gap_score: float, metrics: dict) -> bool:
    """
    Returns True only when ALL four threshold conditions are met:
    - gap_score >= PRIORITY_GAP_SCORE
    - amazon_result_count < PRIORITY_MAX_RESULTS
    - trend_score >= PRIORITY_MIN_TREND_SCORE
    - avg reviews of top 3 books < PRIORITY_MAX_REVIEWS
    """
    if gap_score < PRIORITY_GAP_SCORE:
        return False
    if metrics.get("amazon_result_count", 999) >= PRIORITY_MAX_RESULTS:
        return False
    if metrics.get("trend_score", 0.0) < PRIORITY_MIN_TREND_SCORE:
        return False
    top_books = metrics.get("top_books", [])
    if _top3_avg_reviews(top_books) >= PRIORITY_MAX_REVIEWS:
        return False
    return True


def calculate_gap_score(metrics: dict) -> dict:
    """
    Compute the Gap Score from raw scraper metrics.
    Returns a fully populated result dict ready for reporting.
    """
    keyword             = metrics.get("keyword", "")
    trend_score         = float(metrics.get("trend_score", 0.0))
    reddit_demand_score = float(metrics.get("reddit_demand_score", 0.0))
    amazon_result_count = int(metrics.get("amazon_result_count", 0))
    google_books_count  = int(metrics.get("google_books_count", 0))
    open_library_count  = int(metrics.get("open_library_count", 0))
    top_books           = metrics.get("top_books", [])
    amazon_blocked      = bool(metrics.get("amazon_blocked", False))

    demand_score                     = _compute_demand(trend_score, reddit_demand_score)
    supply_score                     = _compute_supply(amazon_result_count, google_books_count, open_library_count)
    competition_score, avg_bsr, avg_reviews = _compute_competition(top_books, amazon_blocked)

    raw_gap = (
        (demand_score      * WEIGHT_DEMAND)      +
        (supply_score      * WEIGHT_SUPPLY)      +
        (competition_score * WEIGHT_COMPETITION)
    )
    gap_score = round(min(100.0, max(0.0, raw_gap)), 2)

    result = {
        "keyword":             keyword,
        "gap_score":           gap_score,
        "is_priority":         False,   # filled in after
        "demand_score":        round(demand_score, 2),
        "supply_score":        round(supply_score, 2),
        "competition_score":   round(competition_score, 2),
        "trend_score":         round(trend_score, 2),
        "reddit_demand_score": round(reddit_demand_score, 2),
        "amazon_result_count": amazon_result_count,
        "google_books_count":  google_books_count,
        "open_library_count":  open_library_count,
        "avg_bsr":             round(avg_bsr, 2) if avg_bsr is not None else None,
        "avg_reviews":         round(avg_reviews, 2) if avg_reviews is not None else None,
        "avg_rating":          round(_avg_rating(top_books), 2) if _avg_rating(top_books) is not None else None,
        "top_book_titles":     [b["title"] for b in top_books[:3] if b.get("title")],
        "book_ideas":          generate_book_ideas(keyword, metrics),
    }
    result["is_priority"] = is_priority(gap_score, {**metrics, **result})
    return result
