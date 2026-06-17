"""
Reddit scraper for Niche Hunter.

Uses PRAW when credentials are available, otherwise falls back to the
unauthenticated Reddit JSON search endpoint.

Returns: post_count, avg_score, engagement_score (0–100).
"""

import logging
import time
from typing import Any, Dict, List

import requests

from .. import cache, config

logger = logging.getLogger(__name__)

# Engagement score cap: post_count * avg_score values above this map to 100
_ENGAGEMENT_CAP = 50_000

_ZERO: Dict[str, Any] = {
    "post_count": 0,
    "avg_score": 0.0,
    "engagement_score": 0.0,
}


def _zero() -> Dict[str, Any]:
    import copy
    return copy.deepcopy(_ZERO)


def _engagement_score(post_count: int, avg_score: float) -> float:
    """Normalise (post_count * avg_score) to 0–100 using _ENGAGEMENT_CAP."""
    raw = post_count * max(0.0, avg_score)
    return round(min(100.0, (raw / _ENGAGEMENT_CAP) * 100), 2)


def fetch(keyword: str, use_cache: bool = True) -> Dict[str, Any]:
    """
    Fetch Reddit search data for *keyword*.

    Returns dict with: post_count, avg_score, engagement_score.
    Never raises.
    """
    ck = cache.cache_key("reddit", keyword)

    if use_cache:
        cached = cache.get(ck)
        if cached is not None:
            logger.debug("Reddit cache hit for '%s'.", keyword)
            return cached

    for attempt in range(1, config.MAX_RETRIES + 1):
        try:
            if _has_praw_credentials():
                data = _fetch_praw(keyword)
            else:
                data = _fetch_json(keyword)

            if use_cache:
                cache.set(ck, data)
            return data
        except Exception as exc:
            logger.warning(
                "Reddit attempt %d/%d failed for '%s': %s",
                attempt, config.MAX_RETRIES, keyword, exc,
            )
            if attempt < config.MAX_RETRIES:
                time.sleep(2 ** attempt)

    return _zero()


def _has_praw_credentials() -> bool:
    return bool(config.REDDIT_CLIENT_ID and config.REDDIT_CLIENT_SECRET)


def _fetch_praw(keyword: str) -> Dict[str, Any]:
    """Fetch Reddit data using PRAW (authenticated)."""
    try:
        import praw
    except ImportError:
        logger.warning("PRAW not installed; falling back to JSON endpoint.")
        return _fetch_json(keyword)

    reddit = praw.Reddit(
        client_id=config.REDDIT_CLIENT_ID,
        client_secret=config.REDDIT_CLIENT_SECRET,
        user_agent=config.REDDIT_USER_AGENT,
    )

    submissions = list(
        reddit.subreddit("all").search(
            query=keyword,
            sort="relevance",
            time_filter="year",  # last year covers ~3 months of popular content
            limit=100,
        )
    )

    if not submissions:
        return _zero()

    scores: List[float] = [float(s.score) for s in submissions]
    post_count = len(submissions)
    avg_score = sum(scores) / post_count

    return {
        "post_count": post_count,
        "avg_score": round(avg_score, 2),
        "engagement_score": _engagement_score(post_count, avg_score),
    }


def _fetch_json(keyword: str) -> Dict[str, Any]:
    """Fetch Reddit data via the unauthenticated JSON search endpoint."""
    headers = {
        "User-Agent": config.REDDIT_USER_AGENT or "NicheHunter/1.0",
        "Accept": "application/json",
    }
    params = {
        "q": keyword,
        "sort": "relevance",
        "t": "year",
        "limit": 100,
        "type": "link",
    }
    url = "https://www.reddit.com/search.json"

    resp = requests.get(
        url,
        headers=headers,
        params=params,
        timeout=15,
    )
    resp.raise_for_status()
    data = resp.json()

    children = data.get("data", {}).get("children", [])
    if not children:
        return _zero()

    scores: List[float] = [
        float(c.get("data", {}).get("score", 0)) for c in children
    ]
    post_count = len(scores)
    avg_score = sum(scores) / post_count if post_count else 0.0

    return {
        "post_count": post_count,
        "avg_score": round(avg_score, 2),
        "engagement_score": _engagement_score(post_count, avg_score),
    }
