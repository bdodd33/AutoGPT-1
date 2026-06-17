"""
utils/rate_limiter.py
Simple sleep-based rate limiting to avoid triggering anti-bot measures.
"""

import time
import random


def delay(min_s: float = 1.0, max_s: float = 3.0) -> None:
    """Sleep for a random duration between min_s and max_s seconds."""
    time.sleep(random.uniform(min_s, max_s))
