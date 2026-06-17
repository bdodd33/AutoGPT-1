"""
scrapers/google_books.py
Queries the Google Books API to measure published book supply for a keyword.
Works without an API key (uses public quota) but respects GOOGLE_BOOKS_API_KEY
from config for a higher rate limit.
"""

import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import GOOGLE_BOOKS_API_KEY
from utils.cache import cache_key, get_cached, set_cached
from utils.rate_limiter import delay

logging.basicConfig(
    filename="logs/errors.log",
    level=logging.WARNING,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

BASE_URL = "https://www.googleapis.com/books/v1/volumes"


def _build_params(keyword: str, max_results: int = 1) -> dict:
    params = {
        "q": f"{keyword}+subject:books",
        "maxResults": max_results,
        "printType": "books",
        "langRestrict": "en",
    }
    if GOOGLE_BOOKS_API_KEY:
        params["key"] = GOOGLE_BOOKS_API_KEY
    return params


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type(httpx.HTTPError),
    reraise=False,
)
def _fetch(params: dict) -> dict:
    with httpx.Client(timeout=15) as client:
        resp = client.get(BASE_URL, params=params)
        resp.raise_for_status()
        return resp.json()


def count_books(keyword: str) -> int:
    """
    Return totalItems from Google Books API for the keyword.
    Appends '+subject:books' to bias toward book results.
    Returns 0 on failure.
    """
    key = cache_key("gbooks", keyword)
    cached = get_cached(key)
    if cached is not None:
        return cached.get("total_items", 0)

    try:
        delay(1.0, 2.0)
        data = _fetch(_build_params(keyword, max_results=1))
        total = data.get("totalItems", 0)
        set_cached(key, {"total_items": total})
        return total
    except Exception as e:
        logger.warning("Google Books count_books error for '%s': %s", keyword, e)
        return 0


def get_top_books(keyword: str, limit: int = 5) -> list[dict]:
    """
    Return top N books from Google Books for the keyword.
    Each dict: {title, authors, published_date, categories, ratings_count}
    Returns an empty list on any error.
    """
    key = cache_key("gbooks_top", keyword)
    cached = get_cached(key)
    if cached is not None:
        return cached.get("books", [])

    try:
        delay(1.0, 2.0)
        data = _fetch(_build_params(keyword, max_results=limit))
        items = data.get("items") or []
        books = []
        for item in items:
            info = item.get("volumeInfo", {})
            books.append({
                "title": info.get("title", ""),
                "authors": info.get("authors", []),
                "published_date": info.get("publishedDate", ""),
                "categories": info.get("categories", []),
                "ratings_count": info.get("ratingsCount", 0),
            })
        set_cached(key, {"books": books})
        return books
    except Exception as e:
        logger.warning("Google Books get_top_books error for '%s': %s", keyword, e)
        return []


if __name__ == "__main__":
    import json
    kw = "gratitude journal for men"
    print(f"Testing Google Books scraper with: '{kw}'\n")
    total = count_books(kw)
    print(f"Total books found: {total}")
    top = get_top_books(kw, limit=3)
    print(f"Top books:\n{json.dumps(top, indent=2)}")
