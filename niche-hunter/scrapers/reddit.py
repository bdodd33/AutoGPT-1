"""
scrapers/reddit.py
Measures reader demand for a keyword by searching relevant book subreddits.
Uses PRAW when credentials are configured, otherwise falls back to the
unauthenticated Reddit JSON search endpoint.
"""


def search_reddit(keyword: str) -> list[dict]:
    """
    Search Reddit for posts mentioning the keyword across REDDIT_SUBREDDITS.
    Each returned dict contains: title, score, num_comments, created_utc, url.
    Falls back gracefully to an empty list on auth failure or rate limiting.
    """
    pass


def score_demand_from_reddit(posts: list[dict]) -> float:
    """
    Convert a list of Reddit post dicts into a single demand score (0–100).
    Score is derived from post count × average (score + num_comments),
    normalised against a reasonable ceiling.
    Returns 0.0 for an empty post list.
    """
    pass
