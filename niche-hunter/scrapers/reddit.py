"""
scrapers/reddit.py
Measures reader demand for a keyword by searching relevant book subreddits.
Uses Reddit's public JSON search endpoint (no auth needed for read-only).
Falls back to PRAW if credentials are configured.
"""

import logging

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import REDDIT_SUBREDDITS, REDDIT_POST_LIMIT, REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USER_AGENT
from utils.cache import cache_key, get_cached, set_cached
from utils.rate_limiter import delay

logging.basicConfig(
    filename="logs/errors.log",
    level=logging.WARNING,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

_HEADERS = {
    "User-Agent": "niche-hunter/1.0 (research tool)",
    "Accept": "application/json",
}
_DEMAND_CEIL = 5000.0   # normalization ceiling for score_demand_from_reddit


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
    retry=retry_if_exception_type(httpx.HTTPError),
    reraise=False,
)
def _fetch_subreddit(client: httpx.Client, subreddit: str, keyword: str, limit: int) -> list[dict]:
    url = f"https://www.reddit.com/r/{subreddit}/search.json"
    params = {
        "q": keyword,
        "sort": "top",
        "t": "year",
        "limit": min(limit, 100),
        "restrict_sr": "true",
    }
    resp = client.get(url, params=params, headers=_HEADERS)
    resp.raise_for_status()
    data = resp.json()
    posts = []
    for child in data.get("data", {}).get("children", []):
        p = child.get("data", {})
        posts.append({
            "subreddit": subreddit,
            "title": p.get("title", ""),
            "score": int(p.get("score", 0)),
            "num_comments": int(p.get("num_comments", 0)),
            "url": p.get("url", ""),
            "created_utc": float(p.get("created_utc", 0)),
        })
    return posts


def _search_with_praw(keyword: str) -> list[dict]:
    """Try PRAW if credentials are present; return posts list or raise."""
    import praw
    reddit = praw.Reddit(
        client_id=REDDIT_CLIENT_ID,
        client_secret=REDDIT_CLIENT_SECRET,
        user_agent=REDDIT_USER_AGENT,
    )
    posts = []
    per_sub = max(1, REDDIT_POST_LIMIT // len(REDDIT_SUBREDDITS))
    for sub in REDDIT_SUBREDDITS:
        try:
            subreddit = reddit.subreddit(sub)
            for submission in subreddit.search(keyword, sort="top", time_filter="year", limit=per_sub):
                posts.append({
                    "subreddit": sub,
                    "title": submission.title,
                    "score": submission.score,
                    "num_comments": submission.num_comments,
                    "url": submission.url,
                    "created_utc": submission.created_utc,
                })
        except Exception as e:
            logger.warning("PRAW error on r/%s for '%s': %s", sub, keyword, e)
    return posts


def search_reddit(keyword: str) -> list[dict]:
    """
    Search Reddit for posts mentioning the keyword across REDDIT_SUBREDDITS.
    Caps at REDDIT_POST_LIMIT total posts. Caches result with 24hr TTL.
    Returns an empty list on failure.
    """
    key = cache_key("reddit", keyword)
    cached = get_cached(key)
    if cached is not None:
        return cached.get("posts", [])

    posts: list[dict] = []

    # Try PRAW first if credentials available
    if REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET:
        try:
            posts = _search_with_praw(keyword)
        except Exception as e:
            logger.warning("PRAW unavailable, falling back to JSON API: %s", e)

    # Fall back to public JSON API
    if not posts:
        per_sub = max(1, REDDIT_POST_LIMIT // len(REDDIT_SUBREDDITS))
        try:
            with httpx.Client(timeout=15, follow_redirects=True) as client:
                for sub in REDDIT_SUBREDDITS:
                    if len(posts) >= REDDIT_POST_LIMIT:
                        break
                    try:
                        delay(1.0, 2.0)
                        sub_posts = _fetch_subreddit(client, sub, keyword, per_sub)
                        posts.extend(sub_posts)
                    except Exception as e:
                        logger.warning("Reddit JSON API error on r/%s for '%s': %s", sub, keyword, e)
        except Exception as e:
            logger.warning("Reddit search_reddit error for '%s': %s", keyword, e)

    posts = posts[:REDDIT_POST_LIMIT]
    set_cached(key, {"posts": posts})
    return posts


def score_demand_from_reddit(posts: list[dict]) -> float:
    """
    Convert Reddit posts into a demand score (0–100).
    Logic: sum (score + num_comments * 3) for each post, normalize against _DEMAND_CEIL.
    Returns 0.0 for an empty post list.
    """
    if not posts:
        return 0.0
    total = sum(p.get("score", 0) + p.get("num_comments", 0) * 3 for p in posts)
    return min(100.0, (total / _DEMAND_CEIL) * 100.0)


if __name__ == "__main__":
    import json
    kw = "gratitude journal for men"
    print(f"Testing Reddit scraper with: '{kw}'\n")
    posts = search_reddit(kw)
    print(f"Posts found: {len(posts)}")
    if posts:
        print(f"Sample post: {json.dumps(posts[0], indent=2)}")
    score = score_demand_from_reddit(posts)
    print(f"Demand score: {score:.2f}")
