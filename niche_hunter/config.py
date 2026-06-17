"""
Configuration loader for Niche Hunter.

Reads from environment variables / .env file and exposes typed config values.
"""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from the project root (two levels up from this file)
_env_path = Path(__file__).parent.parent / ".env"
if _env_path.exists():
    load_dotenv(_env_path)

# Also try a .env.niche file for niche-hunter-specific config
_env_niche_path = Path(__file__).parent.parent / ".env.niche"
if _env_niche_path.exists():
    load_dotenv(_env_niche_path, override=True)


def _get_env(key: str, default: str = "") -> str:
    return os.environ.get(key, default)


def _get_float(key: str, default: float) -> float:
    try:
        return float(os.environ.get(key, default))
    except (TypeError, ValueError):
        return default


def _get_int(key: str, default: int) -> int:
    try:
        return int(os.environ.get(key, default))
    except (TypeError, ValueError):
        return default


# Reddit API credentials
REDDIT_CLIENT_ID: str = _get_env("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET: str = _get_env("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT: str = _get_env("REDDIT_USER_AGENT", "NicheHunter/1.0")

# Google Books API
GOOGLE_BOOKS_API_KEY: str = _get_env("GOOGLE_BOOKS_API_KEY", "")

# Filesystem paths
CACHE_DIR: str = _get_env("CACHE_DIR", "cache")
RESULTS_DIR: str = _get_env("RESULTS_DIR", "results")

# Rate limiting
RATE_LIMIT_DELAY: float = _get_float("RATE_LIMIT_DELAY", 2.0)

# Retry behaviour
MAX_RETRIES: int = _get_int("MAX_RETRIES", 3)
