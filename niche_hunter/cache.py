"""
Disk-based JSON cache for Niche Hunter scrapers.

Keys are (scraper_name, query) tuples stored as JSON files under CACHE_DIR.
Default TTL is 24 hours; each entry stores a timestamp for expiry checking.
"""

import hashlib
import json
import logging
import os
import time
from pathlib import Path
from typing import Any, Optional

from . import config

logger = logging.getLogger(__name__)

# Default cache time-to-live in seconds (24 hours)
DEFAULT_TTL: int = 86_400


def _cache_dir() -> Path:
    """Return the resolved cache directory, creating it if necessary."""
    directory = Path(config.CACHE_DIR)
    if not directory.is_absolute():
        # Resolve relative to cwd at runtime
        directory = Path.cwd() / directory
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def cache_key(scraper: str, query: str) -> str:
    """
    Return a stable, filesystem-safe cache key for a (scraper, query) pair.

    Uses a SHA-256 prefix to avoid path-length and special-character issues
    while keeping the filename human-readable.
    """
    raw = f"{scraper}::{query}".lower().strip()
    digest = hashlib.sha256(raw.encode()).hexdigest()[:16]
    # Build a slug from the query (first 40 chars, safe chars only)
    slug = "".join(c if c.isalnum() or c in "-_" else "_" for c in query[:40])
    return f"{scraper}__{slug}__{digest}"


def _cache_path(key: str) -> Path:
    return _cache_dir() / f"{key}.json"


def get(key: str, ttl: int = DEFAULT_TTL) -> Optional[Any]:
    """
    Retrieve a cached value by key.

    Returns ``None`` if the entry does not exist or has expired.
    """
    path = _cache_path(key)
    if not path.exists():
        return None

    try:
        with path.open("r", encoding="utf-8") as fh:
            entry = json.load(fh)
    except (json.JSONDecodeError, OSError) as exc:
        logger.debug("Cache read error for %s: %s", key, exc)
        return None

    cached_at = entry.get("cached_at", 0)
    if (time.time() - cached_at) > ttl:
        logger.debug("Cache expired for key: %s", key)
        return None

    logger.debug("Cache hit for key: %s", key)
    return entry.get("value")


def set(key: str, value: Any) -> None:  # noqa: A001 — intentional shadowing of builtin
    """
    Store *value* under *key* in the cache.

    The entry is written atomically via a temp file to avoid partial writes.
    """
    path = _cache_path(key)
    entry = {
        "cached_at": time.time(),
        "value": value,
    }

    tmp_path = path.with_suffix(".tmp")
    try:
        with tmp_path.open("w", encoding="utf-8") as fh:
            json.dump(entry, fh, ensure_ascii=False, indent=2)
        tmp_path.replace(path)
        logger.debug("Cache set for key: %s", key)
    except OSError as exc:
        logger.warning("Cache write error for %s: %s", key, exc)
        try:
            tmp_path.unlink(missing_ok=True)
        except OSError:
            pass


def invalidate(key: str) -> None:
    """Delete a single cache entry if it exists."""
    path = _cache_path(key)
    try:
        path.unlink(missing_ok=True)
        logger.debug("Cache invalidated for key: %s", key)
    except OSError as exc:
        logger.debug("Cache invalidation error for %s: %s", key, exc)


def clear_all() -> int:
    """Delete all cache files. Returns the number of files removed."""
    directory = _cache_dir()
    removed = 0
    for p in directory.glob("*.json"):
        try:
            p.unlink()
            removed += 1
        except OSError:
            pass
    logger.info("Cleared %d cache entries.", removed)
    return removed
