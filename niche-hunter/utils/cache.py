"""
utils/cache.py
Disk-based JSON cache for scraper results.
Keys are stored as hashed filenames under CACHE_DIR.
Entries expire after CACHE_TTL_HOURS hours (configurable in config.py).
"""

import json
import hashlib
import os
import time
import logging

from config import CACHE_DIR, CACHE_TTL_HOURS

logger = logging.getLogger(__name__)


def cache_key(prefix: str, keyword: str) -> str:
    """Generate a safe filename from prefix + keyword."""
    h = hashlib.md5(keyword.lower().encode()).hexdigest()[:10]
    return f"{prefix}_{h}"


def _cache_path(key: str) -> str:
    return os.path.join(CACHE_DIR, f"{key}.json")


def get_cached(key: str) -> dict | None:
    """
    Return cached data if it exists and is within TTL.
    Returns None if missing or expired.
    """
    path = _cache_path(key)
    if not os.path.exists(path):
        return None
    try:
        with open(path) as f:
            entry = json.load(f)
        age_hours = (time.time() - entry["_cached_at"]) / 3600
        if age_hours > CACHE_TTL_HOURS:
            return None
        return entry["data"]
    except Exception as e:
        logger.warning("Cache read error for key %s: %s", key, e)
        return None


def set_cached(key: str, data: dict) -> None:
    """Write data to cache as JSON with a timestamp."""
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = _cache_path(key)
    tmp_path = path + ".tmp"
    try:
        entry = {"_cached_at": time.time(), "data": data}
        with open(tmp_path, "w") as f:
            json.dump(entry, f, indent=2, default=str)
        os.replace(tmp_path, path)
    except Exception as e:
        logger.warning("Cache write error for key %s: %s", key, e)
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
