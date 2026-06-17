"""
analysis/gap_score.py
Gap Score calculation and priority classification.
Formula: Gap Score = (Demand × 0.40) + (Supply × 0.35) + (Competition × 0.25)
All input scores are expected in the 0–100 range.
"""

import config


def calculate_gap_score(
    demand_score: float,
    supply_score: float,
    competition_score: float,
) -> float:
    """
    Compute the weighted Gap Score from three normalised component scores.
    Returns a float in the range 0–100.
    Uses WEIGHT_DEMAND, WEIGHT_SUPPLY, WEIGHT_COMPETITION from config.
    """
    pass


def is_priority(gap_score: float, metrics: dict) -> bool:
    """
    Return True if the keyword meets all four PRIORITY thresholds:
      - gap_score >= PRIORITY_GAP_SCORE (default 70)
      - metrics['amazon_results'] < PRIORITY_MAX_RESULTS (default 100)
      - metrics['trend_score'] >= PRIORITY_MIN_TREND_SCORE (default 40)
      - metrics['top3_avg_reviews'] < PRIORITY_MAX_REVIEWS (default 50)
    Returns False if any threshold is not met or a metric is missing.
    """
    pass


def normalize(value: float, min_val: float, max_val: float) -> float:
    """
    Clamp and linearly scale `value` from [min_val, max_val] to [0, 100].
    Returns 0 if min_val == max_val to avoid division by zero.
    """
    pass
