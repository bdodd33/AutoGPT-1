"""
tests/test_gap_score.py
Unit tests for the Gap Score algorithm.
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from analysis.gap_score import calculate_gap_score, is_priority, normalize
import config


# ── Fixtures ──────────────────────────────────────────────────────────────────

def _base_metrics(**overrides) -> dict:
    """Return a complete metrics dict with sensible defaults."""
    defaults = {
        "keyword":             "test niche",
        "trend_score":         50.0,
        "reddit_demand_score": 40.0,
        "amazon_result_count": 50,
        "top_books":           [],
        "amazon_blocked":      False,
        "google_books_count":  200,
        "open_library_count":  100,
    }
    defaults.update(overrides)
    return defaults


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_zero_supply_scores_high():
    """A keyword with 0 books across all sources should have supply_score near 100."""
    result = calculate_gap_score(_base_metrics(
        amazon_result_count=0,
        google_books_count=0,
        open_library_count=0,
    ))
    assert result["supply_score"] >= 95.0, (
        f"Expected supply_score ≥ 95 for 0 books, got {result['supply_score']}"
    )


def test_high_bsr_scores_high():
    """Books with BSR > 500,000 should produce competition_score > 70."""
    top_books = [
        {"bsr": 600_000, "review_count": 5,  "rating": 4.0},
        {"bsr": 750_000, "review_count": 8,  "rating": 3.8},
        {"bsr": 900_000, "review_count": 3,  "rating": 4.2},
    ]
    result = calculate_gap_score(_base_metrics(top_books=top_books))
    assert result["competition_score"] > 70.0, (
        f"Expected competition_score > 70 for high BSR books, got {result['competition_score']}"
    )


def test_weights_sum_to_one():
    """WEIGHT_DEMAND + WEIGHT_SUPPLY + WEIGHT_COMPETITION must equal 1.0."""
    total = config.WEIGHT_DEMAND + config.WEIGHT_SUPPLY + config.WEIGHT_COMPETITION
    assert abs(total - 1.0) < 1e-9, f"Weights sum to {total}, expected 1.0"


def test_gap_score_clipped_to_100():
    """Gap score must never exceed 100, even with perfect inputs."""
    result = calculate_gap_score(_base_metrics(
        trend_score=100.0,
        reddit_demand_score=100.0,
        amazon_result_count=0,
        google_books_count=0,
        open_library_count=0,
        top_books=[{"bsr": 999_999, "review_count": 1, "rating": 5.0}],
    ))
    assert result["gap_score"] <= 100.0, (
        f"gap_score exceeded 100: {result['gap_score']}"
    )
    assert result["gap_score"] >= 0.0, (
        f"gap_score below 0: {result['gap_score']}"
    )


def test_priority_flag_all_conditions():
    """is_priority() returns True only when ALL four threshold conditions are met."""
    # All conditions satisfied
    good_metrics = {
        "amazon_result_count": 50,           # < 100 ✓
        "trend_score":         60.0,          # >= 40 ✓
        "top_books": [
            {"bsr": 800_000, "review_count": 10, "rating": 4.0},
            {"bsr": 700_000, "review_count": 15, "rating": 3.9},
            {"bsr": 600_000, "review_count": 12, "rating": 4.1},
        ],
    }
    assert is_priority(75.0, good_metrics) is True

    # Fail: gap_score too low
    assert is_priority(65.0, good_metrics) is False

    # Fail: too many Amazon results
    assert is_priority(75.0, {**good_metrics, "amazon_result_count": 150}) is False

    # Fail: trend score too low
    assert is_priority(75.0, {**good_metrics, "trend_score": 30.0}) is False

    # Fail: too many reviews on top 3 books
    high_review_books = [
        {"bsr": 800_000, "review_count": 100, "rating": 4.0},
        {"bsr": 700_000, "review_count": 120, "rating": 3.9},
        {"bsr": 600_000, "review_count": 90,  "rating": 4.1},
    ]
    assert is_priority(75.0, {**good_metrics, "top_books": high_review_books}) is False


def test_normalize_clamps_correctly():
    """normalize() must clamp out-of-range values and handle edge cases."""
    assert normalize(50.0, 0.0, 100.0) == pytest.approx(50.0)
    assert normalize(-10.0, 0.0, 100.0) == pytest.approx(0.0)   # below min → 0
    assert normalize(200.0, 0.0, 100.0) == pytest.approx(100.0)  # above max → 100
    assert normalize(5.0, 5.0, 5.0)    == pytest.approx(0.0)    # div-by-zero safe


def test_amazon_blocked_gives_neutral_competition():
    """When Amazon is blocked, competition_score should be neutral (50)."""
    result = calculate_gap_score(_base_metrics(amazon_blocked=True))
    assert result["competition_score"] == pytest.approx(50.0), (
        f"Expected competition_score=50 when blocked, got {result['competition_score']}"
    )


def test_result_dict_has_all_required_keys():
    """calculate_gap_score() must return all required output fields."""
    required = {
        "keyword", "gap_score", "is_priority",
        "demand_score", "supply_score", "competition_score",
        "trend_score", "reddit_demand_score",
        "amazon_result_count", "google_books_count", "open_library_count",
        "avg_bsr", "avg_reviews", "avg_rating",
        "top_book_titles", "book_ideas",
    }
    result = calculate_gap_score(_base_metrics())
    missing = required - result.keys()
    assert not missing, f"Missing keys in result: {missing}"
