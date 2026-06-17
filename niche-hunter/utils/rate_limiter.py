"""
utils/rate_limiter.py
Simple sleep-based rate limiting to avoid triggering anti-bot measures.
"""


def delay(min_s: float, max_s: float) -> None:
    """
    Sleep for a random duration uniformly sampled from [min_s, max_s] seconds.
    Call between consecutive requests to the same service.
    """
    pass
