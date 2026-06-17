"""
Amazon scraper using Playwright (async).

Searches Amazon for "[keyword] books" and extracts the top 10 results,
including title, ASIN, Best Seller Rank (BSR), review count, and star rating.

On any error or block the function returns a safe zero-value dict.
"""

import asyncio
import logging
import random
import re
from typing import Any, Dict, List, Optional

from .. import cache, config

logger = logging.getLogger(__name__)

# Realistic desktop User-Agent strings
_USER_AGENTS = [
    (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/119.0.0.0 Safari/537.36"
    ),
    (
        "Mozilla/5.0 (X11; Linux x86_64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/118.0.0.0 Safari/537.36"
    ),
]

_ZERO_RESULT: Dict[str, Any] = {
    "results": [],
    "total_results": 0,
    "avg_bsr": 0.0,
    "avg_reviews": 0.0,
    "top3_avg_reviews": 0.0,
}


def _zero() -> Dict[str, Any]:
    import copy
    return copy.deepcopy(_ZERO_RESULT)


def _parse_number(text: str) -> float:
    """Extract the first numeric value from a string, handling commas."""
    text = text.replace(",", "").replace(".", "").strip()
    match = re.search(r"\d+", text)
    return float(match.group()) if match else 0.0


def _parse_bsr(text: str) -> float:
    """
    Parse a BSR string like '#1,234 in Books' → 1234.0.
    Returns 0 if not parseable.
    """
    text = text.replace(",", "")
    match = re.search(r"#([\d]+)", text)
    return float(match.group(1)) if match else 0.0


