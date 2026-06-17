"""
utils/cache.py
Disk-based JSON cache for scraper results.
Keys are stored as SHA-256-hashed filenames under CACHE_DIR.
Entries expire after CACHE_TTL_HOURS hours (configurable in config.py).
"""


def get_cached(key: str) -> dict | None:
    """
    Return the cached dict for `key` if it exists and has not expired.
    Returns None on cache miss or if the entry is older than CACHE_TTL_HOURS.
    """
    pass


def set_cached(key: str, data: dict) -> None:
    """
    Write `data` to the cache under `key` with a current timestamp.
    Creates the cache directory if it does not exist.
    Writes atomically (temp file + rename) to avoid partial writes.
    """
    pass


def cache_key(prefix: str, keyword: str) -> str:
    """
    Build a stable, filesystem-safe cache key from a scraper prefix
    and a keyword string.  Returns a hex-encoded SHA-256 digest.
    """
    pass
