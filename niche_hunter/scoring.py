"""
Gap Score computation for Niche Hunter.

Formula:
    Gap Score = (Demand × 0.40) + (Supply × 0.35) + (Competition × 0.25)

Component calculations
----------------------
Demand score:
    demand_score = (trend_score * 0.6) + (reddit_engagement * 0.4)

Supply score (inverse of total book count):
    total_books = amazon_total + google_books_total + open_library_total
    supply_score = max(0, 100 - min(100, (total_books / 5000) * 100))

Competition score (inverse of BSR and review density):
    bsr_component    = (1 - min(1, avg_bsr / 500_000)) * 100
    review_component = (1 - min(1, avg_reviews / 200)) * 100
    competition_score = (bsr_component + review_component) / 2

Priority Niche criteria:
    gap_score >= 70
    AND amazon_results < 100
    AND trend_score >= 40
    AND top3_avg_reviews < 50
"""

from typing import Any, Dict


def compute_gap_score(
    keyword: str,
    amazon_data: Dict[str, Any],
    trends_data: Dict[str, Any],
    reddit_data: Dict[str, Any],
    gbooks_data: Dict[str, Any],
    oplib_data: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Compute the gap score for *keyword* given scraper result dicts.

    Returns a dict with all scoring components and metadata.
    """
    # ------------------------------------------------------------------ #
    # Raw inputs                                                           #
    # ------------------------------------------------------------------ #
    trend_score: float = float(trends_data.get("trend_score", 0.0))
    reddit_engagement: float = float(reddit_data.get("engagement_score", 0.0))

    amazon_results: int = int(amazon_data.get("total_results", 0))
    avg_bsr: float = float(amazon_data.get("avg_bsr", 0.0))
    avg_reviews: float = float(amazon_data.get("avg_reviews", 0.0))
    top3_avg_reviews: float = float(amazon_data.get("top3_avg_reviews", 0.0))

    gbooks_count: int = int(gbooks_data.get("total_items", 0))
    oplib_count: int = int(oplib_data.get("total_items", 0))

    # ------------------------------------------------------------------ #
    # Demand Score (0–100)                                                 #
    # ------------------------------------------------------------------ #
    demand_score = (trend_score * 0.6) + (reddit_engagement * 0.4)
    demand_score = max(0.0, min(100.0, demand_score))

    # ------------------------------------------------------------------ #
    # Supply Score (0–100, high = low supply = good for author)            #
    # ------------------------------------------------------------------ #
    total_books = amazon_results + gbooks_count + oplib_count
    supply_score = max(0.0, 100.0 - min(100.0, (total_books / 5_000.0) * 100.0))

    # ------------------------------------------------------------------ #
    # Competition Score (0–100, high = low competition = good for author)  #
    # ------------------------------------------------------------------ #
    # If avg_bsr is 0 (not retrieved), treat as maximum competition on BSR.
    # However, if BSR is missing entirely we don't want to penalise too hard —
    # use review count alone when BSR is unavailable.
    if avg_bsr > 0:
        bsr_component = (1.0 - min(1.0, avg_bsr / 500_000.0)) * 100.0
    else:
        # No BSR data: use a neutral score of 50 (unknown)
        bsr_component = 50.0

    review_component = (1.0 - min(1.0, avg_reviews / 200.0)) * 100.0

    competition_score = (bsr_component + review_component) / 2.0
    competition_score = max(0.0, min(100.0, competition_score))

    # ------------------------------------------------------------------ #
    # Gap Score                                                            #
    # ------------------------------------------------------------------ #
    gap_score = (
        (demand_score * 0.40)
        + (supply_score * 0.35)
        + (competition_score * 0.25)
    )
    gap_score = max(0.0, min(100.0, gap_score))

    # ------------------------------------------------------------------ #
    # Priority flag                                                        #
    # ------------------------------------------------------------------ #
    is_priority = (
        gap_score >= 70.0
        and amazon_results < 100
        and trend_score >= 40.0
        and top3_avg_reviews < 50.0
    )

    return {
        "keyword": keyword,
        "demand_score": round(demand_score, 2),
        "supply_score": round(supply_score, 2),
        "competition_score": round(competition_score, 2),
        "gap_score": round(gap_score, 2),
        "is_priority": is_priority,
        "amazon_results": amazon_results,
        "trend_score": round(trend_score, 2),
        "top3_avg_reviews": round(top3_avg_reviews, 2),
        "avg_bsr": round(avg_bsr, 2),
        # Additional metadata useful for reports
        "reddit_engagement": round(reddit_engagement, 2),
        "total_books": total_books,
        "avg_reviews": round(avg_reviews, 2),
    }
