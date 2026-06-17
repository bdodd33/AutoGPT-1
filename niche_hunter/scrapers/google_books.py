"""
Google Books API scraper.

Uses the Google Books REST API (free tier) to estimate total book supply
for a keyword.  Returns `total_items` (the `totalItems` field from the API).

Falls back to 0 on any error.
"""

import logging
import time
from typing import Any, Dict

import requests

from .. import cache, config

logger = logging.getLogger(__name__)

_BASE_URL = "https://www.googleapis.com/books/v1/volumes"

_ZERO: Dict[str, Any] = {
    "total_items": 0,
}


def _zero() -> Dict[str, Any]:
    import copy
    return copy.deepcopy(_ZERO)


def fetch(keyword: str, use_cache: bool = True) -> Dict[str, Any]:
    """
    Fetch total book count for *keyword* from the Google Books API.

    Returns dict with: total_items (int).
    Never raises.
    """
    ck = cache.cache_key("google_books", keyword)

    if use_cache:
        cached = cache.get(ck)
        if cached is not None:
            logger.debug("Google Books cache hit for '%s'.", keyword)
            return cached

    for attempt in range(1, config.MAX_RETRIES + 1):
        try:
            data = _do_fetch(keyword)
            if use_cache:
                cache.set(ck, data)
            return data
        except requests.HTTPError as exc:
            status = exc.response.status_code if exc.response is not None else 0
            logger.warning(
                "Google Books HTTP %d on attempt %d/%d for '%s'.",
                status, attempt, config.MAX_RETRIES, keyword,
            )
            if status == 429 or status >= 500:
                if attempt < config.MAX_RETRIES:
                    time.sleep(2 ** attempt)
            else:
                # Client-side error (e.g., 400) — don't retry
                break
        except Exception as exc:
            logger.warning(
                "Google Books attempt %d/%d failed for '%s': %s",
                attempt, config.MAX_RETRIES, keyword, exc,
            )
            if attempt < config.MAX_RETRIES:
                time.sleep(2 ** attempt)

    return _zero()


def _do_fetch(keyword: str) -> Dict[str, Any]:
    """Inner fetch — may raise; caller handles retry/fallback."""
    params: Dict[str, Any] = {
        "q": keyword,
        "maxResults": 1,  # We only need totalItems
        "printType": "books",
        "langRestrict": "en",
    }
    if config.GOOGLE_BOOKS_API_KEY:
        params["key"] = config.GOOGLE_BOOKS_API_KEY

    resp = requests.get(
        _BASE_URL,
        params=params,
        timeout=15,
        headers={"Accept": "application/json"},
    )
    resp.raise_for_status()

    payload = resp.json()
    total_items = int(payload.get("totalItems", 0))

    logger.debug("Google Books '%s' → %d items.", keyword, total_items)
    return {"total_items": total_items}
