"""
config.py
All constants, thresholds, and settings for niche-hunter.
Edit these values to tune scoring behaviour.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── API Keys ──────────────────────────────────────────────────────────────────
REDDIT_CLIENT_ID     = os.getenv("REDDIT_CLIENT_ID", "")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET", "")
REDDIT_USER_AGENT    = os.getenv("REDDIT_USER_AGENT", "niche-hunter/1.0")
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY", "")
PROXY_URL            = os.getenv("PROXY_URL", None)

# ── Rate Limiting ─────────────────────────────────────────────────────────────
AMAZON_DELAY_MIN     = 3.0   # seconds between Amazon requests
AMAZON_DELAY_MAX     = 7.0
DEFAULT_DELAY_MIN    = 1.0
DEFAULT_DELAY_MAX    = 3.0
MAX_RETRIES          = 3

# ── Cache ─────────────────────────────────────────────────────────────────────
CACHE_DIR            = "cache"
CACHE_TTL_HOURS      = 24

# ── Scoring Weights ───────────────────────────────────────────────────────────
WEIGHT_DEMAND        = 0.40
WEIGHT_SUPPLY        = 0.35
WEIGHT_COMPETITION   = 0.25

# ── Priority Thresholds ───────────────────────────────────────────────────────
PRIORITY_GAP_SCORE        = 70    # minimum gap score to flag as PRIORITY
PRIORITY_MAX_RESULTS      = 100   # max Amazon results for PRIORITY
PRIORITY_MIN_TREND_SCORE  = 40    # min Google Trends 90-day avg
PRIORITY_MAX_REVIEWS      = 50    # max avg reviews on top 3 books

# ── Amazon Scraping ───────────────────────────────────────────────────────────
AMAZON_BASE_URL      = "https://www.amazon.com/s"
AMAZON_DEPT          = "stripbooks"
AMAZON_TOP_N         = 10   # how many results to analyse per keyword

# ── Google Trends ─────────────────────────────────────────────────────────────
TRENDS_TIMEFRAME     = "today 3-m"   # 90-day window
TRENDS_GEO           = "US"
TRENDS_CATEGORY      = 22            # Books & Literature

# ── Reddit ────────────────────────────────────────────────────────────────────
REDDIT_SUBREDDITS    = [
    "suggestmeabook",
    "kindle",
    "books",
    "AmazonKDP",
    "selfpublish",
]
REDDIT_POST_LIMIT    = 100

# ── Output ────────────────────────────────────────────────────────────────────
RESULTS_DIR          = "results"
LOGS_DIR             = "logs"
