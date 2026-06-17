"""
scrapers/google_books.py
Queries the Google Books API to measure published book supply for a keyword.
Works without an API key (uses public quota) but respects GOOGLE_BOOKS_API_KEY
from config for a higher rate limit.
"""


def count_books(keyword: str) -> int:
    """
    Query the Google Books API for the given keyword and return the total
    number of volumes found (totalItems in the API response).
    Returns 0 on any error or if the API key is unavailable.
    """
    pass


def get_top_books(keyword: str, limit: int = 5) -> list[dict]:
    """
    Fetch metadata for the top `limit` books matching the keyword.
    Each dict contains: title, authors, published_date, description.
    Returns an empty list on any error.
    """
    pass
