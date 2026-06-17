"""
scrapers/open_library.py
Queries the Open Library search API to supplement book supply counts.
No authentication required.
"""

import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.cache import cache_key, get_cached, set_cached
from utils.rate_limiter import delay

logging.basicConfig(
    filename="logs/errors.log",
    level=logging.WARNING,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

BASE_URL = "https://openlibrary.org/search.json"


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(httpx.HTTPError),
    reraise=False,
)
def _fetch(keyword: str) -> dict:
    params = {"q": keyword, "limit": 1}
    with httpx.Client(timeout=15) as client:
        resp = client.get(BASE_URL, params=params)
        resp.raise_for_status()
        return resp.json()


def count_works(keyword: str) -> int:
    """
    Return numFound from Open Library search for the keyword.
    Returns 0 on any network or parse error.
    Caches result with 24hr TTL.
    """
    key = cache_key("oplib", keyword)
    cached = get_cached(key)
    if cached is not None:
        return cached.get("num_found", 0)

    try:
        delay(1.0, 2.0)
        data = _fetch(keyword)
        num_found = data.get("numFound", 0)
        set_cached(key, {"num_found": num_found})
        return num_found
    except Exception as e:
        logger.warning("Open Library count_works error for '%s': %s", keyword, e)
        return 0


if __name__ == "__main__":
    kw = "gratitude journal for men"
    print(f"Testing Open Library scraper with: '{kw}'\n")
    total = count_works(kw)
    print(f"Total works found: {total}")
