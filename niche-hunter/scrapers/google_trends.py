"""
scrapers/google_trends.py
Pulls search-interest data from Google Trends via the pytrends library.
Uses the 90-day window and Books & Literature category defined in config.
"""


def get_trend_score(keyword: str) -> float:
    """
    Fetch Google Trends interest-over-time for the keyword over the last 90 days.
    Returns the average weekly interest value (0–100).
    Falls back to 0.0 on rate-limit errors or any other exception.
    """
    pass


def get_rising_queries(category: int) -> list[str]:
    """
    Fetch the current 'rising' related queries for the given Trends category.
    Used by --auto mode to discover trending keywords without a seed.
    Returns a list of keyword strings (may be empty on failure).
    """
    pass


def get_related_queries(keyword: str) -> list[str]:
    """
    Fetch related queries for a given keyword from Google Trends.
    Returns both 'top' and 'rising' related terms combined and deduplicated.
    Returns an empty list on failure.
    """
    pass
