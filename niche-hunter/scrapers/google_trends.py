"""
scrapers/google_trends.py
Pulls search-interest data from Google Trends via the pytrends library.
Uses the 90-day window and Books & Literature category defined in config.
"""

import logging
import time

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import TRENDS_TIMEFRAME, TRENDS_GEO, TRENDS_CATEGORY
from utils.cache import cache_key, get_cached, set_cached

logging.basicConfig(
    filename="logs/errors.log",
    level=logging.WARNING,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

_PYTRENDS_DELAY = 5.0   # seconds between every pytrends call


def _build_pytrends():
    from pytrends.request import TrendReq
    return TrendReq(hl="en-US", tz=360, timeout=(10, 25))


def get_trend_score(keyword: str) -> float:
    """
    Return average interest score (0–100) over the past 90 days
    for the given keyword, filtered to Books & Literature category.
    Returns 0.0 if pytrends fails or returns no data.
    """
    key = cache_key("trends", keyword)
    cached = get_cached(key)
    if cached is not None:
        return cached.get("trend_score", 0.0)

    try:
        time.sleep(_PYTRENDS_DELAY)
        pt = _build_pytrends()
        pt.build_payload(
            [keyword],
            cat=TRENDS_CATEGORY,
            timeframe=TRENDS_TIMEFRAME,
            geo=TRENDS_GEO,
        )
        df = pt.interest_over_time()
        if df is None or df.empty:
            set_cached(key, {"trend_score": 0.0})
            return 0.0
        col = keyword if keyword in df.columns else df.columns[0]
        score = float(df[col].mean())
        set_cached(key, {"trend_score": score})
        return score
    except Exception as e:
        logger.warning("Google Trends get_trend_score error for '%s': %s", keyword, e)
        return 0.0


def get_rising_queries(category: int = TRENDS_CATEGORY) -> list[str]:
    """
    Return top 20 rising search queries in the Books category.
    Uses timeframe 'today 3-m' and geo 'US'.
    Strips any '+%' suffixes from rising query labels.
    Returns empty list on failure.
    """
    key = cache_key("trends_rising", str(category))
    cached = get_cached(key)
    if cached is not None:
        return cached.get("queries", [])

    try:
        time.sleep(_PYTRENDS_DELAY)
        pt = _build_pytrends()
        pt.build_payload(
            [""],
            cat=category,
            timeframe="today 3-m",
            geo=TRENDS_GEO,
        )
        related = pt.related_queries()
        queries = []
        for kw_data in related.values():
            if kw_data and kw_data.get("rising") is not None:
                df = kw_data["rising"]
                if hasattr(df, "iterrows"):
                    for _, row in df.head(20).iterrows():
                        q = str(row.get("query", "")).replace("+%", "").strip()
                        if q:
                            queries.append(q)
        queries = list(dict.fromkeys(queries))[:20]
        set_cached(key, {"queries": queries})
        return queries
    except Exception as e:
        logger.warning("Google Trends get_rising_queries error (cat=%s): %s", category, e)
        return []


def get_related_queries(keyword: str) -> list[str]:
    """
    Return up to 10 related queries for a keyword.
    Combines 'top' and 'rising' related queries, deduplicated.
    Returns empty list on failure.
    """
    key = cache_key("trends_related", keyword)
    cached = get_cached(key)
    if cached is not None:
        return cached.get("queries", [])

    try:
        time.sleep(_PYTRENDS_DELAY)
        pt = _build_pytrends()
        pt.build_payload(
            [keyword],
            cat=TRENDS_CATEGORY,
            timeframe=TRENDS_TIMEFRAME,
            geo=TRENDS_GEO,
        )
        related = pt.related_queries()
        queries = []
        for kw_data in related.values():
            if not kw_data:
                continue
            for kind in ("top", "rising"):
                df = kw_data.get(kind)
                if df is not None and hasattr(df, "iterrows"):
                    for _, row in df.head(10).iterrows():
                        q = str(row.get("query", "")).replace("+%", "").strip()
                        if q and q not in queries:
                            queries.append(q)
        queries = queries[:10]
        set_cached(key, {"queries": queries})
        return queries
    except Exception as e:
        logger.warning("Google Trends get_related_queries error for '%s': %s", keyword, e)
        return []


if __name__ == "__main__":
    kw = "gratitude journal for men"
    print(f"Testing Google Trends scraper with: '{kw}'\n")
    score = get_trend_score(kw)
    print(f"Trend score (90-day avg): {score:.2f}")
    related = get_related_queries(kw)
    print(f"Related queries: {related}")