async def _scrape_with_playwright(keyword: str) -> Dict[str, Any]:
    """Inner coroutine that drives Playwright. May raise — caller catches."""
    try:
        from playwright.async_api import async_playwright, TimeoutError as PWTimeout
    except ImportError:
        logger.warning("Playwright not installed; returning zero Amazon data.")
        return _zero()

    search_query = f"{keyword} books"
    url = f"https://www.amazon.com/s?k={search_query.replace(' ', '+')}&i=stripbooks"

    results: List[Dict[str, Any]] = []

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent=random.choice(_USER_AGENTS),
            viewport={"width": 1280, "height": 800},
            locale="en-US",
            extra_http_headers={
                "Accept-Language": "en-US,en;q=0.9",
                "Accept": (
                    "text/html,application/xhtml+xml,application/xml;"
                    "q=0.9,image/webp,*/*;q=0.8"
                ),
            },
        )
        page = await context.new_page()

        try:
            # Random pre-navigation delay
            await asyncio.sleep(random.uniform(1.0, 3.0))

            await page.goto(url, timeout=30_000, wait_until="domcontentloaded")
            await asyncio.sleep(random.uniform(1.0, 2.5))

            # Check for CAPTCHA / robot check
            page_text = await page.inner_text("body")
            if any(
                phrase in page_text.lower()
                for phrase in ["robot", "captcha", "enter the characters"]
            ):
                logger.warning("Amazon returned a CAPTCHA for '%s'.", keyword)
                await browser.close()
                return _zero()

            # Collect search result cards
            cards = await page.query_selector_all(
                "div[data-component-type='s-search-result']"
            )
            if not cards:
                # Fallback selector
                cards = await page.query_selector_all(
                    "[data-asin]:not([data-asin=''])"
                )

            for card in cards[:10]:
                try:
                    asin = await card.get_attribute("data-asin") or ""

                    # Title
                    title_el = await card.query_selector("h2 span, h2 a span")
                    title = (await title_el.inner_text()).strip() if title_el else ""

                    # Review count
                    review_el = await card.query_selector(
                        "span[aria-label*='ratings'], "
                        "span[aria-label*='stars'] + span, "
                        "a span.a-size-base"
                    )
                    review_text = (
                        (await review_el.inner_text()).strip() if review_el else "0"
                    )
                    reviews = _parse_number(review_text)

                    # Star rating
                    star_el = await card.query_selector(
                        "span[aria-label*='out of 5 stars']"
                    )
                    star_text = (
                        (await star_el.get_attribute("aria-label") or "0")
                        if star_el
                        else "0"
                    )
                    star_match = re.search(r"([\d.]+) out of", star_text)
                    stars = float(star_match.group(1)) if star_match else 0.0

                    results.append(
                        {
                            "asin": asin,
                            "title": title,
                            "bsr": 0.0,  # BSR requires product page visit
                            "reviews": reviews,
                            "stars": stars,
                        }
                    )
                except Exception as exc:
                    logger.debug("Error parsing result card: %s", exc)
                    continue

            # Estimate total results from result-info string
            total_results = 0
            try:
                info_el = await page.query_selector(
                    "div[data-component-type='s-result-info-bar'] span, "
                    "span.a-color-state.a-text-bold"
                )
                if info_el:
                    info_text = await info_el.inner_text()
                    # e.g. "1-16 of over 2,000 results"
                    m = re.search(r"of\s+(?:over\s+)?([\d,]+)\s+results", info_text)
                    if m:
                        total_results = int(m.group(1).replace(",", ""))
            except Exception:
                pass

            # Try to visit the first product page for BSR data
            if results and results[0]["asin"]:
                try:
                    await asyncio.sleep(random.uniform(1.0, 2.5))
                    product_url = (
                        f"https://www.amazon.com/dp/{results[0]['asin']}"
                    )
                    await page.goto(
                        product_url, timeout=20_000, wait_until="domcontentloaded"
                    )
                    await asyncio.sleep(random.uniform(0.5, 1.5))
                    bsr_el = await page.query_selector(
                        "#SalesRank, "
                        "span:text-is('Best Sellers Rank') + td, "
                        "li:has-text('Best Sellers Rank')"
                    )
                    if bsr_el:
                        bsr_text = await bsr_el.inner_text()
                        bsr = _parse_bsr(bsr_text)
                        results[0]["bsr"] = bsr
                except Exception as exc:
                    logger.debug("Could not fetch BSR for ASIN %s: %s",
                                 results[0].get("asin"), exc)

        except PWTimeout:
            logger.warning("Playwright timed out scraping Amazon for '%s'.", keyword)
        except Exception as exc:
            logger.warning("Playwright error for '%s': %s", keyword, exc)
        finally:
            try:
                await browser.close()
            except Exception:
                pass

    if not results:
        return _zero()

    review_counts = [r["reviews"] for r in results if r["reviews"] > 0]
    avg_reviews = sum(review_counts) / len(review_counts) if review_counts else 0.0

    bsr_values = [r["bsr"] for r in results if r["bsr"] > 0]
    avg_bsr = sum(bsr_values) / len(bsr_values) if bsr_values else 0.0

    top3_reviews = [r["reviews"] for r in results[:3] if r["reviews"] > 0]
    top3_avg_reviews = (
        sum(top3_reviews) / len(top3_reviews) if top3_reviews else 0.0
    )

    return {
        "results": results,
        "total_results": total_results,
        "avg_bsr": avg_bsr,
        "avg_reviews": avg_reviews,
        "top3_avg_reviews": top3_avg_reviews,
    }


async def fetch(keyword: str, use_cache: bool = True) -> Dict[str, Any]:
    """
    Fetch Amazon book search data for *keyword*.

    Returns a dict with keys: results, total_results, avg_bsr,
    avg_reviews, top3_avg_reviews.  Never raises.
    """
    ck = cache.cache_key("amazon", keyword)

    if use_cache:
        cached = cache.get(ck)
        if cached is not None:
            logger.debug("Amazon cache hit for '%s'.", keyword)
            return cached

    for attempt in range(1, config.MAX_RETRIES + 1):
        try:
            data = await _scrape_with_playwright(keyword)
            if use_cache:
                cache.set(ck, data)
            return data
        except Exception as exc:
            logger.warning(
                "Amazon scrape attempt %d/%d failed for '%s': %s",
                attempt, config.MAX_RETRIES, keyword, exc,
            )
            if attempt < config.MAX_RETRIES:
                await asyncio.sleep(2 ** attempt)

    return _zero()
