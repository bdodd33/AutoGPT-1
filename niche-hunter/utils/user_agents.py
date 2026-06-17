"""
utils/user_agents.py
Pool of realistic desktop browser User-Agent strings.
Rotate these on every request to reduce the fingerprint signature.
"""


def random_agent() -> str:
    """
    Return a randomly chosen User-Agent string from the built-in pool.
    The pool covers recent Chrome, Firefox, and Safari on Windows/macOS.
    """
    pass
