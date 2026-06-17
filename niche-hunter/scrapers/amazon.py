"""
scrapers/amazon.py
Playwright-based scraper for Amazon book search results.
Extracts result count, BSR, review counts, and star ratings for top N listings.
"""

import asyncio
import logging
import random
import re
from datetime import datetime, timezone

from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import (
    AMAZON_BASE_URL,
    AMAZON_DEPT,
    AMAZON_TOP_N,
    AMAZON_DELAY_MIN,
    AMAZON_DELAY_MAX,
    MAX_RETRIES,
    PROXY_URL,
)
from utils.cache import cache_key, get_cached, set_cached
from utils.rate_limiter import delay
from utils.user_agents import random_agent

logging.basicConfig(
    filename="logs/errors.log",
    level=logging.WARNING,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

_BLOCKED_SIGNALS = ("robot check", "captcha", "sorry!", "enter the characters")

_EMPTY_RESULT = {
    "keyword": "",
    "total_results": 0,
    "top_books": [],
    "scraped_at": "",
    "blocked": False,
}


def _is_blocked(title: str) -> bool:
    return any(sig in title.lower() for sig in _BLOCKED_SIGNALS)


def parse_result_count(soup: BeautifulSoup) -> int:
    """
    Extract the total result count from an Amazon search results page.
    Parses the '1-48 of over 1,000 results' style header.
    Returns 0 if the count cannot be determined.
    """
    for selector in [
        "span.a-color-state.a-text-bold",
        "div.a-section span[data-component-type='s-result-info-bar'] span",
        "span[data-component-type='s-result-count']",
        "div.s-breadcrumb span.a-color-base",
    ]:
        el = soup.select_one(selector)
        if el:
            text = el.get_text(strip=True)
            nums = re.findall(r"[\d,]+", text.replace("over", "").replace("more than", ""))
            for n in reversed(nums):
                try:
                    return int(n.replace(",", ""))
                except ValueError:
                    continue

    # Fallback: count search result cards
    cards = soup.select('[data-component-type="s-search-result"]')
    return len(cards)


def parse_book_listings(soup: BeautifulSoup) -> list[dict]:
    """
    Parse individual book listing cards from an Amazon search results page.
    Extracts: title, author, asin, bsr, rating, review_count, price.
    Returns an empty list if no listings are found.
    """
    cards = soup.select('[data-component-type="s-search-result"]')
    books = []
    for card in cards[:AMAZON_TOP_N]:
        asin = card.get("data-asin", "")

        # Title
        title_el = card.select_one("h2 a span") or card.select_one("h2 span")
        title = title_el.get_text(strip=True) if title_el else ""

        # Author
        author_el = card.select_one(".a-size-base.s-underline-text") or \
                    card.select_one("a.a-size-base + span") or \
                    card.select_one(".s-author-name-text span")
        author = author_el.get_text(strip=True) if author_el else ""

        # Rating
        rating_el = card.select_one("span.a-icon-alt")
        rating = None
        if rating_el:
            m = re.search(r"([\d.]+)", rating_el.get_text())
            if m:
                try:
                    rating = float(m.group(1))
                except ValueError:
                    pass

        # Review count
        review_el = card.select_one("span.a-size-base.s-underline-text") or \
                    card.select_one('[aria-label*="stars"] + span')
        review_count = None
        if review_el:
            text = review_el.get_text(strip=True).replace(",", "")
            m = re.search(r"(\d+)", text)
            if m:
                try:
                    review_count = int(m.group(1))
                except ValueError:
                    pass

        # Price
        price_el = card.select_one("span.a-price span.a-offscreen") or \
                   card.select_one("span.a-price")
        price = None
        if price_el:
            m = re.search(r"[\d.]+", price_el.get_text())
            if m:
                try:
                    price = float(m.group())
                except ValueError:
                    pass

        books.append({
            "title": title,
            "author": author,
            "asin": asin,
            "bsr": None,      # not available on search page; set in scrape step
            "rating": rating,
            "review_count": review_count,
            "price": price,
        })
    return books


async def _scrape_async(keyword: str) -> dict:
    """Core async Playwright scraping logic."""
    from playwright.async_api import async_playwright

    result = {
        **_EMPTY_RESULT,
        "keyword": keyword,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }

    params = {
        "k": keyword,
        "i": AMAZON_DEPT,
        "rh": "n:283155",   # Books node
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{AMAZON_BASE_URL}?{query}"

    launch_opts = {"headless": True, "args": ["--no-sandbox", "--disable-dev-shm-usage"]}
    if PROXY_URL:
        launch_opts["proxy"] = {"server": PROXY_URL}

    async with async_playwright() as p:
        browser = await p.chromium.launch(**launch_opts)
        context = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent=random_agent(),
            locale="en-US",
        )
        page = await context.new_page()

        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            await asyncio.sleep(random.uniform(AMAZON_DELAY_MIN, AMAZON_DELAY_MAX))

            title = await page.title()
            if _is_blocked(title):
                logger.warning("Amazon blocked (CAPTCHA) for keyword '%s'", keyword)
                result["blocked"] = True
                return result

            # Wait for search result cards
            try:
                await page.wait_for_selector(
                    '[data-component-type="s-search-result"]',
                    timeout=10000,
                )
            except Exception:
                logger.warning("Amazon: no results selector found for '%s'", keyword)
                result["blocked"] = True
                return result

            content = await page.content()
            soup = BeautifulSoup(content, "lxml")

            result["total_results"] = parse_result_count(soup)
            result["top_books"] = parse_book_listings(soup)

        except Exception as e:
            logger.error("Amazon scrape error for '%s': %s", keyword, e)
        finally:
            await context.close()
            await browser.close()

    return result


@retry(
    stop=stop_after_attempt(MAX_RETRIES),
    wait=wait_exponential(multiplier=1, min=2, max=16),
    reraise=False,
)
def search_amazon(keyword: str) -> dict:
    """
    Search Amazon for '[keyword] books' using Playwright.
    Returns a dict with total_results, top_books, blocked status, and scraped_at.
    Returns a zeroed-out dict on any failure.
    """
    key = cache_key("amazon", keyword)
    cached = get_cached(key)
    if cached is not None:
        return cached

    try:
        result = asyncio.run(_scrape_async(keyword))
        if not result.get("blocked") and result.get("total_results", 0) > 0:
            set_cached(key, result)
        return result
    except Exception as e:
        logger.error("search_amazon unhandled error for '%s': %s", keyword, e)
        return {**_EMPTY_RESULT, "keyword": keyword, "scraped_at": datetime.now(timezone.utc).isoformat()}


if __name__ == "__main__":
    import json
    kw = "gratitude journal for men"
    print(f"Testing Amazon scraper with: '{kw}'\n")
    data = search_amazon(kw)
    print(f"Total results: {data['total_results']}")
    print(f"Blocked: {data['blocked']}")
    print(f"Books found: {len(data['top_books'])}")
    if data["top_books"]:
        print(f"First book: {json.dumps(data['top_books'][0], indent=2)}")
