"""
Google Trends scraper using pytrends.

Returns a 90-day average interest score (0–100) and the weekly series data
for a given keyword.  Falls back to zero on rate-limit or any other error.
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List

from .. import cache, config

logger = logging.getLogger(__name__)

_ZERO: Dict[str, Any] = {
    "trend_score": 0.0,
    "trend_data": [],
}


def _zero() -> Dict[str, Any]:
    import copy
    return copy.deepcopy(_ZERO)


def fetch(keyword: str, use_cache: bool = True) -> Dict[str, Any]:
    """
    Fetch Google Trends 90-day interest data for *keyword*.

    Returns dict with: trend_score (float 0–100), trend_data (list of floats).
    Never raises.
    """
    ck = cache.cache_key("google_trends", keyword)

    if use_cache:
        cached = cache.get(ck)
        if cached is not None:
            logger.debug("Google Trends cache hit for '%s'.", keyword)
            return cached

    for attempt in range(1, config.MAX_RETRIES + 1):
        try:
            data = _do_fetch(keyword)
            if use_cache:
                cache.set(ck, data)
            return data
        except Exception as exc:
            logger.warning(
                "Google Trends attempt %d/%d failed for '%s': %s",
                attempt, config.MAX_RETRIES, keyword, exc,
            )
            if attempt < config.MAX_RETRIES:
                # Exponential backoff with extra pause for rate limits
                backoff = 2 ** attempt + 5
                logger.debug("Sleeping %ds before retry.", backoff)
                time.sleep(backoff)

    return _zero()


def _do_fetch(keyword: str) -> Dict[str, Any]:
    """Inner function — may raise; caller handles retry/fallback."""
    try:
        from pytrends.request import TrendReq
    except ImportError:
        logger.warning("pytrends not installed; returning zero trend data.")
        return _zero()

    # Build a 90-day timeframe string
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=90)
    timeframe = (
        f"{start_date.strftime('%Y-%m-%d')} {end_date.strftime('%Y-%m-%d')}"
    )

    pytrends = TrendReq(
        hl="en-US",
        tz=360,
        timeout=(10, 25),
        retries=2,
        backoff_factor=0.5,
    )

    pytrends.build_payload(
        kw_list=[keyword],
        cat=0,
        timeframe=timeframe,
        geo="",
        gprop="",
    )

    interest_over_time = pytrends.interest_over_time()

    if interest_over_time is None or interest_over_time.empty:
        logger.debug("Google Trends returned empty data for '%s'.", keyword)
        return _zero()

    if keyword not in interest_over_time.columns:
        logger.debug("Keyword column missing in trends data for '%s'.", keyword)
        return _zero()

    series: List[float] = interest_over_time[keyword].tolist()
    # Filter out any NaN values
    series = [float(v) for v in series if v == v]  # NaN != NaN

    if not series:
        return _zero()

    trend_score = sum(series) / len(series)  # 0–100 already (Google Trends scale)

    return {
        "trend_score": round(min(100.0, max(0.0, trend_score)), 2),
        "trend_data": [round(v, 2) for v in series],
    }
